import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import simplePlaylistRouter from './routes/simple-playlist.js';
import streamingPlaylistRouter from './routes/streamingPlaylist.js';
import spotifyRouter from './routes/spotify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Mount routes
app.use('/api', simplePlaylistRouter);
app.use('/api', streamingPlaylistRouter);
app.use('/api/spotify', spotifyRouter);

// Test route
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

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader('Content-Type', 'application/json');
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ArmyVerse API server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💜 Ready to serve the ARMY community!`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`🔗 Test the API at: http://localhost:${PORT}/api/health`);
});

export default app;