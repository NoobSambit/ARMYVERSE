import { GoogleGenerativeAI } from '@google/generative-ai';

// Debug: Log environment variables (without exposing sensitive data)
console.log('🔧 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('- GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

console.log('🤖 Gemini AI initialized:', !!genAI);

export default async function handler(req, res) {
  console.log('🚀 API handler called at:', new Date().toISOString());
  console.log('📝 Request method:', req.method);
  console.log('📝 Request URL:', req.url);
  console.log('📝 Request headers:', Object.keys(req.headers));
  console.log('📝 User agent:', req.headers['user-agent']);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🤖 AI playlist route hit!');
    console.log('📦 Request body type:', typeof req.body);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      prompt, 
      mood, 
      artistBias, 
      playlistLength, 
      yearEra, 
      playlistType 
    } = req.body;
    
    console.log('🔍 Extracted parameters:');
    console.log('- prompt:', prompt);
    console.log('- mood:', mood);
    console.log('- artistBias:', artistBias);
    console.log('- playlistLength:', playlistLength);
    console.log('- yearEra:', yearEra);
    console.log('- playlistType:', playlistType);
    
    if (!prompt?.trim()) {
      console.log('❌ Prompt validation failed - prompt is empty or missing');
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!genAI) {
      console.error('❌ Gemini API key not configured');
      console.error('❌ Environment variables available:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
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

    console.log('🤖 Enhanced prompt created, length:', enhancedPrompt.length);
    console.log('🤖 Using Gemini 2.0 Flash with enhanced prompt');
    
    // Use Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('🤖 Model initialized, calling generateContent...');
    
    const result = await model.generateContent(enhancedPrompt);
    console.log('🤖 Gemini response received');
    
    const response = result.response;
    const text = response.text();
    
    console.log('🤖 Raw Gemini response length:', text.length);
    console.log('🤖 Raw Gemini response preview:', text.substring(0, 200) + '...');
    
    // Parse JSON from response
    let aiPlaylist;
    try {
      console.log('🔍 Attempting to parse JSON from response...');
      const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        console.log('✅ Found JSON array with regex match');
        aiPlaylist = JSON.parse(jsonMatch[0]);
      } else {
        console.log('✅ Parsing entire response as JSON');
        aiPlaylist = JSON.parse(text.trim());
      }
      
      if (!Array.isArray(aiPlaylist) || aiPlaylist.length === 0) {
        throw new Error('Invalid playlist format - not an array or empty array');
      }
      
      console.log(`✅ Parsed ${aiPlaylist.length} songs from AI`);
      console.log('✅ First few songs:', aiPlaylist.slice(0, 3));
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('❌ Parse error details:', parseError.message);
      console.error('❌ Raw response was:', text);
      
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
    console.log('✅ Response status: 200');
    res.json(enhancedPlaylist);
    
  } catch (error) {
    console.error('❌ AI playlist generation error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to generate AI playlist', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 