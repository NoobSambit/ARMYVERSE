# 🚀 ArmyVerse Deployment Guide

This guide will help you deploy ArmyVerse to production using Netlify for the frontend and Railway/Render for the backend.

## 📋 Prerequisites

- GitHub repository with your ArmyVerse code
- Netlify account (free)
- Railway or Render account (free tier available)
- MongoDB Atlas account (free tier available)
- Spotify Developer account
- Google AI API key

## 🎯 Deployment Strategy

### Frontend → Netlify
### Backend → Railway/Render/Heroku
### Database → MongoDB Atlas

## 🎨 Frontend Deployment (Netlify)

### Step 1: Prepare Your Repository

1. **Update Environment Variables**
   Create a `.env.production` file in the root directory:
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

2. **Update API Base URL**
   In your frontend code, make sure API calls use the environment variable:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

### Step 2: Deploy to Netlify

#### Option A: Deploy via Netlify UI
1. Go to [Netlify](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the `NoobSambit/ARMYVERSE` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

#### Option B: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build your project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Step 3: Configure Environment Variables in Netlify

1. Go to your site dashboard in Netlify
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

#### Step 1: Deploy to Railway
1. Go to [Railway](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `NoobSambit/ARMYVERSE` repository
4. Set the **Root Directory** to `backend`
5. Railway will automatically detect it's a Node.js app

#### Step 2: Configure Environment Variables
1. Go to your project dashboard in Railway
2. Navigate to **Variables** tab
3. Add the following environment variables:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/armyverse
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   PORT=5000
   NODE_ENV=production
   ```

#### Step 3: Get Your Backend URL
1. Go to your Railway project dashboard
2. Click on your deployed service
3. Copy the **Domain** URL (e.g., `https://armyverse-backend.railway.app`)

### Option 2: Render

#### Step 1: Deploy to Render
1. Go to [Render](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `armyverse-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click "Create Web Service"

#### Step 2: Configure Environment Variables
Add the same environment variables as listed above in the Render dashboard.

### Option 3: Heroku

#### Step 1: Deploy to Heroku
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create a new Heroku app
heroku create armyverse-backend

# Add the backend directory to Git
cd backend
git init
git add .
git commit -m "Initial backend commit"

# Deploy to Heroku
git push heroku main
```

#### Step 2: Configure Environment Variables
```bash
heroku config:set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/armyverse
heroku config:set SPOTIFY_CLIENT_ID=your_spotify_client_id
heroku config:set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
heroku config:set GOOGLE_AI_API_KEY=your_google_ai_api_key
heroku config:set NODE_ENV=production
```

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free account and cluster
3. Set up database access (username/password)
4. Set up network access (allow all IPs: `0.0.0.0/0`)

### Step 2: Get Connection String
1. In your Atlas dashboard, click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Add the database name: `armyverse`

### Step 3: Seed the Database
```bash
# Update the MONGODB_URI in your backend environment
# Then run the seed script
cd backend
npm run seed
```

## 🔗 Connect Frontend and Backend

### Step 1: Update Netlify Configuration
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Redirects and rewrites**
3. Add a redirect rule:
   ```
   /api/*  https://your-backend-url.railway.app/api/:splat  200
   ```

### Step 2: Update Frontend API Calls
Make sure your frontend uses the correct API base URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## 🎯 Final Steps

### Step 1: Test Your Deployment
1. Visit your Netlify site URL
2. Test all features: authentication, playlist creation, etc.
3. Check browser console for any errors

### Step 2: Set Up Custom Domain (Optional)
1. In Netlify dashboard, go to **Domain settings**
2. Add your custom domain
3. Configure DNS settings

### Step 3: Monitor Your Application
1. Set up logging and monitoring
2. Configure error tracking (Sentry, etc.)
3. Set up uptime monitoring

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Make sure your backend CORS configuration allows your Netlify domain
   - Update the CORS origin in `backend/server.js`

2. **Environment Variables Not Working**
   - Double-check variable names (they must start with `VITE_` for frontend)
   - Redeploy after adding environment variables

3. **API Calls Failing**
   - Verify your backend URL is correct
   - Check that your backend is running and accessible

4. **Build Failures**
   - Check the build logs in Netlify
   - Ensure all dependencies are in `package.json`

## 📊 Performance Optimization

### Frontend:
- Enable Netlify's asset optimization
- Use CDN for static assets
- Implement lazy loading for components

### Backend:
- Enable compression middleware
- Implement caching strategies
- Use connection pooling for MongoDB

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Configure properly for production domains
3. **Rate Limiting**: Already implemented in the backend
4. **HTTPS**: Netlify and Railway provide this automatically

## 📈 Monitoring and Analytics

1. **Netlify Analytics**: Built-in analytics for frontend
2. **Railway Metrics**: Monitor backend performance
3. **MongoDB Atlas**: Database monitoring and alerts

---

**Your ArmyVerse application is now live and ready for the ARMY community! 💜**

*"We are bulletproof"* - BTS 🎵 