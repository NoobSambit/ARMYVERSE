import axios from 'axios';

/**
 * Generate playlist using AI service
 * @param {string} prompt - User's prompt for playlist generation
 * @param {Array} availableSongs - All available songs in database
 * @param {number} count - Number of songs to include
 * @param {string} mood - Optional mood filter
 * @param {Array} genres - Optional genre filters
 * @returns {Object} AI generated playlist result
 */
export async function generatePlaylistWithAI(prompt, availableSongs, count = 10, mood = null, genres = []) {
  try {
    // For demo purposes, we'll use a simple AI simulation
    // In production, replace this with actual AI service calls
    
    if (process.env.GEMINI_API_KEY) {
      return await generateWithGemini(prompt, availableSongs, count, mood, genres);
    } else {
      // Fallback to smart filtering when no AI service is available
      return generateWithSmartFiltering(prompt, availableSongs, count, mood, genres);
    }
  } catch (error) {
    console.error('AI service error:', error);
    // Fallback to smart filtering on error
    return generateWithSmartFiltering(prompt, availableSongs, count, mood, genres);
  }
}

/**
 * Generate playlist using Gemini AI
 */
async function generateWithGemini(prompt, availableSongs, count, mood, genres) {
  try {
    // Prepare song data for AI
    const songData = availableSongs.map(song => ({
      id: song._id,
      title: song.title,
      album: song.album?.title || 'Unknown',
      mood: song.mood,
      genres: song.genres,
      popularity: song.stats?.spotify?.popularity || 0,
      isTitle: song.isTitle
    }));

    const aiPrompt = `
      You are a BTS music expert. Based on the user's request: "${prompt}"
      
      Please select ${count} songs from the following BTS songs and create a playlist:
      ${JSON.stringify(songData, null, 2)}
      
      Return a JSON response with:
      {
        "name": "Creative playlist name",
        "description": "Brief description of the playlist",
        "songs": ["songId1", "songId2", ...],
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

    // Validate and calculate duration
    const selectedSongs = availableSongs.filter(song => 
      result.songs.includes(song._id.toString())
    );
    
    const duration = selectedSongs.reduce((sum, song) => sum + (song.duration || 0), 0);

    return {
      ...result,
      songs: selectedSongs.map(song => song._id),
      duration
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Smart filtering fallback when AI service is not available
 */
function generateWithSmartFiltering(prompt, availableSongs, count, mood, genres) {
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

  // Filter songs based on criteria
  let filteredSongs = availableSongs;

  // Apply mood filter
  if (detectedMood) {
    filteredSongs = filteredSongs.filter(song => 
      song.mood === detectedMood || 
      (song.genres && song.genres.some(genre => {
        if (detectedMood === 'Happy' && ['Dance', 'Pop'].includes(genre)) return true;
        if (detectedMood === 'Sad' && ['Ballad', 'R&B'].includes(genre)) return true;
        if (detectedMood === 'Energetic' && ['Hip-Hop', 'Rock'].includes(genre)) return true;
        return false;
      }))
    );
  }

  // Apply genre filter
  if (genres && genres.length > 0) {
    filteredSongs = filteredSongs.filter(song => 
      song.genres && song.genres.some(genre => genres.includes(genre))
    );
  }

  // Special keyword filtering
  if (lowerPrompt.includes('title') || lowerPrompt.includes('hit')) {
    filteredSongs = filteredSongs.filter(song => song.isTitle);
  }

  // Sort by popularity and recent releases
  filteredSongs.sort((a, b) => {
    const aPopularity = a.stats?.spotify?.popularity || 0;
    const bPopularity = b.stats?.spotify?.popularity || 0;
    const aRecent = new Date(a.releaseDate).getTime();
    const bRecent = new Date(b.releaseDate).getTime();
    
    return (bPopularity * 0.7 + bRecent * 0.3) - (aPopularity * 0.7 + aRecent * 0.3);
  });

  // Select top songs
  const selectedSongs = filteredSongs.slice(0, count);
  
  // If not enough songs, fill with popular songs
  if (selectedSongs.length < count) {
    const remainingCount = count - selectedSongs.length;
    const popularSongs = availableSongs
      .filter(song => !selectedSongs.includes(song))
      .sort((a, b) => (b.stats?.spotify?.totalStreams || 0) - (a.stats?.spotify?.totalStreams || 0))
      .slice(0, remainingCount);
    
    selectedSongs.push(...popularSongs);
  }

  const duration = selectedSongs.reduce((sum, song) => sum + (song.duration || 0), 0);

  return {
    name: `${detectedMood ? detectedMood + ' ' : ''}BTS Playlist`,
    description: `A curated playlist based on: "${prompt}"`,
    songs: selectedSongs.map(song => song._id),
    explanation: `Selected ${selectedSongs.length} songs that match your request for "${prompt}". ${detectedMood ? `Focused on ${detectedMood} mood.` : ''}`,
    tags: [detectedMood, ...genres].filter(Boolean),
    mood: detectedMood,
    duration,
    confidence: 0.75
  };
}