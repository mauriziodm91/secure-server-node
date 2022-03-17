const fs = require('fs')
const https = require('https')
const express = require('express')
const path = require('path')
const helmet = require('helmet')
const dotenv = require('dotenv')
const passport = require('passport')
const cookieSession = require('cookie-session')
const { Strategy } = require('passport-google-oauth20')
require('dotenv').config()

const PORT = 3000

function checkLoggedIn(req, res, next) {
  const isLoggedIn = true
  if (!isLoggedIn) {
    res.status(401).json({
      error: 'You must log in!',
    })
  }
  next()
}

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
}

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
}

function verifyCallback(accessToken, refreshToken, profile, done) {
  console.log('Google Profile', profile)
  done(null, profile)
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))

const app = express()

app.use(helmet())

app.use(
  cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
)

app.use(passport.initialize())

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email'],
  })
)

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/',
    session: false,
  }),
  (req, res) => {
    console.log('Google Called us back')
  }
)

app.get('/auth/logout', (req, res) => {})

app.get('/secret', checkLoggedIn, (req, res) => {
  return res.send('the secret is 45')
})

app.get('/failure', (req, res) => {
  return res.send('failed to login')
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

https
  .createServer(
    {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
  })