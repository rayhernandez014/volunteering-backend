require('dotenv').config()
const redis = require('redis')
const cloudinary = require('cloudinary').v2

const PORT = process.env.PORT

const MONGODB_URI = process.env.MONGODB_URI

const SECRET = process.env.SECRET

const initializeRedis = () => {
  if (process.env.NODE_ENV === 'development') {
    const redisClient = redis.createClient()
    redisClient.on('error', (err) => console.log('Redis Client Error: ', err))
    return redisClient
  }
  else if (process.env.NODE_ENV === 'production') {
    const redisClient = redis.createClient({ url: process.env.REDISCLOUD_URL })
    redisClient.on('error', (err) => console.log('Redis Client Error: ', err))
    return redisClient
  }
}

const redisClient = initializeRedis()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

module.exports = {
  MONGODB_URI,
  redisClient,
  PORT,
  SECRET,
  cloudinary
}