const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import your existing routes
const simplePlaylistRouter = require('../backend/routes/simple-playlist.js');
const streamingPlaylistRouter = require('../backend/routes/streamingPlaylist.js');
const spotifyRouter = require('../backend/routes/spotify.js');

dotenv.config();

const app = express();

// MongoDB Connection
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armyverse';
    
    // If using MongoDB Atlas, ensure proper options are present exactly once
    if (mongoURI.startsWith('mongodb+srv://') && !/retryWrites/i.test(mongoURI)) {
      // Append default options only if they are missing
      mongoURI += (mongoURI.includes('?') ? '&' : '?') + 'retryWrites=true&w=majority';
    }
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 Make sure your MONGODB_URI is correct and contains valid options');
  }
};

// Connect to MongoDB
connectDB();

// CORS Configuration - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api', simplePlaylistRouter);
app.use('/api', streamingPlaylistRouter);
app.use('/api/spotify', spotifyRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ArmyVerse API! 💜',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      testPlaylist: '/api/test-playlist'
    }
  });
});

// Export for Vercel
module.exports = app; 