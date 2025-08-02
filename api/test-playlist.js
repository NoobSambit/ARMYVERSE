export default async function handler(req, res) {
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
      { 
        title: "Dynamite", 
        artist: "BTS", 
        album: "Dynamite (DayTime Version)",
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: 'https://open.spotify.com/search/Dynamite%20BTS',
        duration: 199000,
        popularity: 95
      },
      { 
        title: "Butter", 
        artist: "BTS", 
        album: "Butter",
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: 'https://open.spotify.com/search/Butter%20BTS',
        duration: 164000,
        popularity: 92
      },
      { 
        title: "Permission to Dance", 
        artist: "BTS", 
        album: "Permission to Dance",
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: 'https://open.spotify.com/search/Permission%20to%20Dance%20BTS',
        duration: 187000,
        popularity: 88
      },
      { 
        title: "Life Goes On", 
        artist: "BTS", 
        album: "BE",
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: 'https://open.spotify.com/search/Life%20Goes%20On%20BTS',
        duration: 197000,
        popularity: 85
      },
      { 
        title: "Spring Day", 
        artist: "BTS", 
        album: "You Never Walk Alone",
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: 'https://open.spotify.com/search/Spring%20Day%20BTS',
        duration: 270000,
        popularity: 90
      }
    ];
    
    console.log('✅ Test Playlist generated successfully');
    res.json(testPlaylist);
    
  } catch (error) {
    console.error('❌ Test Playlist generation error:', error);
    res.status(500).json({ error: 'Failed to generate test playlist' });
  }
} 