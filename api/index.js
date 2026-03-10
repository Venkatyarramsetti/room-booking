const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '../backend/.env' });

// Import routes
const authRoutes = require('../backend/routes/auth');
const roomRoutes = require('../backend/routes/rooms');
const bookingRoutes = require('../backend/routes/bookings');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Seed admin user and sample rooms if not exist
async function seedDatabase() {
  const User = require('../backend/models/User');
  const Room = require('../backend/models/Room');
  const bcrypt = require('bcryptjs');

  const adminExists = await User.findOne({ username: 'ajaykumar' });
  if (!adminExists) {
    const adminPassword = await bcrypt.hash('Ajaykumar@123', 10);
    const admin = await User.create({
      fullName: 'Palikila Ajay Kumar',
      email: 'ajaykumarpalikila@gmail.com',
      username: 'ajaykumar',
      password: adminPassword,
      role: 'admin'
    });
    console.log('✅ Admin user created');

    const roomCount = await Room.countDocuments();
    if (roomCount === 0) {
      await Room.create([
        {
          name: 'Conference Room A',
          description: 'Large conference room with modern amenities, perfect for team meetings and presentations',
          createdBy: admin._id
        },
        {
          name: 'Meeting Room B',
          description: 'Medium-sized meeting room ideal for small group discussions',
          createdBy: admin._id
        },
        {
          name: 'Boardroom C',
          description: 'Executive boardroom for high-level meetings and presentations',
          createdBy: admin._id
        }
      ]);
      console.log('✅ Sample rooms created');
    }
  }
}

// Connect to MongoDB
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Go to Vercel Dashboard > Project > Settings > Environment Variables and add MONGODB_URI and JWT_SECRET.');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false,
  });

  isConnected = true;
  console.log('✅ Connected to MongoDB Atlas');
  await seedDatabase();
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb_uri_set: !!process.env.MONGODB_URI,
    jwt_secret_set: !!process.env.JWT_SECRET,
    db_state: mongoose.connection.readyState // 0=disconnected,1=connected,2=connecting,3=disconnecting
  });
});

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'Room Booking API is running!' });
});

// Serverless function handler
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  return app(req, res);
};