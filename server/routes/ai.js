import express from 'express';
import SpotifyService from '../services/spotifyService.js';
import { generatePlaylistWithAI } from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/generate - Generate AI playlist and export to Spotify
router.post('/generate', async (req, res) => {
  try {
    const { prompt, count = 10, mood, genres } = req.body;

    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Prompt must be at least 10 characters long' 
      });
    }

    const spotifyService = new SpotifyService();

    // Search for BTS tracks on Spotify directly
    const searchResults = await spotifyService.searchTracks('', 100); // Get more tracks for AI to choose from

    if (searchResults.length === 0) {
      return res.status(400).json({ 
        error: 'No BTS tracks found on Spotify' 
      });
    }

    // Format tracks for AI processing
    const availableTracks = searchResults.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: {
        title: track.album.name,
        cover: track.album.images[0]?.url || ''
      },
      popularity: track.popularity,
      uri: track.uri,
      spotifyUrl: track.external_urls.spotify,
      duration: Math.round(track.duration_ms / 1000),
      releaseDate: track.album.release_date
    }));

    // Generate playlist using AI
    const aiResult = await generatePlaylistWithAI(prompt, availableTracks, count, mood, genres);

    if (!aiResult || !aiResult.tracks || aiResult.tracks.length === 0) {
      return res.status(500).json({ 
        error: 'AI service failed to generate playlist' 
      });
    }

    // Get selected track URIs
    const selectedTrackUris = aiResult.tracks.map(track => track.uri);

    // Create playlist on Spotify (mock for demo)
    const spotifyPlaylist = await spotifyService.createPlaylist(
      'user_id', // Would be actual user ID in production
      aiResult.name || `AI Playlist: ${prompt.substring(0, 50)}`,
      aiResult.description || `AI-generated playlist based on: "${prompt}"`,
      selectedTrackUris,
      true
    );

    res.json({
      success: true,
      playlist: {
        id: spotifyPlaylist.id,
        name: aiResult.name || `AI Playlist: ${prompt.substring(0, 50)}`,
        description: aiResult.description || '',
        tracks: aiResult.tracks,
        spotifyUrl: spotifyPlaylist.external_urls.spotify,
        exported: true
      },
      explanation: aiResult.explanation,
      confidence: aiResult.confidence || 0.8,
      spotifyPlaylist
    });

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI playlist',
      details: error.message 
    });
  }
});

// GET /api/ai/suggestions - Get AI suggestions based on user preferences
router.get('/suggestions', async (req, res) => {
  try {
    const { mood, genre, limit = 5 } = req.query;

    const spotifyService = new SpotifyService();
    
    // Build search query based on preferences
    let searchQuery = '';
    if (mood) searchQuery += ` ${mood}`;
    if (genre) searchQuery += ` ${genre}`;

    const tracks = await spotifyService.searchTracks(searchQuery.trim() || '', limit * 2);

    // Format and filter results
    const suggestions = tracks
      .slice(0, limit)
      .map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: {
          title: track.album.name,
          cover: track.album.images[0]?.url || ''
        },
        duration: Math.round(track.duration_ms / 1000),
        spotifyUrl: track.external_urls.spotify,
        uri: track.uri,
        popularity: track.popularity,
        explanation: `Perfect for ${mood || 'any'} mood${genre ? ` with ${genre} vibes` : ''}`
      }));

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;