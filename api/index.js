const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// MongoDB Connection
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armyverse';
    
    if (mongoURI.startsWith('mongodb+srv://') && !/retryWrites/i.test(mongoURI)) {
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
  }
};

// Connect to MongoDB
connectDB();

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// AI Playlist Generation Endpoint
app.post('/api/ai-playlist-db', async (req, res) => {
  try {
    console.log('🎵 AI Playlist request received:', req.body);
    
    // Mock AI playlist generation for now
    const mockPlaylist = [
      {
        title: "Dynamite",
        artist: "BTS",
        spotifyId: "4saklk6nie3yiGeMpBwiUt",
        albumArt: "https://i.scdn.co/image/ab67616d0000b273c288acf81ce962c67c5c3d5f",
        spotifyUrl: "https://open.spotify.com/track/4saklk6nie3yiGeMpBwiUt",
        duration: 199,
        popularity: 95
      },
      {
        title: "Butter",
        artist: "BTS",
        spotifyId: "2bgTY4U9f1JtY4QGXT3CHi",
        albumArt: "https://i.scdn.co/image/ab67616d0000b273c288acf81ce962c67c5c3d5f",
        spotifyUrl: "https://open.spotify.com/track/2bgTY4U9f1JtY4QGXT3CHi",
        duration: 164,
        popularity: 92
      },
      {
        title: "Permission to Dance",
        artist: "BTS",
        spotifyId: "5eXCXZ3Bhzla8VCZErSzCC",
        albumArt: "https://i.scdn.co/image/ab67616d0000b273c288acf81ce962c67c5c3d5f",
        spotifyUrl: "https://open.spotify.com/track/5eXCXZ3Bhzla8VCZErSzCC",
        duration: 187,
        popularity: 88
      }
    ];
    
    console.log('✅ AI Playlist generated successfully');
    res.json(mockPlaylist);
    
  } catch (error) {
    console.error('❌ AI Playlist generation error:', error);
    res.status(500).json({ error: 'Failed to generate AI playlist' });
  }
});

// Test Playlist Endpoint
app.post('/api/test-playlist', async (req, res) => {
  try {
    console.log('🎵 Test Playlist request received:', req.body);
    
    // Mock test playlist
    const testPlaylist = [
      {
        title: "Test Track 1",
        artist: "BTS",
        spotifyId: "test1",
        albumArt: "https://i.scdn.co/image/ab67616d0000b273c288acf81ce962c67c5c3d5f",
        spotifyUrl: "https://open.spotify.com/track/test1",
        duration: 180,
        popularity: 85
      },
      {
        title: "Test Track 2", 
        artist: "BTS",
        spotifyId: "test2",
        albumArt: "https://i.scdn.co/image/ab67616d0000b273c288acf81ce962c67c5c3d5f",
        spotifyUrl: "https://open.spotify.com/track/test2",
        duration: 200,
        popularity: 90
      }
    ];
    
    console.log('✅ Test Playlist generated successfully');
    res.json(testPlaylist);
    
  } catch (error) {
    console.error('❌ Test Playlist generation error:', error);
    res.status(500).json({ error: 'Failed to generate test playlist' });
  }
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'ArmyVerse API is working! 💜',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ArmyVerse API! 💜',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      test: '/api/test',
      aiPlaylist: '/api/ai-playlist-db',
      testPlaylist: '/api/test-playlist'
    }
  });
});

// Export for Vercel
module.exports = app; 