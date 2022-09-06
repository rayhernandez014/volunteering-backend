const eventsRouter = require('express').Router()
const Event = require('../models/event')
const middleware = require('../utils/middleware')
const { cloudinary } = require('../utils/config')

eventsRouter.get('/', async (request, response) => {

  const currentDate = Date()

  const events = await Event.find({ endDate: { $gte: currentDate } }).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.json(events)
})

eventsRouter.get('/going', middleware.userExtractor, async (request, response) => {

  const currentDate = Date()

  const user = request.user

  const events = await Event.find({ volunteers: user._id, endDate: { $gte: currentDate } }).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.json(events)
})

eventsRouter.get('/history', middleware.userExtractor, async (request, response) => {

  const currentDate = Date()

  const user = request.user

  const events = await Event.find({ volunteers: user._id, endDate: { $lt: currentDate } }).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.json(events)
})

eventsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const { title, description, latitude, longitude, address, category, spots, startDate, endDate, image } = request.body

  const author = request.user

  let cloudinaryResponse = null

  if (image) {
    cloudinaryResponse = await cloudinary.uploader.upload(image, {
      upload_preset: 'events'
    })
  }

  const event = new Event({
    title: title,
    description: description,
    author: author.id,
    latitude: latitude,
    longitude: longitude,
    address: address,
    category: category ?? '',
    spots: spots,
    volunteers: [],
    startDate: startDate,
    endDate: endDate,
    image: cloudinaryResponse?.public_id ?? ''
  })

  const savedEvent = await event.save()

  author.createdEvents = author.createdEvents.concat(savedEvent._id)
  await author.save()

  const eventToReturn = await Event.findById(savedEvent._id).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.status(201).json(eventToReturn)

})

eventsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

  const event = await Event.findById(request.params.id).exec()

  if (!event) {
    return response.status(404).json({ error: 'event does not exist' })
  }

  const author = request.user

  if (author._id.toString() !== event.author.toString()) {
    return response
      .status(401)
      .json({ error: 'only the creator can delete this event' })
  }

  if (event.image) {
    await cloudinary.uploader.destroy(event.image)
  }

  await Event.findByIdAndRemove(request.params.id).exec()

  author.createdEvents = author.createdEvents.filter(e => e._id.toString() !== request.params.id)
  await author.save()

  response.status(204).end()

})

eventsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
  const { title, description, latitude, longitude, address, category, spots, startDate, endDate, image }  = request.body

  const event = await Event.findById(request.params.id).exec()

  if (!event) {
    return response.status(404).json({ error: 'event does not exist' })
  }

  const user = request.user

  if (user._id.toString() !== event.author.toString()) {
    return response
      .status(401)
      .json({ error: 'only the creator can update this event' })
  }

  if (event.image) {
    await cloudinary.uploader.destroy(event.image)
  }

  let cloudinaryResponse = null

  if (image) {
    cloudinaryResponse = await cloudinary.uploader.upload(image, {
      upload_preset: 'events'
    })
  }

  const receivedEvent = {
    title: title,
    description: description,
    latitude: latitude,
    longitude: longitude,
    address: address,
    category: category,
    spots: spots,
    startDate: startDate,
    endDate: endDate,
    image: cloudinaryResponse?.public_id ?? ''
  }

  const updatedEvent= await Event.findByIdAndUpdate(request.params.id, receivedEvent, {
    new: true,
    runValidators: true,
    context: 'query'
  }).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.json(updatedEvent)
})

eventsRouter.put('/:id/rsvp', middleware.userExtractor, async (request, response) => {

  const event = await Event.findById(request.params.id).exec()

  if (!event) {
    return response.status(404).json({ error: 'event does not exist' })
  }

  const user = request.user

  let newVolunteersList = []

  if (event.volunteers.find(v => v._id.toString() === user._id.toString())){
    newVolunteersList = event.volunteers.filter(v => v._id.toString() !== user._id.toString())
  }
  else {
    if ((event.volunteers.length < event.spots) || (event.spots === -1)) {
      newVolunteersList = event.volunteers.concat(user._id)
    }
    else{
      return response.status(401).json({ error: 'No spots available' })
    }
  }

  const receivedEvent = {
    volunteers : newVolunteersList
  }

  const updatedEvent= await Event.findByIdAndUpdate(request.params.id, receivedEvent, {
    new: true,
    runValidators: true,
    context: 'query'
  }).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    }).exec()
  response.json(updatedEvent)
})

module.exports = eventsRouter