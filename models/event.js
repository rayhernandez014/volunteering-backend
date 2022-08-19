const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minLength: 3
  },
  description: {
    type: String,
    required: true,
    minLength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: [Number],
    required: true,
    validate: {
      validator: (v) => {
        return v.length === 2
      },
      message: 'location provided is invalid'
    }
  },
  category: String,
  spots: {
    type: Number,
    required: true
  },
  date: {
    type: [Date],
    required: true,
    validate: {
      validator: (v) => {
        return v.length === 2
      },
      message: 'date provided is invalid'
    }
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

eventSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Event = mongoose.model('Event', eventSchema)

module.exports = Event