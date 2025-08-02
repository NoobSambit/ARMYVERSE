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
      test: '/api/test'
    }
  });
});

// Export for Vercel
module.exports = app; 