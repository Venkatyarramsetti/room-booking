@echo off
echo 🏢 Room Booking Application Setup
echo ================================

echo.
echo 📋 Pre-flight checks...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if backend .env file exists
if not exist "backend\.env" (
    echo ❌ Backend .env file not found!
    echo 📝 Please copy backend\.env.example to backend\.env and configure your MongoDB connection.
    echo 🔗 Get your MongoDB connection string from: https://www.mongodb.com/cloud/atlas
    echo.
    pause
    exit /b 1
)

echo ✅ All checks passed!
echo.

echo 🚀 Starting Room Booking Application...
echo.
echo 📡 Frontend will be available at: http://localhost:5173
echo 🖥️  Backend API will be available at: http://localhost:3000
echo.
echo 💡 Press Ctrl+C in any terminal to stop the servers
echo.

REM Start backend
echo Starting backend server...
start "Backend Server" cmd /k "cd /d backend && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend  
echo Starting frontend development server...
start "Frontend Server" cmd /k "cd /d frontend && npm run dev"

echo.
echo 🎉 Both servers are starting up!
echo 📱 Open http://localhost:5173 in your browser to use the app.
echo.
pause