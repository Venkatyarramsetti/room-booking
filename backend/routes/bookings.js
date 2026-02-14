const express = require('express');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all bookings (admin can see all, users see their own)
router.get('/', auth, async (req, res) => {
  try {
    let bookings;
    
    if (req.user.role === 'admin') {
      // Admin can see all bookings
      bookings = await Booking.find()
        .populate('user', 'fullName username')
        .populate('room', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can only see their own bookings
      bookings = await Booking.find({ user: req.user._id })
        .populate('room', 'name')
        .sort({ createdAt: -1 });
    }
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a specific room and date
router.get('/available-slots/:roomId/:date', async (req, res) => {
  try {
    const { roomId, date } = req.params;
    
    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // All possible time slots (9AM-5PM)
    const allSlots = [
      '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00',
      '15:00-16:00', '16:00-17:00'
    ];

    // Find bookings for this room and date
    const bookings = await Booking.find({
      room: roomId,
      date: new Date(date),
      status: 'confirmed'
    });

    // Get booked time slots
    const bookedSlots = [];
    bookings.forEach(booking => {
      bookedSlots.push(...booking.timeSlots);
    });

    // Calculate available slots
    const availableSlots = allSlots.filter(slot => 
      !bookedSlots.includes(slot)
    );

    res.json({
      room: room.name,
      date,
      availableSlots,
      bookedSlots
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new booking
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, date, timeSlots, fullName, phoneNumber, idProof } = req.body;

    // Validate required fields
    if (!fullName || !idProof) {
      return res.status(400).json({ 
        message: 'Full name and ID proof are required' 
      });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate time slots
    const validSlots = [
      '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00',
      '15:00-16:00', '16:00-17:00'
    ];
    
    const invalidSlots = timeSlots.filter(slot => !validSlots.includes(slot));
    if (invalidSlots.length > 0) {
      return res.status(400).json({ 
        message: `Invalid time slots: ${invalidSlots.join(', ')}` 
      });
    }

    // Check for conflicts (double booking)
    const conflictingBookings = await Booking.find({
      room: roomId,
      date: new Date(date),
      status: 'confirmed',
      timeSlots: { $in: timeSlots }
    });

    if (conflictingBookings.length > 0) {
      const conflictingSlots = [];
      conflictingBookings.forEach(booking => {
        conflictingSlots.push(...booking.timeSlots.filter(slot => 
          timeSlots.includes(slot)
        ));
      });
      
      return res.status(400).json({ 
        message: `Time slots already booked: ${[...new Set(conflictingSlots)].join(', ')}` 
      });
    }

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      room: roomId,
      fullName,
      phoneNumber,
      idProof,
      date: new Date(date),
      timeSlots
    });

    await booking.save();
    await booking.populate(['user', 'room']);

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only cancel their own bookings, admins can cancel any
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'cancelled';
    await booking.save();
    await booking.populate(['user', 'room']);

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete booking (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;