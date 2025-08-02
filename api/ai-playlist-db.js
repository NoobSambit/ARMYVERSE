const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

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

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Cache for Spotify access token
let spotifyAccessToken = null;
let tokenExpiration = null;

// Whitelist of accepted BTS family artist names
const BTS_FAMILY = ['BTS','RM','Jin','SUGA','Agust D','j-hope','Jimin','V','Jungkook','Jung Kook'];

// Get Spotify access token (Client Credentials)
const getSpotifyAccessToken = async () => {
  if (spotifyAccessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return spotifyAccessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
    
    console.log('✅ Got Spotify access token');
    return spotifyAccessToken;
  } catch (error) {
    console.error('❌ Failed to get Spotify access token:', error);
    return null;
  }
};

// Track model (simplified for Vercel)
const TrackSchema = new mongoose.Schema({
  name: String,
  artist: String,
  album: String,
  spotifyId: String,
  thumbnails: {
    large: String,
    medium: String,
    small: String
  },
  duration: Number,
  popularity: Number,
  previewUrl: String,
  isBTSFamily: Boolean
});

const Track = mongoose.model('Track', TrackSchema);

// Database lookup function
const findTrackInDatabase = async (title, artist, album = '') => {
  try {
    const cleanTitle = title.replace(/\(feat\..*?\)/gi, '').replace(/\(.*?version.*?\)/gi,'').trim();
    const cleanAlbum = album.replace(/\(.*?version.*?\)/gi,'').trim();

    // Artist fallback list
    const artistFallbacks = [
      artist,
      'BTS',
      'RM', 'Jin', 'SUGA', 'Agust D', 'j-hope', 'Jimin', 'V', 'Jung Kook'
    ].filter((a, i, arr) => arr.indexOf(a) === i);

    const exactTitleRe = new RegExp(`^${cleanTitle}$`, 'i');
    const albumRe = cleanAlbum ? new RegExp(cleanAlbum, 'i') : null;
    const studioExcl = { $not: /live|karaoke|remix|concert/i };

    for (const tryArtist of artistFallbacks) {
      console.log(`🎭 Trying artist: ${tryArtist}`);
      
      const attemptQueries = [];
      if (albumRe) attemptQueries.push({ 
        name: exactTitleRe, 
        artist: new RegExp(`^${tryArtist}$`, 'i'),
        album: { $regex: albumRe.source, $options: 'i', $not: /live|karaoke|remix|concert/i }, 
        isBTSFamily: true 
      });
      if (albumRe) attemptQueries.push({ 
        name: exactTitleRe, 
        artist: new RegExp(`^${tryArtist}$`, 'i'),
        album: { $regex: albumRe.source, $options: 'i' }, 
        isBTSFamily: true 
      });
      attemptQueries.push({ 
        name: exactTitleRe, 
        artist: new RegExp(`^${tryArtist}$`, 'i'),
        album: studioExcl, 
        isBTSFamily: true 
      });
      attemptQueries.push({ 
        name: exactTitleRe, 
        artist: new RegExp(`^${tryArtist}$`, 'i'),
        isBTSFamily: true 
      });

      let track = null;
      for (const q of attemptQueries) {
        track = await Track.findOne(q).sort({ popularity: -1 });
        if (track) {
          console.log(`✅ Found match: ${track.name} - ${track.artist} (${track.album})`);
          return {
            spotifyId: track.spotifyId,
            albumArt: track.thumbnails?.large || track.thumbnails?.medium || track.thumbnails?.small || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            spotifyUrl: `https://open.spotify.com/track/${track.spotifyId}`,
            duration: track.duration,
            popularity: track.popularity,
            previewUrl: track.previewUrl
          };
        }
      }
    }
    return null;
  } catch (err) {
    console.error('❌ DB lookup error:', err);
    return null;
  }
};

// Spotify search function
const searchSpotifyTrack = async (title, artist) => {
  const cleanTitle = title.replace(/\(feat\..*?\)/gi, '').trim();
  const query = `${cleanTitle} ${artist}`;

  try {
    const token = await getSpotifyAccessToken();
    if (!token) throw new Error('No token');

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.tracks.items.length > 0) {
        const track = data.tracks.items.find(t => t.artists.some(a => BTS_FAMILY.includes(a.name)));
        if (!track) return null;
        return {
          spotifyId: track.id,
          albumArt: track.album.images[0]?.url ?? null,
          spotifyUrl: track.external_urls.spotify,
          duration: track.duration_ms,
          popularity: track.popularity
        };
      }
    }
  } catch (err) {
    console.log('Spotify quick search failed, falling back:', err.message);
  }

  return {
    spotifyId: null,
    albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    duration: 180000,
    popularity: null
  };
};

// Vercel API handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 AI playlist with database lookup route hit!');
    console.log('Request body:', req.body);
    
    const { 
      prompt, 
      mood, 
      artistBias, 
      playlistLength, 
      yearEra, 
      playlistType 
    } = req.body;
    
    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!genAI) {
      console.error('❌ Gemini API key not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    console.log('🎵 Generating AI playlist with database lookup...');
    
    // Create sophisticated prompt for Gemini
    let enhancedPrompt = `Create a BTS playlist with these specifications:

MAIN REQUEST: "${prompt}"

CONSTRAINTS:
- Return exactly ${playlistLength || 10} songs
- Playlist type: ${playlistType || 'feel-based'}`;

    if (mood) {
      enhancedPrompt += `\n- Target mood: ${mood}`;
    }

    if (artistBias && artistBias.length > 0) {
      enhancedPrompt += `\n- Emphasize these BTS members: ${artistBias.join(', ')}`;
    }

    if (yearEra && yearEra.length > 0) {
      enhancedPrompt += `\n- Focus on these eras: ${yearEra.join(', ')}`;
    }

    enhancedPrompt += `

SONG SELECTION:
- Include BTS group songs AND solo member songs (RM, Jin, Suga/Agust D, J-Hope, Jimin, V, Jungkook)
- Mix popular hits with deep cuts based on the request
- Consider the specified playlist type when choosing songs

ARTIST RULES:
- If the song was released on a BTS GROUP album, set "artist": "BTS" (do NOT list individual members).
- This includes unit songs, solo tracks on group albums, and member-led tracks that appear on BTS albums.
- If the song was released on a SOLO album, set "artist" to that member (RM, Jin, SUGA/Agust D, j-hope, Jimin, V, Jung Kook).
- ALWAYS include the exact official album name in the "album" field.

EXAMPLES:
- "Euphoria" → {"title": "Euphoria", "artist": "BTS", "album": "Love Yourself 結 'Answer'"}
- "Moon" → {"title": "Moon", "artist": "BTS", "album": "Map of the Soul: 7"}
- "Serendipity" → {"title": "Serendipity", "artist": "BTS", "album": "Love Yourself 承 'Her'"}
- "Trivia 承 : Love" → {"title": "Trivia 承 : Love", "artist": "BTS", "album": "Love Yourself 結 'Answer'"}
- "Trivia 起 : Just Dance" → {"title": "Trivia 起 : Just Dance", "artist": "BTS", "album": "Love Yourself 結 'Answer'"}
- "Trivia 轉 : Seesaw" → {"title": "Trivia 轉 : Seesaw", "artist": "BTS", "album": "Love Yourself 結 'Answer'"}
- "Like Crazy" → {"title": "Like Crazy", "artist": "Jimin", "album": "FACE"}
- "Seven" → {"title": "Seven", "artist": "Jung Kook", "album": "GOLDEN"}
- "Chicken Noodle Soup" → {"title": "Chicken Noodle Soup", "artist": "j-hope", "album": "Hope World"}

REQUIRED FORMAT - Return ONLY this JSON array:
[
  {"title": "Song Name", "artist": "Artist Name", "album": "Album Name"},
  {"title": "Song Name", "artist": "Artist Name", "album": "Album Name"}
]

IMPORTANT: Only return the JSON array, no explanations or other text.`;

    console.log('🤖 Using Gemini 2.0 Flash with enhanced prompt');
    
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const text = response.text();
    
    console.log('🤖 Raw Gemini response length:', text.length);
    
    // Parse JSON from response
    let aiPlaylist;
    try {
      const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        aiPlaylist = JSON.parse(jsonMatch[0]);
      } else {
        aiPlaylist = JSON.parse(text.trim());
      }
      
      if (!Array.isArray(aiPlaylist) || aiPlaylist.length === 0) {
        throw new Error('Invalid playlist format');
      }
      
      console.log(`✅ Parsed ${aiPlaylist.length} songs from AI`);
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response was:', text);
      
      // Return fallback playlist
      aiPlaylist = [
        { title: "Dynamite", artist: "BTS" },
        { title: "Butter", artist: "BTS" },
        { title: "Life Goes On", artist: "BTS" },
        { title: "Spring Day", artist: "BTS" },
        { title: "DNA", artist: "BTS" },
        { title: "Boy With Luv", artist: "BTS" },
        { title: "Like Crazy", artist: "Jimin" },
        { title: "Seven", artist: "Jungkook" }
      ].slice(0, playlistLength || 10);
      
      console.log('🔄 Using fallback playlist due to parse error');
    }
    
    // Look up each track in the database
    console.log('🎵 Looking up tracks in database...');
    const enhancedPlaylist = [];

    for (const track of aiPlaylist) {
      const enhancedTrack = {
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        album: track.album || ''
      };

      // Database lookup first
      console.log(`🎵 Looking up: "${enhancedTrack.title}" by "${enhancedTrack.artist}" from album "${enhancedTrack.album}"`);
      const dbData = await findTrackInDatabase(enhancedTrack.title, enhancedTrack.artist, enhancedTrack.album);

      if (dbData) {
        Object.assign(enhancedTrack, dbData);
        console.log(`✅ DB match: ${enhancedTrack.title} - ${enhancedTrack.artist}`);
      } else {
        // Fallback to Spotify search
        console.log(`🔄 DB miss → Spotify search: ${enhancedTrack.title}`);
        const spotifyData = await searchSpotifyTrack(enhancedTrack.title, enhancedTrack.artist);

        if (spotifyData && spotifyData.spotifyId) {
          Object.assign(enhancedTrack, spotifyData);
        } else {
          // Ultimate fallback
          enhancedTrack.spotifyId = null;
          enhancedTrack.albumArt = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
          enhancedTrack.spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(enhancedTrack.title + ' ' + enhancedTrack.artist)}`;
        }
      }

      enhancedPlaylist.push(enhancedTrack);
    }

    console.log(`✅ Returning enhanced playlist with ${enhancedPlaylist.length} tracks`);
    res.json(enhancedPlaylist);
    
  } catch (error) {
    console.error('❌ Enhanced AI playlist generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced AI playlist', 
      details: error.message 
    });
  }
}; 