import express from 'express';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
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
      album: track.album.name,
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

    // Get selected track IDs
    const selectedTrackIds = aiResult.tracks.map(track => track.id);

    // Create playlist on Spotify
    const spotifyPlaylist = await spotifyService.createPlaylist(
      'user_id', // Would be actual user ID in production
      aiResult.name || `AI Playlist: ${prompt.substring(0, 50)}`,
      aiResult.description || `AI-generated playlist based on: "${prompt}"`,
      aiResult.tracks.map(track => track.uri),
      true
    );

    // Save playlist record for analytics
    const playlistRecord = new Playlist({
      name: aiResult.name || `AI Playlist: ${prompt.substring(0, 50)}`,
      description: aiResult.description || '',
      type: 'ai',
      spotifyPlaylistId: spotifyPlaylist.id,
      spotifyPlaylistUrl: spotifyPlaylist.external_urls.spotify,
      songSpotifyIds: selectedTrackIds,
      aiPrompt: prompt,
      aiExplanation: aiResult.explanation || '',
      tags: aiResult.tags || [],
      mood: mood || aiResult.mood,
      exported: true,
      exportedAt: new Date()
    });

    await playlistRecord.save();

    res.json({
      success: true,
      playlist: {
        id: playlistRecord._id,
        name: playlistRecord.name,
        description: playlistRecord.description,
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