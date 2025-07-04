import axios from 'axios';

/**
 * Generate playlist using AI service with Spotify tracks
 * @param {string} prompt - User's prompt for playlist generation
 * @param {Array} availableTracks - All available tracks from Spotify
 * @param {number} count - Number of songs to include
 * @param {string} mood - Optional mood filter
 * @param {Array} genres - Optional genre filters
 * @returns {Object} AI generated playlist result
 */
export async function generatePlaylistWithAI(prompt, availableTracks, count = 10, mood = null, genres = []) {
  try {
    if (process.env.GEMINI_API_KEY) {
      return await generateWithGemini(prompt, availableTracks, count, mood, genres);
    } else {
      // Fallback to smart filtering when no AI service is available
      return generateWithSmartFiltering(prompt, availableTracks, count, mood, genres);
    }
  } catch (error) {
    console.error('AI service error:', error);
    // Fallback to smart filtering on error
    return generateWithSmartFiltering(prompt, availableTracks, count, mood, genres);
  }
}

/**
 * Generate playlist using Gemini AI
 */
async function generateWithGemini(prompt, availableTracks, count, mood, genres) {
  try {
    // Prepare track data for AI
    const trackData = availableTracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      popularity: track.popularity,
      uri: track.uri
    }));

    const aiPrompt = `
      You are a BTS music expert. Based on the user's request: "${prompt}"
      
      Please select ${count} songs from the following BTS songs and create a playlist:
      ${JSON.stringify(trackData.slice(0, 50), null, 2)} // Limit for API size
      
      Return a JSON response with:
      {
        "name": "Creative playlist name",
        "description": "Brief description of the playlist",
        "trackIds": ["trackId1", "trackId2", ...],
        "explanation": "Why these songs were chosen",
        "tags": ["tag1", "tag2", ...],
        "mood": "Overall mood",
        "confidence": 0.9
      }
      
      Consider the mood: ${mood || 'any'}, genres: ${genres.join(', ') || 'any'}
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: aiPrompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    const result = JSON.parse(aiResponse);

    // Get selected tracks
    const selectedTracks = availableTracks.filter(track => 
      result.trackIds.includes(track.id)
    );

    return {
      ...result,
      tracks: selectedTracks
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Smart filtering fallback when AI service is not available
 */
function generateWithSmartFiltering(prompt, availableTracks, count, mood, genres) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Define keywords for different moods and themes
  const moodKeywords = {
    'Happy': ['happy', 'joy', 'upbeat', 'energetic', 'dance', 'party', 'celebration'],
    'Sad': ['sad', 'emotional', 'cry', 'heartbreak', 'melancholy', 'lonely'],
    'Energetic': ['energy', 'pump', 'workout', 'hype', 'intense', 'powerful'],
    'Calm': ['calm', 'peaceful', 'relax', 'chill', 'meditation', 'soft'],
    'Romantic': ['love', 'romantic', 'crush', 'date', 'valentine', 'heart'],
    'Inspirational': ['motivate', 'inspire', 'dream', 'hope', 'strength', 'overcome'],
    'Nostalgic': ['memories', 'past', 'nostalgic', 'remember', 'old', 'missing']
  };

  // Determine mood from prompt
  let detectedMood = mood;
  if (!detectedMood) {
    for (const [moodName, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        detectedMood = moodName;
        break;
      }
    }
  }

  // Filter tracks based on criteria
  let filteredTracks = [...availableTracks];

  // Apply popularity-based filtering for mood
  if (detectedMood) {
    if (['Happy', 'Energetic'].includes(detectedMood)) {
      filteredTracks = filteredTracks.filter(track => track.popularity > 70);
    } else if (['Sad', 'Calm'].includes(detectedMood)) {
      filteredTracks = filteredTracks.filter(track => track.popularity > 60);
    }
  }

  // Special keyword filtering
  if (lowerPrompt.includes('popular') || lowerPrompt.includes('hit')) {
    filteredTracks = filteredTracks.filter(track => track.popularity > 80);
  }

  // Sort by popularity and recent releases
  filteredTracks.sort((a, b) => {
    const aPopularity = a.popularity || 0;
    const bPopularity = b.popularity || 0;
    const aRecent = new Date(a.releaseDate).getTime();
    const bRecent = new Date(b.releaseDate).getTime();
    
    return (bPopularity * 0.7 + bRecent * 0.3) - (aPopularity * 0.7 + aRecent * 0.3);
  });

  // Select top tracks
  const selectedTracks = filteredTracks.slice(0, count);

  return {
    name: `${detectedMood ? detectedMood + ' ' : ''}BTS Playlist`,
    description: `A curated playlist based on: "${prompt}"`,
    tracks: selectedTracks,
    explanation: `Selected ${selectedTracks.length} songs that match your request for "${prompt}". ${detectedMood ? `Focused on ${detectedMood} mood.` : ''}`,
    tags: [detectedMood, ...genres].filter(Boolean),
    mood: detectedMood,
    confidence: 0.75
  };
}