const express = require('express')
const helmet = require('helmet')
require('express-async-errors')
const cors = require('cors')
const config = require('./utils/config')
const mongoose = require('mongoose')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')

const app = express()
app.use(helmet())

mongoose.connect(config.MONGODB_URI)

app.use(cors())
app.use(express.json())

app.use(middleware.requestLogger)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)


process.on('SIGINT', () => {
  mongoose.connection.close(function () {
    logger.info('Mongoose disconnected on app termination')
    process.exit(0)
  })
})

module.exports = app
