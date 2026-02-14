const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
  try {
    // Try to connect to MongoDB Atlas first
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // timeout after 5 seconds
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    // If Atlas fails, use in-memory MongoDB for development
    console.log('⚠️  MongoDB Atlas unavailable, using in-memory MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory MongoDB for development');
    
    // Seed some initial data
    await seedDatabase();
  }
}

async function seedDatabase() {
  const User = require('./models/User');
  const Room = require('./models/Room');
  
  // Check if we already have data
  const userCount = await User.countDocuments();
  if (userCount > 0) return;
  
  // Create admin user
  const bcrypt = require('bcryptjs');
  const adminPassword = await bcrypt.hash('Ajaykumar@123', 10);
  const admin = await User.create({
    fullName: 'Palikila Ajay Kumar',
    email: 'ajaykumarpalikila@gmail.com',
    username: 'ajaykumar',
    password: adminPassword,
    role: 'admin'
  });

  // Create dummy regular user for testing
  const userPassword = await bcrypt.hash('Venkat@123', 10);
  await User.create({
    fullName: 'Test User',
    email: 'venkat@gmail.com',
    username: 'venkat',
    password: userPassword,
    role: 'user'
  });
  
  // Create sample rooms
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
      name: 'Training Room',
      description: 'Spacious training room equipped for workshops and training sessions',
      createdBy: admin._id
    }
  ]);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'Room Booking API is running!' });
});

// Start server only after DB connection
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});