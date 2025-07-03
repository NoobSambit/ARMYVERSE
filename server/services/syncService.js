import axios from 'axios';

/**
 * Sync YouTube statistics for a video
 * @param {string} videoId - YouTube video ID
 * @returns {Object} YouTube stats object
 */
export async function syncYouTubeStats(videoId) {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured');
      return null;
    }

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet&key=${process.env.YOUTUBE_API_KEY}`
    );

    const data = response.data;
    
    if (!data.items || data.items.length === 0) {
      console.warn(`No YouTube data found for video ID: ${videoId}`);
      return null;
    }

    const video = data.items[0];
    const stats = video.statistics;

    return {
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      comments: parseInt(stats.commentCount) || 0,
      dailyViews: 0 // This would require historical data or estimation
    };
  } catch (error) {
    console.error('YouTube sync error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Sync Spotify statistics for a track
 * @param {string} trackId - Spotify track ID
 * @returns {Object} Spotify stats object
 */
export async function syncSpotifyStats(trackId) {
  try {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.warn('Spotify API credentials not configured');
      return null;
    }

    // Get Spotify access token
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get track information
    const trackResponse = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const track = trackResponse.data;

    return {
      popularity: track.popularity || 0,
      totalStreams: 0, // Spotify doesn't provide stream counts via API
      dailyStreams: 0,
      monthlyStreams: 0
    };
  } catch (error) {
    console.error('Spotify sync error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Batch sync multiple songs
 * @param {Array} songs - Array of song objects with YouTube/Spotify IDs
 * @returns {Object} Summary of sync results
 */
export async function batchSyncStats(songs) {
  const results = {
    success: 0,
    errors: 0,
    details: []
  };

  for (const song of songs) {
    try {
      const updates = {};

      if (song.youtubeId) {
        const youtubeStats = await syncYouTubeStats(song.youtubeId);
        if (youtubeStats) {
          updates.youtube = youtubeStats;
        }
      }

      if (song.spotifyId) {
        const spotifyStats = await syncSpotifyStats(song.spotifyId);
        if (spotifyStats) {
          updates.spotify = spotifyStats;
        }
      }

      if (Object.keys(updates).length > 0) {
        results.success++;
        results.details.push({
          songId: song._id,
          title: song.title,
          updates
        });
      }
    } catch (error) {
      results.errors++;
      results.details.push({
        songId: song._id,
        title: song.title,
        error: error.message
      });
    }

    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}