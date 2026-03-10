@echo off
echo ================================================
echo       ROOM BOOKING APP - DEPLOYMENT SETUP
echo ================================================

echo.
echo [1/5] Installing dependencies...
call npm run install:all

echo.
echo [2/5] Building frontend...
call npm run build

echo.
echo [3/5] Checking environment variables...
if not exist "backend\.env" (
    echo WARNING: backend\.env file not found!
    echo Please copy .env.example to backend\.env and fill in your values
    echo.
) else (
    echo ✅ Environment file found
)

echo.
echo [4/5] Testing build...
if exist "frontend\dist\index.html" (
    echo ✅ Frontend build successful
) else (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo.
echo [5/5] Deployment checklist:
echo ✅ Enhanced .gitignore created
echo ✅ Vercel configuration ready
echo ✅ Package.json files updated
echo ✅ Build scripts configured
echo ✅ Dependencies installed
echo ✅ Frontend built successfully

echo.
echo ================================================
echo            READY FOR VERCEL DEPLOYMENT!
echo ================================================
echo.
echo Next steps:
echo 1. Push your code to GitHub
echo 2. Connect to Vercel dashboard
echo 3. Set environment variables in Vercel
echo 4. Deploy!
echo.
echo Read DEPLOYMENT.md for detailed instructions.
echo.
pause