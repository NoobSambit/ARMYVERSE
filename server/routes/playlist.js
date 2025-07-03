import express from 'express';
import Playlist from '../models/Playlist.js';
import Song from '../models/Song.js';

const router = express.Router();

// GET /api/playlist - Get all playlists
router.get('/', async (req, res) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;
    
    const filter = type ? { type } : {};
    
    const playlists = await Playlist.find(filter)
      .populate('songs', 'title artist duration')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalPlaylists = await Playlist.countDocuments(filter);
    
    res.json({
      playlists,
      totalPages: Math.ceil(totalPlaylists / limit),
      currentPage: page,
      totalPlaylists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/playlist/:id - Get specific playlist
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('songs', 'title artist duration stats thumbnail album')
      .populate('createdBy', 'username favoriteBias')
      .exec();

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/playlist/manual - Save a manual playlist
router.post('/manual', async (req, res) => {
  try {
    const { name, description, songIds, tags, mood, isPublic = true } = req.body;

    // Validate songs exist
    const songs = await Song.find({ _id: { $in: songIds } });
    if (songs.length !== songIds.length) {
      return res.status(400).json({ error: 'Some songs not found' });
    }

    // Calculate total duration
    const duration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);

    const playlist = new Playlist({
      name,
      description,
      type: 'manual',
      songs: songIds,
      tags,
      mood,
      isPublic,
      duration
    });

    await playlist.save();
    
    // Populate the playlist before returning
    const populatedPlaylist = await Playlist.findById(playlist._id)
      .populate('songs', 'title artist duration thumbnail')
      .exec();

    res.status(201).json(populatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/playlist/:id - Update playlist
router.put('/:id', async (req, res) => {
  try {
    const { name, description, songIds, tags, mood, isPublic } = req.body;

    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Update fields if provided
    if (name) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (songIds) {
      const songs = await Song.find({ _id: { $in: songIds } });
      playlist.songs = songIds;
      playlist.duration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
    }
    if (tags) playlist.tags = tags;
    if (mood) playlist.mood = mood;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();

    const populatedPlaylist = await Playlist.findById(playlist._id)
      .populate('songs', 'title artist duration thumbnail')
      .exec();

    res.json(populatedPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/playlist/:id - Delete playlist
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;