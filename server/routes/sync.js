import express from 'express';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import SpotifyService from '../services/spotifyService.js';
import YouTubeService from '../services/youtubeService.js';
import fetchRealBTSData from '../data/fetchRealData.js';

const router = express.Router();

// POST /api/sync/fetch-real-data - Fetch fresh data from APIs
router.post('/fetch-real-data', async (req, res) => {
  try {
    console.log('🚀 Starting real data fetch via API endpoint...');
    
    // Validate environment variables
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Spotify API credentials not configured',
        details: 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('⚠️ YouTube API key not configured. Only Spotify data will be fetched.');
    }

    // Start the data fetch process
    const result = await fetchRealBTSData();

    res.json({
      success: true,
      message: 'Real BTS data fetch completed successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in fetch-real-data endpoint:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real BTS data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/sync - Sync existing songs with latest stats
router.post('/', async (req, res) => {
  try {
    console.log('🔄 Starting sync process for existing songs...');
    
    const spotifyService = new SpotifyService();
    const youtubeService = process.env.YOUTUBE_API_KEY ? new YouTubeService() : null;
    
    const songs = await Song.find({});
    
    if (songs.length === 0) {
      return res.status(400).json({
        error: 'No songs found in database',
        suggestion: 'Use /api/sync/fetch-real-data to populate the database first'
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`📊 Syncing ${songs.length} existing songs...`);

    for (const [index, song] of songs.entries()) {
      try {
        console.log(`[${index + 1}/${songs.length}] Syncing: ${song.title}`);
        let updated = false;

        // Update Spotify stats
        if (song.spotifyId) {
          try {
            const trackDetails = await spotifyService.getTrackDetails(song.spotifyId);
            if (trackDetails) {
              // Update popularity and recalculate estimated streams
              song.stats.spotify.popularity = trackDetails.popularity;
              const newEstimatedStreams = Math.floor(trackDetails.popularity * 15000000 + Math.random() * 50000000);
              song.stats.spotify.totalStreams = Math.max(song.stats.spotify.totalStreams, newEstimatedStreams);
              song.stats.spotify.monthlyStreams = Math.floor(song.stats.spotify.totalStreams * 0.05);
              song.stats.spotify.dailyStreams = Math.floor(song.stats.spotify.monthlyStreams / 30);
              updated = true;
              console.log(`  ✅ Spotify: ${trackDetails.popularity}/100 popularity`);
            }
          } catch (error) {
            console.error(`  ❌ Spotify error: ${error.message}`);
          }
        }

        // Update YouTube stats
        if (song.youtubeId && youtubeService) {
          try {
            const youtubeStats = await youtubeService.getVideoStats(song.youtubeId);
            if (youtubeStats) {
              song.stats.youtube = {
                views: youtubeStats.views,
                likes: youtubeStats.likes,
                comments: youtubeStats.comments,
                dailyViews: Math.floor(youtubeStats.views * 0.001)
              };
              updated = true;
              console.log(`  ✅ YouTube: ${youtubeStats.views.toLocaleString()} views`);
            }
          } catch (error) {
            console.error(`  ❌ YouTube error: ${error.message}`);
          }
        }

        if (updated) {
          song.stats.lastUpdated = new Date();
          await song.save();
          successCount++;
        }

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errorCount++;
        errors.push({ songId: song._id, title: song.title, error: error.message });
        console.error(`❌ Error syncing song ${song.title}:`, error);
      }
    }

    // Update album stats
    console.log('📊 Updating album statistics...');
    const albums = await Album.find({}).populate('songs');
    
    for (const album of albums) {
      const albumSongs = await Song.find({ album: album._id });
      album.stats.totalStreams = albumSongs.reduce((sum, song) => 
        sum + (song.stats.spotify.totalStreams || 0), 0);
      album.stats.totalViews = albumSongs.reduce((sum, song) => 
        sum + (song.stats.youtube.views || 0), 0);
      await album.save();
    }

    console.log(`✅ Sync completed: ${successCount} success, ${errorCount} errors`);

    res.json({
      success: true,
      message: 'Sync completed',
      stats: {
        totalSongs: songs.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 5) // Return first 5 errors
      },
      lastSync: new Date()
    });
  } catch (error) {
    console.error('❌ Sync process error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Sync process failed',
      details: error.message 
    });
  }
});

// POST /api/sync/youtube - Sync only YouTube stats
router.post('/youtube', async (req, res) => {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: 'YouTube API key not configured'
      });
    }

    const youtubeService = new YouTubeService();
    const songs = await Song.find({ youtubeId: { $exists: true, $ne: null } });
    
    let successCount = 0;
    let errorCount = 0;

    console.log(`📺 Syncing YouTube stats for ${songs.length} songs...`);

    for (const song of songs) {
      try {
        const youtubeStats = await youtubeService.getVideoStats(song.youtubeId);
        if (youtubeStats) {
          song.stats.youtube = {
            views: youtubeStats.views,
            likes: youtubeStats.likes,
            comments: youtubeStats.comments,
            dailyViews: Math.floor(youtubeStats.views * 0.001)
          };
          song.stats.lastUpdated = new Date();
          await song.save();
          successCount++;
          console.log(`✅ ${song.title}: ${youtubeStats.views.toLocaleString()} views`);
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing YouTube for ${song.title}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'YouTube sync completed',
      stats: { totalSongs: songs.length, successCount, errorCount },
      lastSync: new Date()
    });
  } catch (error) {
    console.error('❌ YouTube sync error:', error);
    res.status(500).json({ 
      success: false,
      error: 'YouTube sync failed',
      details: error.message 
    });
  }
});

// POST /api/sync/spotify - Sync only Spotify stats
router.post('/spotify', async (req, res) => {
  try {
    const spotifyService = new SpotifyService();
    const songs = await Song.find({ spotifyId: { $exists: true, $ne: null } });
    
    let successCount = 0;
    let errorCount = 0;

    console.log(`🎵 Syncing Spotify stats for ${songs.length} songs...`);

    for (const song of songs) {
      try {
        const trackDetails = await spotifyService.getTrackDetails(song.spotifyId);
        if (trackDetails) {
          song.stats.spotify.popularity = trackDetails.popularity;
          // Recalculate estimated streams based on popularity
          const newEstimatedStreams = Math.floor(trackDetails.popularity * 15000000 + Math.random() * 50000000);
          song.stats.spotify.totalStreams = Math.max(song.stats.spotify.totalStreams, newEstimatedStreams);
          song.stats.spotify.monthlyStreams = Math.floor(song.stats.spotify.totalStreams * 0.05);
          song.stats.spotify.dailyStreams = Math.floor(song.stats.spotify.monthlyStreams / 30);
          song.stats.lastUpdated = new Date();
          await song.save();
          successCount++;
          console.log(`✅ ${song.title}: ${trackDetails.popularity}/100 popularity`);
        }
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing Spotify for ${song.title}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Spotify sync completed',
      stats: { totalSongs: songs.length, successCount, errorCount },
      lastSync: new Date()
    });
  } catch (error) {
    console.error('❌ Spotify sync error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Spotify sync failed',
      details: error.message 
    });
  }
});

// GET /api/sync/status - Get sync status and database stats
router.get('/status', async (req, res) => {
  try {
    const songCount = await Song.countDocuments();
    const albumCount = await Album.countDocuments();
    
    const songsWithSpotify = await Song.countDocuments({ spotifyId: { $exists: true, $ne: null } });
    const songsWithYouTube = await Song.countDocuments({ youtubeId: { $exists: true, $ne: null } });
    
    const totalSpotifyStreams = await Song.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.spotify.totalStreams' } } }
    ]);
    
    const totalYouTubeViews = await Song.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.youtube.views' } } }
    ]);

    const lastUpdated = await Song.findOne({}, {}, { sort: { 'stats.lastUpdated': -1 } });

    res.json({
      database: {
        songs: songCount,
        albums: albumCount,
        songsWithSpotify,
        songsWithYouTube
      },
      totals: {
        spotifyStreams: totalSpotifyStreams[0]?.total || 0,
        youtubeViews: totalYouTubeViews[0]?.total || 0
      },
      lastUpdated: lastUpdated?.stats?.lastUpdated || null,
      apiStatus: {
        spotify: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
        youtube: !!process.env.YOUTUBE_API_KEY
      }
    });
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    res.status(500).json({ 
      error: 'Failed to get sync status',
      details: error.message 
    });
  }
});

export default router;