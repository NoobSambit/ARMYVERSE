import express from 'express';
import Song from '../models/Song.js';
import Album from '../models/Album.js';

const router = express.Router();

// GET /api/stats/songs - Get all song stats
router.get('/songs', async (req, res) => {
  try {
    const { sort = 'totalStreams', limit = 20, page = 1 } = req.query;
    
    const sortField = sort === 'totalStreams' ? 'stats.spotify.totalStreams' : 
                      sort === 'views' ? 'stats.youtube.views' : 
                      'stats.spotify.totalStreams';
    
    const songs = await Song.find({})
      .populate('album', 'title cover releaseDate')
      .sort({ [sortField]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalSongs = await Song.countDocuments();
    
    res.json({
      songs,
      totalPages: Math.ceil(totalSongs / limit),
      currentPage: page,
      totalSongs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/albums - Get album-level stats
router.get('/albums', async (req, res) => {
  try {
    const albums = await Album.find({})
      .populate('songs', 'title stats')
      .sort({ releaseDate: -1 })
      .exec();

    // Calculate total stats for each album
    const albumsWithStats = albums.map(album => {
      const totalStreams = album.songs.reduce((sum, song) => 
        sum + (song.stats.spotify.totalStreams || 0), 0);
      const totalViews = album.songs.reduce((sum, song) => 
        sum + (song.stats.youtube.views || 0), 0);

      return {
        ...album.toObject(),
        calculatedStats: {
          totalStreams,
          totalViews,
          songCount: album.songs.length
        }
      };
    });

    res.json(albumsWithStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/group - Return BTS-wide summary
router.get('/group', async (req, res) => {
  try {
    const songs = await Song.find({});
    const albums = await Album.find({});

    const totalStreams = songs.reduce((sum, song) => 
      sum + (song.stats.spotify.totalStreams || 0), 0);
    const totalViews = songs.reduce((sum, song) => 
      sum + (song.stats.youtube.views || 0), 0);
    const totalSongs = songs.length;
    const totalAlbums = albums.length;

    // Get top performing songs
    const topSongs = songs
      .sort((a, b) => b.stats.spotify.totalStreams - a.stats.spotify.totalStreams)
      .slice(0, 10)
      .map(song => ({
        title: song.title,
        streams: song.stats.spotify.totalStreams,
        views: song.stats.youtube.views
      }));

    // Get recent releases
    const recentReleases = songs
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, 5)
      .map(song => ({
        title: song.title,
        releaseDate: song.releaseDate,
        streams: song.stats.spotify.totalStreams
      }));

    res.json({
      summary: {
        totalStreams,
        totalViews,
        totalSongs,
        totalAlbums,
        averageStreamsPerSong: Math.round(totalStreams / totalSongs),
        averageViewsPerSong: Math.round(totalViews / totalSongs)
      },
      topSongs,
      recentReleases,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/trending - Get trending songs
router.get('/trending', async (req, res) => {
  try {
    const songs = await Song.find({})
      .populate('album', 'title cover')
      .sort({ 'stats.spotify.dailyStreams': -1 })
      .limit(10)
      .exec();

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;