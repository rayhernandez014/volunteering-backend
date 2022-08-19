const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const middleware = require('../utils/middleware')
const config = require('../utils/config')

usersRouter.get('/', middleware.userExtractor, async (request, response) => {
  const users = await User.find({}).populate('createdEvents', {
    title: 1
  })
    .populate('respondedEvents', {
      title: 1
    })
  response.json(users)
})

usersRouter.post('/', async (request, response) => {
  const { email, name, password } = request.body

  if (!password) {
    return response.status(400).json({
      error: 'Password is missing'
    })
  } else if (password.length < 8) {
    return response.status(400).json({
      error: 'Password should be at least 8 characters long'
    })
  }

  const existingUser= await User.findOne({ email })
  if (existingUser) {
    return response.status(400).json({ error: 'This email is already registered' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    email: email,
    name: name,
    passwordHash: passwordHash,
    createdEvents: [],
    respondedEvents: []
  })

  const savedUser = await user.save()

  const userToReturn = await User.findById(savedUser._id).populate('createdEvents', {
    title: 1
  })
    .populate('respondedEvents', {
      title: 1
    })

  response.status(201).json(userToReturn)
})

usersRouter.delete( '/:id', middleware.userExtractor, async (request, response) => {

  const user = await User.findById(request.params.id)

  if (!user) {
    return response.status(404).json({ error: 'user does not exist' })
  }

  const loggedUser = request.user

  if (loggedUser._id.toString() !== user._id.toString()) {
    return response
      .status(401)
      .json({ error: 'only the user can delete itself' })
  }

  await config.redisClient.del(request.params.id)

  await User.findByIdAndRemove(request.params.id)
  response.status(204).end()

})

usersRouter.put('/:id', middleware.userExtractor ,async (request, response) => {
  const body = request.body

  const user = await User.findById(request.params.id)

  if (!user) {
    return response.status(404).json({ error: 'user does not exist' })
  }

  const loggedUser = request.user

  if (loggedUser._id.toString() !== user._id.toString()) {
    return response
      .status(401)
      .json({ error: 'only the user can modify itself' })
  }

  const receivedUser = {
    name: body.name,
    respondedEvents: body.respondedEvents
  }

  const updatedUser = await User.findByIdAndUpdate(request.params.id, receivedUser, {
    new: true,
    runValidators: true,
    context: 'query'
  })
  response.json(updatedUser)
})

module.exports = usersRouter