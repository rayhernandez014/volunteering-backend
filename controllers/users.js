const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const customers = await User.find({})
  response.json(customers)
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
    passwordHash: passwordHash
  })

  const savedUser = await user.save()

  response.status(201).json(savedUser)
})

usersRouter.delete( '/:id', async (request, response) => {

  await User.findByIdAndRemove(request.params.id)
  response.status(204).end()

})

usersRouter.put('/:id', async (request, response) => {
  const body = request.body

  const receivedUser = {
    name: body.name
  }

  const updatedUser = await User.findByIdAndUpdate(request.params.id, receivedUser, {
    new: true,
    runValidators: true,
    context: 'query'
  })
  response.json(updatedUser)
})

module.exports = usersRouter