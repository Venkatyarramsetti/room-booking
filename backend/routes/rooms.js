const express = require('express');
const Room = require('../models/Room');
const { auth, adminAuth } = require('../middleware/auth');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const router = express.Router();

const uploadRoomImage = async (imageBase64) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const result = await cloudinary.uploader.upload(imageBase64, {
    folder: 'room-booking/rooms'
  });

  return {
    imageUrl: result.secure_url,
    imagePublicId: result.public_id
  };
};

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
    const { name, description, imageBase64 } = req.body;

    // Check if room with same name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ 
        message: 'Room with this name already exists' 
      });
    }

    const imageData = imageBase64 ? await uploadRoomImage(imageBase64) : {};

    const room = new Room({
      name,
      description,
      ...imageData,
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
    const { name, description, imageBase64 } = req.body;
    
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

    if (imageBase64) {
      if (room.imagePublicId && isCloudinaryConfigured()) {
        await cloudinary.uploader.destroy(room.imagePublicId);
      }

      const imageData = await uploadRoomImage(imageBase64);
      room.imageUrl = imageData.imageUrl;
      room.imagePublicId = imageData.imagePublicId;
    }
    
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

    if (room.imagePublicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(room.imagePublicId);
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;