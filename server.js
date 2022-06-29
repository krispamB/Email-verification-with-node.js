const express = require('express')
const mongoose =require('mongoose')
const bodyparser = require('body-parser')

// User model
const user = require('./api/user')

const app = express()

// Bodyparser for URLencoded
app.use(bodyparser.urlencoded({ extended: false }))
// For json
app.use(bodyparser.json())

// Initialize mongoURI 
const db = require('./config/keys').mongoURI

// Connect to mongo db
mongoose
  .connect(db)
  .then(() => console.log('Everywhere Stew'))
  .catch(err => console.log(err))

// Start server on port 5000
const PORT = 5000

// Use routes
app.use('/api/user', user)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})