const express = require('express');
const Room = require('../models/Room');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all rooms (anyone can view)
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'fullName');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new room (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if room with same name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ 
        message: 'Room with this name already exists' 
      });
    }

    const room = new Room({
      name,
      description,
      createdBy: req.user._id
    });

    await room.save();
    await room.populate('createdBy', 'fullName');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if new name conflicts with existing room
    if (name !== room.name) {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return res.status(400).json({ 
          message: 'Room with this name already exists' 
        });
      }
    }

    room.name = name || room.name;
    room.description = description || room.description;
    
    await room.save();
    await room.populate('createdBy', 'fullName');

    res.json({
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;