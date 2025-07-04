import express from 'express';
import SpotifyService from '../services/spotifyService.js';

const router = express.Router();

// POST /api/playlist/create-spotify - Create playlist and export to Spotify
router.post('/create-spotify', async (req, res) => {
  try {
    const { name, description, spotifyTrackIds, tags, mood, type = 'manual', aiPrompt, aiExplanation } = req.body;

    if (!name || !spotifyTrackIds || spotifyTrackIds.length === 0) {
      return res.status(400).json({ error: 'Name and track IDs are required' });
    }

    const spotifyService = new SpotifyService();

    // Get track details for validation
    const tracks = await spotifyService.getMultipleTracks(spotifyTrackIds);
    const validTrackIds = tracks.filter(track => track).map(track => track.id);

    if (validTrackIds.length === 0) {
      return res.status(400).json({ error: 'No valid tracks found' });
    }

    // Create track URIs for Spotify
    const trackUris = validTrackIds.map(id => `spotify:track:${id}`);

    // Create playlist on Spotify (mock for demo)
    const mockPlaylist = await spotifyService.createPlaylist(
      'user_id', // Would be actual user ID in production
      name,
      description,
      trackUris,
      true
    );

    res.json({
      success: true,
      playlist: {
        id: mockPlaylist.id,
        name: mockPlaylist.name,
        description: mockPlaylist.description,
        spotifyUrl: mockPlaylist.external_urls.spotify,
        trackCount: validTrackIds.length,
        exported: true
      },
      spotifyPlaylist: mockPlaylist
    });

  } catch (error) {
    console.error('Error creating Spotify playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// GET /api/playlist/search-tracks - Search for BTS tracks on Spotify
router.get('/search-tracks', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const spotifyService = new SpotifyService();
    const tracks = await spotifyService.searchTracks(q, limit);

    // Format tracks for frontend
    const formattedTracks = tracks.map(track => ({
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
      releaseDate: track.album.release_date
    }));

    res.json(formattedTracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// GET /api/playlist/trending - Get trending BTS tracks from Spotify
router.get('/trending', async (req, res) => {
  try {
    const spotifyService = new SpotifyService();
    
    // Get popular BTS tracks
    const tracks = await spotifyService.searchTracks('', 50);
    
    // Sort by popularity and return top tracks
    const trending = tracks
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20)
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
        releaseDate: track.album.release_date
      }));

    res.json(trending);
  } catch (error) {
    console.error('Error fetching trending tracks:', error);
    res.status(500).json({ error: 'Failed to fetch trending tracks' });
  }
});

export default router;