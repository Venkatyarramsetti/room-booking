const mongoose = require('mongoose');
const { TIME_SLOTS } = require('../constants/timeSlots');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  idProof: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [{
    type: String,
    required: true,
    enum: TIME_SLOTS
  }],
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  }
}, {
  timestamps: true
});

// Prevent double booking: same room + same date + same time slot
bookingSchema.index({ room: 1, date: 1, timeSlots: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);