const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');

const app = express();
const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'ajaykumar';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ajaykumar@123';
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@roombooking.local';
const DEFAULT_ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'Default Admin';

const configuredFrontendOrigins = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || 'http://localhost:5173,http://127.0.0.1:5173';

const allowedOrigins = configuredFrontendOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function parseUrlSafe(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isWildcardHostMatch(origin, allowedOrigin) {
  const originUrl = parseUrlSafe(origin);
  const allowedUrl = parseUrlSafe(allowedOrigin);

  if (!originUrl || !allowedUrl) return false;
  if (!allowedUrl.hostname.startsWith('*.')) return false;
  if (originUrl.protocol !== allowedUrl.protocol) return false;

  const allowedBaseHost = allowedUrl.hostname.slice(2);
  return originUrl.hostname === allowedBaseHost || originUrl.hostname.endsWith(`.${allowedBaseHost}`);
}

function isNetlifyPreviewMatch(origin, allowedOrigin) {
  const originUrl = parseUrlSafe(origin);
  const allowedUrl = parseUrlSafe(allowedOrigin);

  if (!originUrl || !allowedUrl) return false;
  if (originUrl.protocol !== allowedUrl.protocol) return false;
  if (!allowedUrl.hostname.endsWith('.netlify.app')) return false;

  return originUrl.hostname.endsWith(`--${allowedUrl.hostname}`);
}

function isOriginAllowed(origin) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) return true;
    if (isWildcardHostMatch(origin, allowedOrigin)) return true;
    if (isNetlifyPreviewMatch(origin, allowedOrigin)) return true;
    return false;
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header) and known browser origins.
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
  if (!DB_URI) {
    throw new Error('Mongo URI is missing. Set MONGO_URI (or MONGODB_URI) in backend/.env');
  }

  await mongoose.connect(DB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('✅ Connected to MongoDB');
}

async function ensureDefaultAdmin() {
  const User = require('./models/User');

  const existingAdmin = await User.findOne({ username: DEFAULT_ADMIN_USERNAME });
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  if (!existingAdmin) {
    await User.create({
      fullName: DEFAULT_ADMIN_FULLNAME,
      email: DEFAULT_ADMIN_EMAIL,
      username: DEFAULT_ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin'
    });
    console.log(`✅ Default admin created: ${DEFAULT_ADMIN_USERNAME}`);
    return;
  }

  existingAdmin.fullName = DEFAULT_ADMIN_FULLNAME;
  existingAdmin.email = DEFAULT_ADMIN_EMAIL;
  existingAdmin.password = hashedPassword;
  existingAdmin.role = 'admin';
  await existingAdmin.save();
  console.log(`✅ Default admin ensured: ${DEFAULT_ADMIN_USERNAME}`);
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
  return ensureDefaultAdmin();
}).then(() => {
  const PORT = process.env.PORT || 5000;
  console.log('CORS allowed origins:', allowedOrigins);
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});