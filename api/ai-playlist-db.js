import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

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
    console.log('🤖 AI playlist route hit!');
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
    
    console.log('🎵 Generating AI playlist...');
    
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
        { title: "Dynamite", artist: "BTS", album: "Dynamite (DayTime Version)" },
        { title: "Butter", artist: "BTS", album: "Butter" },
        { title: "Life Goes On", artist: "BTS", album: "BE" },
        { title: "Spring Day", artist: "BTS", album: "You Never Walk Alone" },
        { title: "DNA", artist: "BTS", album: "Love Yourself 承 'Her'" },
        { title: "Boy With Luv", artist: "BTS", album: "Map of the Soul: Persona" },
        { title: "Like Crazy", artist: "Jimin", album: "FACE" },
        { title: "Seven", artist: "Jung Kook", album: "GOLDEN" }
      ].slice(0, playlistLength || 10);
      
      console.log('🔄 Using fallback playlist due to parse error');
    }
    
    // Enhance tracks with basic metadata
    console.log('🎵 Enhancing tracks with metadata...');
    const enhancedPlaylist = [];

    for (const track of aiPlaylist) {
      const enhancedTrack = {
        title: track.title || 'Unknown Title',
        artist: track.artist || 'Unknown Artist',
        album: track.album || '',
        spotifyId: null,
        albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(track.title + ' ' + track.artist)}`,
        duration: 180000,
        popularity: 85
      };

      enhancedPlaylist.push(enhancedTrack);
    }

    console.log(`✅ Returning enhanced playlist with ${enhancedPlaylist.length} tracks`);
    res.json(enhancedPlaylist);
    
  } catch (error) {
    console.error('❌ AI playlist generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI playlist', 
      details: error.message 
    });
  }
} 