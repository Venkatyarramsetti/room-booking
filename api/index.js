const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'room-booking-secret-2026';

// ─── In-Memory Store (no MongoDB needed) ─────────────────────────────────────

let users = [];
let rooms = [];
let bookings = [];
let nextRoomId = 4;
let nextBookingId = 1;
let initialized = false;

async function initData() {
  if (initialized) return;
  initialized = true;

  const adminHash = await bcrypt.hash('Ajaykumar@123', 10);
  const userHash  = await bcrypt.hash('Venkat@123', 10);

  users = [
    { id: '1', fullName: 'Palikila Ajay Kumar', email: 'ajaykumarpalikila@gmail.com', username: 'ajaykumar', password: adminHash, role: 'admin' },
    { id: '2', fullName: 'Venkat Yarramsetti',  email: 'venkat@gmail.com',             username: 'venkat',    password: userHash,  role: 'user'  }
  ];

  const ts = new Date().toISOString();
  rooms = [
    { id: '1', name: 'Conference Room A', description: 'Large conference room with modern amenities, perfect for team meetings and presentations', createdBy: { id: '1', fullName: 'Palikila Ajay Kumar' }, createdAt: ts },
    { id: '2', name: 'Meeting Room B',    description: 'Medium-sized meeting room ideal for small group discussions',                              createdBy: { id: '1', fullName: 'Palikila Ajay Kumar' }, createdAt: ts },
    { id: '3', name: 'Boardroom C',       description: 'Executive boardroom for high-level meetings and presentations',                            createdBy: { id: '1', fullName: 'Palikila Ajay Kumar' }, createdAt: ts }
  ];
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, access denied' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    if (!user) return res.status(401).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  } catch (_) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied. Admin only.' });
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    if (users.find(u => u.email === email || u.username === username)) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const newUser = { id: String(users.length + 1), fullName, email, username, password: hashed, role: 'user' };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered successfully', token, user: { id: newUser.id, fullName, email, username, role: 'user' } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user.id, fullName: user.fullName, email: user.email, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── Room Routes ──────────────────────────────────────────────────────────────

app.get('/api/rooms', (req, res) => {
  res.json([...rooms].reverse());
});

app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
});

app.post('/api/rooms', auth, adminAuth, (req, res) => {
  const { name, description } = req.body;
  if (rooms.find(r => r.name === name)) return res.status(400).json({ message: 'Room with this name already exists' });
  const room = { id: String(nextRoomId++), name, description, createdBy: { id: req.user.id, fullName: req.user.fullName }, createdAt: new Date().toISOString() };
  rooms.push(room);
  res.status(201).json({ message: 'Room created successfully', room });
});

app.put('/api/rooms/:id', auth, adminAuth, (req, res) => {
  const { name, description } = req.body;
  const room = rooms.find(r => r.id === req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (name && name !== room.name && rooms.find(r => r.name === name)) {
    return res.status(400).json({ message: 'Room with this name already exists' });
  }
  room.name        = name        || room.name;
  room.description = description || room.description;
  res.json({ message: 'Room updated successfully', room });
});

app.delete('/api/rooms/:id', auth, adminAuth, (req, res) => {
  const idx = rooms.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Room not found' });
  rooms.splice(idx, 1);
  res.json({ message: 'Room deleted successfully' });
});

// ─── Booking Routes ───────────────────────────────────────────────────────────

app.get('/api/bookings', auth, (req, res) => {
  const list = req.user.role === 'admin' ? bookings : bookings.filter(b => b.userId === req.user.id);
  res.json([...list].reverse().map(b => ({
    ...b,
    user: users.find(u => u.id === b.userId) || null,
    room: rooms.find(r => r.id === b.roomId) || null
  })));
});

app.get('/api/bookings/available-slots/:roomId/:date', (req, res) => {
  const { roomId, date } = req.params;
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  const allSlots = ['09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00'];
  const bookedSlots = bookings.filter(b => b.roomId === roomId && b.date === date && b.status === 'confirmed').flatMap(b => b.timeSlots);
  res.json({ room: room.name, date, availableSlots: allSlots.filter(s => !bookedSlots.includes(s)), bookedSlots });
});

app.post('/api/bookings', auth, (req, res) => {
  const { roomId, date, timeSlots, fullName, phoneNumber, idProof } = req.body;
  if (!fullName || !idProof) return res.status(400).json({ message: 'Full name and ID proof are required' });
  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  const validSlots = ['09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00'];
  const invalid = timeSlots.filter(s => !validSlots.includes(s));
  if (invalid.length > 0) return res.status(400).json({ message: `Invalid time slots: ${invalid.join(', ')}` });
  const conflicts = bookings.filter(b => b.roomId === roomId && b.date === date && b.status === 'confirmed' && b.timeSlots.some(s => timeSlots.includes(s)));
  if (conflicts.length > 0) {
    const taken = [...new Set(conflicts.flatMap(b => b.timeSlots.filter(s => timeSlots.includes(s))))];
    return res.status(400).json({ message: `Time slots already booked: ${taken.join(', ')}` });
  }
  const booking = { id: String(nextBookingId++), userId: req.user.id, roomId, fullName, phoneNumber, idProof, date, timeSlots, status: 'confirmed', createdAt: new Date().toISOString() };
  bookings.push(booking);
  res.status(201).json({ message: 'Booking created successfully', booking: { ...booking, user: { fullName: req.user.fullName, username: req.user.username }, room: { name: room.name } } });
});

app.put('/api/bookings/:id/cancel', auth, (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (req.user.role !== 'admin' && booking.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });
  booking.status = 'cancelled';
  res.json({ message: 'Booking cancelled successfully', booking });
});

app.delete('/api/bookings/:id', auth, adminAuth, (req, res) => {
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Booking not found' });
  bookings.splice(idx, 1);
  res.json({ message: 'Booking deleted successfully' });
});

// ─── Health & Ping ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', mode: 'in-memory', users: users.length, rooms: rooms.length, bookings: bookings.length });
});

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, mode: 'in-memory', users: users.length, rooms: rooms.length });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Room Booking API is running (in-memory mode)!' });
});

// ─── Serverless Handler ───────────────────────────────────────────────────────

module.exports = async (req, res) => {
  await initData();
  return app(req, res);
};
// --- Models -------------------------------------------------------------------
const userSchema = new mongoose.Schema({
  fullName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  username:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });
const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
const bookingSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room:        { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  fullName:    { type: String, required: true, trim: true },
  phoneNumber: { type: String, trim: true },
  idProof:     { type: String, required: true, trim: true },
  date:        { type: Date, required: true },
  timeSlots: [{
    type: String, required: true,
    enum: ['09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00',
           '13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00']
  }],
  status: { type: String, enum: ['confirmed','cancelled'], default: 'confirmed' }
}, { timestamps: true });
bookingSchema.index({ room: 1, date: 1, timeSlots: 1 }, { unique: true });
const User    = mongoose.models.User    || mongoose.model('User',    userSchema);
const Room    = mongoose.models.Room    || mongoose.model('Room',    roomSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
// --- Auth Middleware ----------------------------------------------------------
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, access denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
const adminAuth = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied. Admin only.' });
};
// --- Seed ---------------------------------------------------------------------
async function seedDatabase() {
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
    console.log('Admin user created');
    if ((await Room.countDocuments()) === 0) {
      await Room.create([
        { name: 'Conference Room A', description: 'Large conference room with modern amenities', createdBy: admin._id },
        { name: 'Meeting Room B',    description: 'Medium-sized meeting room for small groups',  createdBy: admin._id },
        { name: 'Boardroom C',       description: 'Executive boardroom for high-level meetings', createdBy: admin._id }
      ]);
      console.log('Sample rooms created');
    }
  }
}
// --- DB Connection ------------------------------------------------------------
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in Vercel Environment Variables.');
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    bufferCommands: false
  });
  isConnected = true;
  console.log('Connected to MongoDB Atlas');
  await seedDatabase();
}
// --- Auth Routes --------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User with this email or username already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, username, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'User registered successfully', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login successful', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// --- Room Routes --------------------------------------------------------------
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find().populate('createdBy', 'fullName').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.get('/api/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('createdBy', 'fullName');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.post('/api/rooms', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (await Room.findOne({ name })) return res.status(400).json({ message: 'Room with this name already exists' });
    const room = await Room.create({ name, description, createdBy: req.user._id });
    await room.populate('createdBy', 'fullName');
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.put('/api/rooms/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (name && name !== room.name && await Room.findOne({ name })) {
      return res.status(400).json({ message: 'Room with this name already exists' });
    }
    room.name        = name        || room.name;
    room.description = description || room.description;
    await room.save();
    await room.populate('createdBy', 'fullName');
    res.json({ message: 'Room updated successfully', room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.delete('/api/rooms/:id', auth, adminAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// --- Booking Routes -----------------------------------------------------------
app.get('/api/bookings', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    const bookings = await Booking.find(query)
      .populate('user', 'fullName username')
      .populate('room', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.get('/api/bookings/available-slots/:roomId/:date', async (req, res) => {
  try {
    const { roomId, date } = req.params;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const allSlots = ['09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00',
                      '13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00'];
    const bookings = await Booking.find({ room: roomId, date: new Date(date), status: 'confirmed' });
    const bookedSlots = bookings.flatMap(b => b.timeSlots);
    const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));
    res.json({ room: room.name, date, availableSlots, bookedSlots });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.post('/api/bookings', auth, async (req, res) => {
  try {
    const { roomId, date, timeSlots, fullName, phoneNumber, idProof } = req.body;
    if (!fullName || !idProof) return res.status(400).json({ message: 'Full name and ID proof are required' });
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const validSlots = ['09:00-10:00','10:00-11:00','11:00-12:00','12:00-13:00',
                        '13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00'];
    const invalidSlots = timeSlots.filter(s => !validSlots.includes(s));
    if (invalidSlots.length > 0) return res.status(400).json({ message: `Invalid time slots: ${invalidSlots.join(', ')}` });
    const conflicts = await Booking.find({ room: roomId, date: new Date(date), status: 'confirmed', timeSlots: { $in: timeSlots } });
    if (conflicts.length > 0) {
      const conflictingSlots = [...new Set(conflicts.flatMap(b => b.timeSlots.filter(s => timeSlots.includes(s))))];
      return res.status(400).json({ message: `Time slots already booked: ${conflictingSlots.join(', ')}` });
    }
    const booking = await Booking.create({ user: req.user._id, room: roomId, fullName, phoneNumber, idProof, date: new Date(date), timeSlots });
    await booking.populate(['user', 'room']);
    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.put('/api/bookings/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    booking.status = 'cancelled';
    await booking.save();
    await booking.populate(['user', 'room']);
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
app.delete('/api/bookings/:id', auth, adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
// --- Health & Root ------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb_uri_set: !!process.env.MONGODB_URI,
    jwt_secret_set: !!process.env.JWT_SECRET,
    db_state: mongoose.connection.readyState
  });
});
app.get('/api', (req, res) => {
  res.json({ message: 'Room Booking API is running!' });
});
// --- Serverless Handler -------------------------------------------------------
module.exports = async (req, res) => {
  // Ping endpoint - no DB needed, used to verify env vars are set
  if (req.url === '/api/ping' || req.url === '/api/ping/') {
    return res.json({
      ok: true,
      mongodb_uri_set: !!process.env.MONGODB_URI,
      jwt_secret_set: !!process.env.JWT_SECRET,
      node_env: process.env.NODE_ENV || 'not set'
    });
  }
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error:', err.message);
    return res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
  return app(req, res);
};
