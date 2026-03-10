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
