import express from 'express';
import Song from '../models/Song.js';
import Playlist from '../models/Playlist.js';
import { generatePlaylistWithAI } from '../services/aiService.js';

const router = express.Router();

// POST /api/ai/generate - Generate AI playlist
router.post('/generate', async (req, res) => {
  try {
    const { prompt, count = 10, mood, genres } = req.body;

    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Prompt must be at least 10 characters long' 
      });
    }

    // Get all available songs for AI to choose from
    const allSongs = await Song.find({})
      .populate('album', 'title')
      .exec();

    if (allSongs.length === 0) {
      return res.status(400).json({ 
        error: 'No songs available in database' 
      });
    }

    // Generate playlist using AI
    const aiResult = await generatePlaylistWithAI(prompt, allSongs, count, mood, genres);

    if (!aiResult || !aiResult.songs || aiResult.songs.length === 0) {
      return res.status(500).json({ 
        error: 'AI service failed to generate playlist' 
      });
    }

    // Create and save the AI playlist
    const playlist = new Playlist({
      name: aiResult.name || `AI Playlist: ${prompt.substring(0, 50)}`,
      description: aiResult.description || '',
      type: 'ai',
      songs: aiResult.songs,
      aiPrompt: prompt,
      aiExplanation: aiResult.explanation || '',
      mood: mood || null,
      tags: aiResult.tags || [],
      duration: aiResult.duration || 0
    });

    await playlist.save();

    // Populate the playlist before returning
    const populatedPlaylist = await Playlist.findById(playlist._id)
      .populate('songs', 'title artist duration thumbnail stats album')
      .exec();

    res.json({
      playlist: populatedPlaylist,
      explanation: aiResult.explanation,
      confidence: aiResult.confidence || 0.8
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
    const { mood, genre, bias, limit = 5 } = req.query;

    // Simple AI-like suggestions based on filters
    let filter = {};
    
    if (mood) filter.mood = mood;
    if (genre) filter.genres = genre;

    const suggestions = await Song.find(filter)
      .populate('album', 'title cover')
      .sort({ 'stats.spotify.popularity': -1 })
      .limit(limit * 1)
      .exec();

    // Generate simple explanations
    const suggestionsWithExplanations = suggestions.map(song => ({
      ...song.toObject(),
      explanation: `Perfect for ${mood || 'any'} mood${genre ? ` with ${genre} vibes` : ''}`
    }));

    res.json(suggestionsWithExplanations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;