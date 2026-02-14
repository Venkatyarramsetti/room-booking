# Room Booking Application

A simple web app to book meeting rooms. Users can register, login, and book time slots. Admins can manage rooms.

## What it does
- **Users:** Register/login, view rooms, book time slots (9AM-5PM), manage bookings
- **Admins:** Create/edit rooms, view all bookings
- **System:** Prevents double booking, shows available slots in real-time

## How it works
1. User registers/logs in → Gets access token
2. User picks room + date → System shows available time slots  
3. User selects slots → Booking saved to database
4. Admin manages rooms and views all bookings

## Tech Stack
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite  
- **Database:** MongoDB Atlas (free)

## Setup & Run

### 1. Install dependencies
```bash
cd backend
npm install

cd ../frontend  
npm install
```

### 2. Setup MongoDB
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster, get connection string
3. Copy `backend/.env.example` to `backend/.env`
4. Add your MongoDB connection string to `.env` file

### 3. Start the app
```bash
# Terminal 1: Start backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2: Start frontend (http://localhost:5173)  
cd frontend
npm run dev
```

### 4. Add demo data (optional)
```bash
cd backend
npm run seed
```

### 5. Open browser
Go to `http://localhost:5173`

## Demo Login (after running seed)
- **Admin:** username: `ajaykumar`, password: `Ajaykumar@123`

## Need Help?
- Make sure MongoDB Atlas IP whitelist includes your IP
- Check both servers are running on ports 3000 and 5173
- Verify `.env` file has correct MongoDB connection string