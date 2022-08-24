const eventsRouter = require('express').Router()
const Event = require('../models/event')
const middleware = require('../utils/middleware')

eventsRouter.get('/', async (request, response) => {
  const events = await Event.find({}).populate('author', {
    email: 1,
    name: 1
  })
    .populate('volunteers', {
      email: 1,
      name: 1
    })
  response.json(events)
})

eventsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const { title, description, latitude, longitude, category, spots, startDate, endDate } = request.body

  const author = request.user

  const event = new Event({
    title: title,
    description: description,
    author: author.id,
    latitude: latitude,
    longitude: longitude,
    category: category ?? '',
    spots: spots,
    volunteers: [],
    startDate: startDate,
    endDate: endDate
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
    })
  response.status(201).json(eventToReturn)

})

eventsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

  const event = await Event.findById(request.params.id)

  if (!event) {
    return response.status(404).json({ error: 'event does not exist' })
  }

  const author = request.user

  if (author._id.toString() !== event.author.toString()) {
    return response
      .status(401)
      .json({ error: 'only the creator can delete this event' })
  }

  await Event.findByIdAndRemove(request.params.id)

  author.createdEvents = author.createdEvents.filter(e => e._id.toString() !== request.params.id)
  await author.save()

  response.status(204).end()

})

eventsRouter.put('/:id', middleware.userExtractor, async (request, response) => {
  const { title, description, latitude, longitude, category, spots, startDate, endDate }  = request.body

  const event = await Event.findById(request.params.id)

  if (!event) {
    return response.status(404).json({ error: 'event does not exist' })
  }

  const user = request.user

  if (user._id.toString() !== event.author.toString()) {
    return response
      .status(401)
      .json({ error: 'only the creator can update this event' })
  }

  const receivedEvent = {
    title: title,
    description: description,
    latitude: latitude,
    longitude: longitude,
    category: category,
    spots: spots,
    startDate: startDate,
    endDate: endDate
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
    })
  response.json(updatedEvent)
})

eventsRouter.put('/:id/rsvp', middleware.userExtractor, async (request, response) => {

  const event = await Event.findById(request.params.id)

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
    })
  response.json(updatedEvent)
})

module.exports = eventsRouter