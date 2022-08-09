const express = require('express')
const helmet = require('helmet')
require('express-async-errors')
const cors = require('cors')
const config = require('./utils/config')
const mongoose = require('mongoose')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const logoutRouter = require('./controllers/logout')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')

const app = express()
app.use(helmet())

mongoose.connect(config.MONGODB_URI)

config.redisClient.connect()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

app.use(middleware.requestLogger)

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/logout', logoutRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)


process.on('SIGINT', () => {
  mongoose.connection.close(function () {
    logger.info('Mongoose disconnected on app termination')
    process.exit(0)
  })
  config.redisClient.quit()
})

module.exports = app
