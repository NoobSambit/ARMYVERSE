import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Spotify OAuth endpoints
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'b41dc354c04b4e1dad741ae54a61ea9c';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'b8e4c73b374440dd8abadb4609ebd165';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback';

// Store user tokens (in production, use Redis or database)
const userTokens = new Map();

// Spotify Cache Schema
const spotifyCacheSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

// Create index for automatic expiration
spotifyCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SpotifyCache = mongoose.model('SpotifyCache', spotifyCacheSchema);

// GET /api/spotify/cache/:userId - Get cached dashboard data
router.get('/cache/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cachedData = await SpotifyCache.findOne({ userId });
    
    if (!cachedData) {
      return res.status(404).json({ message: 'No cached data found' });
    }
    
    // Check if cache is expired
    if (new Date() > cachedData.expiresAt) {
      await SpotifyCache.deleteOne({ userId });
      return res.status(404).json({ message: 'Cache expired' });
    }
    
    res.json({
      data: cachedData.data,
      timestamp: cachedData.timestamp,
      expiresAt: cachedData.expiresAt
    });
  } catch (error) {
    console.error('Error fetching cached data:', error);
    res.status(500).json({ error: 'Failed to fetch cached data' });
  }
});

// POST /api/spotify/cache - Cache dashboard data
router.post('/cache', async (req, res) => {
  try {
    const { userId, data, timestamp } = req.body;
    
    if (!userId || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Upsert the cache data
    await SpotifyCache.findOneAndUpdate(
      { userId },
      {
        data,
        timestamp: timestamp || Date.now(),
        expiresAt
      },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Data cached successfully' });
  } catch (error) {
    console.error('Error caching data:', error);
    res.status(500).json({ error: 'Failed to cache data' });
  }
});

// DELETE /api/spotify/cache/:userId - Clear cached data
router.delete('/cache/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await SpotifyCache.deleteOne({ userId });
    
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// GET /api/spotify/auth - Get Spotify auth URL
router.get('/auth', (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-read-private',
    'user-read-playback-state'
  ];
  
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
  
  res.json({ authUrl });
});

// GET /api/spotify/callback - Handle Spotify OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }
    
    // Get user profile to get user ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    
    // Store tokens
    userTokens.set(userData.id, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    });
    
    // Redirect to dashboard
    res.redirect('/stats');
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/spotify/user/:userId - Get user profile
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch user profile from Spotify API
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${userToken.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET /api/spotify/top/:type - Get top content
router.get('/top/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { timeRange = 'short_term', limit = 20, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching top content:', error);
    res.status(500).json({ error: 'Failed to fetch top content' });
  }
});

// GET /api/spotify/recent - Get recent tracks
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    res.status(500).json({ error: 'Failed to fetch recent tracks' });
  }
});

// GET /api/spotify/playlists - Get user playlists
router.get('/playlists', async (req, res) => {
  try {
    const { limit = 50, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// GET /api/spotify/audio-features - Get audio features
router.get('/audio-features', async (req, res) => {
  try {
    const { ids, userId } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Missing ids parameter' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${ids}`,
      {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching audio features:', error);
    res.status(500).json({ error: 'Failed to fetch audio features' });
  }
});

// GET /api/spotify/recommendations - Get recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { seed_artists, limit = 20, userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userToken = userTokens.get(userId);
    if (!userToken) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if token is expired and refresh if needed
    if (Date.now() > userToken.expires_at) {
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: `grant_type=refresh_token&refresh_token=${userToken.refresh_token}`
      });
      
      const refreshData = await refreshResponse.json();
      
      if (refreshData.access_token) {
        userToken.access_token = refreshData.access_token;
        userToken.expires_at = Date.now() + (refreshData.expires_in * 1000);
      }
    }
    
    // Fetch from Spotify API
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_artists=${seed_artists}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${userToken.access_token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;