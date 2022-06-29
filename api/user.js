const express = require('express')
const router = express.Router()

// Controllers
const { signUp, verifyAccount, login, resendLink } = require('../controllers/auth')

// @route   GET api/user/test
// @desc    Test user route
// @access  Public
router.get('/test', (req, res) => {
  res.json({ msg: 'User works' })
})

// @route   POST api/user/register
// @desc    Register new user
// @access  Public
router.post('/register', signUp)

// @route   POST api/user/login
// @desc    User login
// @access  Public
router.post('/login', login)

// @route   POST api/user/confirmation/:token
// @desc    Register new user
// @access  Public
router.get('/confirmation/:token', verifyAccount)

// @route   POST api/user/resendLink
// @desc    Resend link to user
// @access  Public
router.post('/resendLink', resendLink)

module.exports = router
