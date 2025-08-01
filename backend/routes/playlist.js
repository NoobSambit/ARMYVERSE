import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Initialize Gemini AI with error handling
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
if (!process.env.GEMINI_API_KEY) {
  console.error('⚠️ Warning: GEMINI_API_KEY not found in environment variables');
}

// POST /api/generate-playlist
router.post('/generate-playlist', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    console.log('🎵 Generating playlist for:', prompt);

    // Create enhanced prompt for Gemini
    const enhancedPrompt = `
Create a BTS playlist based on this vibe: "${prompt}". 
Return exactly 8 songs with title and artist name.

Return ONLY valid JSON in this exact format, with no other text:
[
  {
    "title": "song title",
    "artist": "artist name"
  }
]

Only include BTS songs (including solo works). The artist should be either "BTS" or the member's name (Jimin, Jungkook, V, RM, Suga, J-Hope, Jin).`;

    // Generate playlist using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    console.log('🤖 Sending prompt to Gemini...');
    const result = await model.generateContent(enhancedPrompt);
    
    if (!result?.response) {
      throw new Error('No response from Gemini API');
    }
    
    const response = result.response;
    const text = response.text();

    console.log('✅ Received response from Gemini:', text);

    // Parse the JSON response
    let playlist;
    try {
      // First try direct JSON parse
      try {
        playlist = JSON.parse(text);
      } catch {
        // If that fails, try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        playlist = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
      }

      // Validate playlist structure
      if (!Array.isArray(playlist)) {
        throw new Error('Response is not an array');
      }

      if (playlist.length === 0) {
        throw new Error('Playlist is empty');
      }

      // Validate each track
      playlist = playlist.map(track => {
        if (!track.title || !track.artist) {
          throw new Error('Invalid track format - missing title or artist');
        }
        return {
          title: track.title.trim(),
          artist: track.artist.trim()
        };
      });

    } catch (parseError) {
      console.error('❌ Error parsing Gemini response:', parseError);
      console.error('Raw response:', text);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: parseError.message 
      });
    }

    console.log('✅ Successfully generated playlist:', playlist);
    res.json(playlist);

  } catch (error) {
    console.error('❌ Error generating playlist:', error);
    res.status(500).json({ 
      error: 'Failed to generate playlist',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/export-playlist
router.post('/export-playlist', async (req, res) => {
  try {
    const { name, songs } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Spotify access token required' });
    }

    if (!songs?.length) {
      return res.status(400).json({ error: 'No songs provided' });
    }

    // 1. Get current user's ID
    const userResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get Spotify user profile');
    }
    
    const userData = await userResponse.json();
    const userId = userData.id;

    // 2. Create new playlist
    const playlistResponse = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name || 'AI Generated BTS Playlist',
        description: 'Created with ArmyVerse AI Playlist Generator',
        public: false
      })
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to create Spotify playlist');
    }

    const playlist = await playlistResponse.json();

    // 3. Search and add tracks
    const trackUris = [];
    for (const song of songs) {
      const query = `track:${song.title} artist:${song.artist}`;
      const searchResponse = await fetch(
        `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.tracks.items.length > 0) {
          trackUris.push(searchData.tracks.items[0].uri);
        }
      }
    }

    // 4. Add tracks to playlist
    if (trackUris.length > 0) {
      await fetch(`${SPOTIFY_API_BASE}/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: trackUris })
      });
    }

    res.json({
      success: true,
      playlistUrl: playlist.external_urls.spotify,
      tracksAdded: trackUris.length
    });

  } catch (error) {
    console.error('Error exporting to Spotify:', error);
    res.status(500).json({ 
      error: 'Failed to export playlist',
      details: error.message 
    });
  }
});

export default router;