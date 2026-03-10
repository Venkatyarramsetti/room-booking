const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ path: '../backend/.env' });

// Import routes
const authRoutes = require('../backend/routes/auth');
const roomRoutes = require('../backend/routes/rooms');
const bookingRoutes = require('../backend/routes/bookings');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-deployment-url.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Global connection variable
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

// Connect to MongoDB
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('✅ Connected to MongoDB');
      return mongoose;
    }).catch(async (error) => {
      console.log('⚠️ MongoDB Atlas unavailable, using in-memory MongoDB...');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      return mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        bufferCommands: false,
      });
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'Room Booking API is running!' });
});

// Serverless function handler
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};