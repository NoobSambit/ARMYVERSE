import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
const router = express.Router();
import Playlist from '../models/Playlist.js';
import geminiService from '../utils/geminiService.js';

// POST /generatePlaylist - Generate AI playlist
router.post('/generatePlaylist', async (req, res) => {
  try {
    const { theme } = req.body;

    // Validate input
    if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
      return res.status(400).json({
        error: 'Theme is required and must be a non-empty string'
      });
    }

    const trimmedTheme = theme.trim();

    // Generate playlist using Gemini
    console.log(`🤖 Generating playlist for theme: "${trimmedTheme}"`);
    const songTitles = await geminiService.generatePlaylist(trimmedTheme);

    // For now, create songs with search links to Spotify
    // TODO: Implement full Spotify API integration with real song data
    const enrichedSongs = songTitles.map(title => ({
      title,
      artist: 'BTS',
      album: 'Unknown',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      duration: 180,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(title + ' BTS')}`,
      spotifyId: null,
      uri: null
    }));

    // Create playlist object
    const playlist = new Playlist({
      theme: trimmedTheme,
      songs: enrichedSongs,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(trimmedTheme + ' BTS')}`,
      createdAt: new Date()
    });

    // Save to MongoDB
    const savedPlaylist = await playlist.save();
    
    console.log(`✅ Playlist created with ID: ${savedPlaylist._id}`);
    console.log(`🎵 Songs: ${enrichedSongs.map(s => s.title).join(', ')}`);

    res.status(201).json({
      message: 'Playlist created',
      playlistId: savedPlaylist._id
    });

  } catch (error) {
    console.error('❌ Error generating playlist:', error);
    
    if (error.message.includes('Gemini API not configured')) {
      return res.status(503).json({
        error: 'AI service unavailable. Please configure Gemini API key.'
      });
    }

    if (error.message.includes('Failed to generate playlist')) {
      return res.status(502).json({
        error: 'Failed to generate playlist. Please try again.'
      });
    }

    res.status(500).json({
      error: 'Internal server error while generating playlist'
    });
  }
});

// GET /playlists/:id - Get playlist by ID
router.get('/playlists/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid playlist ID format'
      });
    }

    // Find playlist in MongoDB
    const playlist = await Playlist.findById(id);

    if (!playlist) {
      return res.status(404).json({
        error: 'Playlist not found'
      });
    }

    console.log(`📋 Retrieved playlist: ${playlist.theme} (${playlist.songs.length} songs)`);

    res.json({
      id: playlist._id,
      theme: playlist.theme,
      songs: playlist.songs,
      createdAt: playlist.createdAt
    });

  } catch (error) {
    console.error('❌ Error fetching playlist:', error);
    
    res.status(500).json({
      error: 'Internal server error while fetching playlist'
    });
  }
});

// GET /playlists - Get all playlists (bonus endpoint)
router.get('/playlists', async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      playlists: playlists.map(playlist => ({
        id: playlist._id,
        theme: playlist.theme,
        songCount: playlist.songs.length,
        createdAt: playlist.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching playlists:', error);
    res.status(500).json({
      error: 'Internal server error while fetching playlists'
    });
  }
});

export default router;