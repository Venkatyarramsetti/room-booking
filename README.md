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
- **Media Storage:** Cloudinary

## Setup & Run

### 1. Install dependencies
```bash
cd backend
npm install

cd ../frontend  
npm install
```

### 2. Setup MongoDB
1. Copy `backend/.env.example` to `backend/.env`
2. Add your MongoDB URI and other keys in `backend/.env`
3. Ensure `PORT=5000`

### 3. Start the app
```bash
# Terminal 1: Start backend (http://localhost:5000)
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

## Login Behavior
- Admin login is always bootstrapped as:
	- username: `ajaykumar`
	- password: `Ajaykumar@123`
- Normal users use Register/Login and are stored in MongoDB.

## Cloudinary for Rooms
- Admin can upload room images while creating/updating rooms.
- Images are stored in Cloudinary using:
	- `CLOUD_NAME`
	- `CLOUD_API_KEY`
	- `CLOUD_API_SECRET`

## Deploy Setup

### Backend on Render
1. Push repository to GitHub.
2. Create a new **Web Service** on Render.
3. Set **Root Directory** to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables in Render:
	 - `MONGO_URI`
	 - `JWT_SECRET`
	 - `PORT=5000`
	 - `FRONTEND_URL` (comma-separated origins, e.g. `https://roombookings.netlify.app,http://localhost:5173,http://127.0.0.1:5173`)
	 - `ADMIN_USERNAME=ajaykumar`
	 - `ADMIN_PASSWORD=Ajaykumar@123`
	 - `ADMIN_EMAIL`
	 - `ADMIN_FULLNAME`
	 - `CLOUD_NAME`
	 - `CLOUD_API_KEY`
	 - `CLOUD_API_SECRET`

### Frontend on Netlify
1. Create a new site from GitHub on Netlify.
2. Set **Base directory** to `frontend`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable:
	 - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
6. Redeploy and verify login + room image upload.

## Need Help?
- Make sure MongoDB Atlas IP whitelist includes your IP
- Check both servers are running on ports 5000 and 5173
- Verify `.env` file has correct MongoDB connection string