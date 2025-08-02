const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    console.log('🎵 Test Playlist request received:', req.body);
    
    const testPlaylist = [
      { title: "Dynamite", artist: "BTS" },
      { title: "Butter", artist: "BTS" },
      { title: "Permission to Dance", artist: "BTS" },
      { title: "Life Goes On", artist: "BTS" },
      { title: "Spring Day", artist: "BTS" }
    ];
    
    // Enhance with Spotify data
    const enhancedPlaylist = [];
    for (const track of testPlaylist) {
      const enhancedTrack = { ...track };
      const spotifyData = await searchSpotifyTrack(track.title, track.artist);
      if (spotifyData) {
        Object.assign(enhancedTrack, spotifyData);
      }
      enhancedPlaylist.push(enhancedTrack);
    }
    
    console.log('✅ Test Playlist generated successfully');
    res.json(enhancedPlaylist);
    
  } catch (error) {
    console.error('❌ Test Playlist generation error:', error);
    res.status(500).json({ error: 'Failed to generate test playlist' });
  }
}; 