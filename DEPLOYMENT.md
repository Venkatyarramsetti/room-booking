# Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your project should be pushed to GitHub
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster (free tier available)
4. **Node.js**: Version 18+ installed locally

## 🚀 Deployment Steps

### Step 1: Prepare Your Project

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```

2. **Test Locally**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

3. **Build Frontend**
   ```bash
   npm run build
   ```

### Step 2: Configure Environment Variables

1. **Set up MongoDB Atlas**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster (free M0 Sandbox)
   - Get your connection string
   - Whitelist your IP address (or use 0.0.0.0/0 for Vercel)

2. **Create Environment Variables**
   - Copy `.env.example` to `.env` in your backend folder
   - Fill in your actual values:
     ```env
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/room-booking
     JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
     PORT=3000
     NODE_ENV=production
     ```

### Step 3: Push to GitHub

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m \"Initial commit - Room booking app ready for deployment\"
   ```

2. **Push to GitHub**
   ```bash
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

### Step 4: Deploy to Vercel

#### Method 1: Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click \"New Project\"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm run install:all`

3. **Add Environment Variables**
   - In project settings, go to \"Environment Variables\"
   - Add these variables:
     ```
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     NODE_ENV=production
     ```

4. **Deploy**
   - Click \"Deploy\"
   - Wait for deployment to complete

#### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Step 5: Post-Deployment Configuration

1. **Update Frontend API Base URL**
   - In your frontend code, update the API base URL to your Vercel deployment URL
   - Update `frontend/src/utils/api.js` or wherever you make API calls

2. **Test Your Deployment**
   - Visit your Vercel URL
   - Test login/registration
   - Test room booking functionality
   - Check browser console for any errors

## 🔧 Project Structure for Vercel

Your project is now organized as:
```
project(ajay)/
├── package.json          # Root package.json for monorepo
├── vercel.json          # Vercel configuration
├── .env.example         # Environment variables template
├── .gitignore          # Enhanced gitignore
├── README.md
├── backend/            # API routes (serverless functions)
│   ├── server.js
│   ├── package.json
│   └── ...
└── frontend/           # React SPA
    ├── dist/          # Build output
    ├── src/
    ├── package.json
    └── vite.config.js
```

## 🌐 How It Works on Vercel

1. **Frontend**: Served as static files from `frontend/dist/`
2. **Backend**: Runs as serverless functions
3. **Routing**: `/api/*` routes go to backend, everything else to frontend
4. **Database**: Connects to MongoDB Atlas

## 📝 Important Notes

### Environment Variables
- Set in Vercel Dashboard under Project Settings > Environment Variables
- Never commit actual `.env` files to Git
- Use different values for development/production

### Database Connection
- MongoDB Atlas is recommended for production
- Ensure your MongoDB cluster allows connections from 0.0.0.0/0 (everywhere) for Vercel
- Or whitelist Vercel's IP ranges

### CORS Configuration
- Your backend already has CORS enabled
- Make sure allowed origins include your Vercel domain

## 🚨 Common Issues & Solutions

### 1. API Routes Not Working
- Check if your API calls use `/api/` prefix
- Verify environment variables are set in Vercel
- Check function logs in Vercel dashboard

### 2. Database Connection Failed  
- Verify MongoDB connection string
- Check if IP is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

### 3. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check build logs in Vercel dashboard

### 4. Frontend/Backend Communication
- Update API base URL in frontend for production
- Check CORS settings
- Verify proxy configuration in vite.config.js

## 📞 Support Commands

```bash
# Local development
npm run dev                    # Start both frontend and backend
npm run dev:frontend          # Frontend only  
npm run dev:backend           # Backend only

# Building
npm run build                 # Build frontend for production
npm run vercel-build          # Vercel build command

# Dependencies  
npm run install:all           # Install all dependencies
npm run install:frontend      # Frontend dependencies only
npm run install:backend       # Backend dependencies only
```

## 🎉 Success!

Your room booking application should now be live on Vercel! Share your deployment URL and test all functionality.

**Next Steps:**
1. Set up custom domain (optional)
2. Configure analytics
3. Set up monitoring  
4. Add CI/CD workflows
5. Consider adding tests