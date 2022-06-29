const User = require('../models/User')
const crypto = require('crypto')
const Bcrypt = require('bcryptjs')
require('dotenv').config()

// Mail
const nodemailer = require('nodemailer')
const { google } = require('googleapis')

// .env
const SENDER_EMAIL = process.env.SENDER_EMAIL
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI
const REFRESH_TOKEN = process.env.REFRESH_TOKEN
const HOST = process.env.HOST

// Functions
module.exports = {
  signUp: (req, res, next) => {
    const { name, email, password } = req.body
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (user) {
          return res.status(400).json({
            msg: 'This email address is already associated with another account',
          })
        } else {
          // Generate token and save
          const Token = crypto.randomBytes(16).toString('hex')
          const newUser = new User({
            name,
            email,
            password,
            Token,
          })
          console.log(newUser)

          Bcrypt.genSalt(10, (err, salt) => {
            Bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err
              newUser.password = hash
              newUser
                .save()
                .then((savedUser) => {
                  if (savedUser) {
                    // Send email
                    const oAuth2Client = new google.auth.OAuth2(
                      CLIENT_ID,
                      CLIENT_SECRET,
                      REDIRECT_URI
                    )
                    oAuth2Client.setCredentials({
                      refresh_token: REFRESH_TOKEN,
                    })

                    async function sendMail() {
                      try {
                        const accessToken = await oAuth2Client.getAccessToken()

                        const transport = nodemailer.createTransport({
                          service: 'gmail',
                          auth: {
                            type: 'OAuth2',
                            user: SENDER_EMAIL,
                            clientId: CLIENT_ID,
                            clientSecret: CLIENT_SECRET,
                            refreshToken: REFRESH_TOKEN,
                            accessToken: accessToken,
                          },
                          tls: {
                            rejectUnauthorized: false,
                          },
                        })

                        const url = `http://${HOST}/api/user/confirmation/${Token}`

                        const mailOptions = {
                          from: SENDER_EMAIL,
                          to: email,
                          subject: 'Account verification link',
                          html: `<h1>Email Confirmation</h1>
                                <h2>Hello ${name} </h2>
                                <p>Please verify your account by clicking the link below</p>
                                <a href=${url}> Click here</a>`,
                        }

                        const result = await transport.sendMail(mailOptions)
                        return result
                      } catch (error) {
                        return error
                      }
                    }

                    sendMail()
                      .then((result) => {
                        res.json({
                          msg: `A confirmation email has been sent to ${email}`,
                        })
                        console.log(result)
                      })
                      .catch((error) => {
                        console.log(error)
                      })
                  }
                })
                .catch((err) => console.log(err))
            })
          })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  },
  verifyAccount: (req, res, next) => {
    User.findOne({ Token: req.params.token }).then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      } else if (user.isVerified === true) {
        return res.status(200).json({ msg: 'User has already been verified' })
      } else {
        // Change isVerified to true
        user.isVerified = true
        user
          .save()
          .then((user) => {
            res.status(200).json({
              success: true,
              msg: 'Account verified successfully',
            })
          })
          .catch((err) => {
            res.status(500).json(err.message)
          })
      }
    })
  },
  login: (req, res, next) => {
    const { email, password } = req.body
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.status(401).json({
            msg: `The email adress ${email} is not associated with any account, please try again`,
          })
        } else if (!Bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ msg: 'Wrong password' })
        } else if (!user.isVerified === true) {
          return res.status(401).json({ msg: 'User has not been verified yet' })
        } else {
          return res.status(200).json({ msg: 'User succesfully logged in' })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  },
  resendLink: (req, res, next) => {
    const { email } = req.body
    User.findOne({ email: email }).then((user) => {
      // Check if user is in database
      if (!user) {
        return res
          .status(400)
          .json({
            msg: 'We are unable to find a user with that email. Make sure your email is correct',
          })
        // Check if user is verified
      } else if (user.isVerified === true) {
        return res
          .status(200)
          .json({ msg: 'This account has already been verified' })
        //
      } else {
        // const newToken = crypto.randomBytes(16).toString('hex')
        // User.findOneAndUpdate({ email: email, Token: newToken, new: true}).then(user => {
        //   console.log(user)
        //   return res.status(200).json({ msg: `A link has been sent to ${email}. If email is not recieved, look in spam emails`})
        // }).catch(err => {
        //   console.log(err)
        // })
      }
    })
  },
}
