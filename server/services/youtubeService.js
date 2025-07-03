import axios from 'axios';

/**
 * YouTube API Service for fetching BTS video data
 */
class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ YouTube API key not found in environment variables');
      throw new Error('YouTube API key is required');
    }
  }

  /**
   * Search for BTS music videos by song title
   */
  async searchVideo(songTitle, artistName = 'BTS') {
    try {
      // Create multiple search queries to increase chances of finding official video
      const searchQueries = [
        `${artistName} ${songTitle} Official MV`,
        `${artistName} ${songTitle} Official Music Video`,
        `${artistName} ${songTitle} MV`,
        `BTS ${songTitle} Official`,
        `방탄소년단 ${songTitle} Official MV`
      ];

      for (const searchQuery of searchQueries) {
        console.log(`🔍 Searching YouTube: "${searchQuery}"`);
        
        const response = await axios.get(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part: 'snippet',
              q: searchQuery,
              type: 'video',
              maxResults: 10,
              key: this.apiKey,
              order: 'relevance',
              videoDuration: 'medium' // Filter out very short videos
            }
          }
        );

        const videos = response.data.items;
        
        if (videos && videos.length > 0) {
          // Find the most relevant video (prefer official channels)
          const officialVideo = videos.find(video => {
            const channelTitle = video.snippet.channelTitle.toLowerCase();
            const videoTitle = video.snippet.title.toLowerCase();
            
            return (
              (channelTitle.includes('hybe') ||
               channelTitle.includes('bangtantv') ||
               channelTitle.includes('bts') ||
               channelTitle.includes('ibighit')) &&
              (videoTitle.includes('official') || 
               videoTitle.includes('mv') ||
               videoTitle.includes('music video'))
            );
          });

          const selectedVideo = officialVideo || videos[0];
          
          if (selectedVideo) {
            console.log(`✅ Found video: "${selectedVideo.snippet.title}" on ${selectedVideo.snippet.channelTitle}`);
            return selectedVideo;
          }
        }

        // Add delay between search attempts
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`⚠️ No suitable video found for "${songTitle}"`);
      return null;
    } catch (error) {
      console.error(`❌ Error searching YouTube for "${songTitle}":`, error.response?.data || error.message);
      
      // Check if it's a quota exceeded error
      if (error.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        console.error('🚫 YouTube API quota exceeded. Please try again tomorrow or use a different API key.');
      }
      
      return null;
    }
  }

  /**
   * Get detailed video statistics
   */
  async getVideoStats(videoId) {
    try {
      console.log(`📊 Fetching stats for video ID: ${videoId}`);
      
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'statistics,snippet,contentDetails',
            id: videoId,
            key: this.apiKey
          }
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const video = response.data.items[0];
        const stats = video.statistics;
        
        const videoStats = {
          videoId: videoId,
          title: video.snippet.title,
          views: parseInt(stats.viewCount) || 0,
          likes: parseInt(stats.likeCount) || 0,
          comments: parseInt(stats.commentCount) || 0,
          publishedAt: video.snippet.publishedAt,
          thumbnail: video.snippet.thumbnails.maxres?.url || 
                    video.snippet.thumbnails.high?.url || 
                    video.snippet.thumbnails.default?.url,
          duration: video.contentDetails.duration,
          channelTitle: video.snippet.channelTitle
        };

        console.log(`✅ Stats: ${videoStats.views.toLocaleString()} views, ${videoStats.likes.toLocaleString()} likes`);
        return videoStats;
      }

      console.log(`⚠️ No video data found for ID: ${videoId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching YouTube stats for video ${videoId}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Search and get stats for a song in one call
   */
  async searchAndGetStats(songTitle, artistName = 'BTS') {
    try {
      const video = await this.searchVideo(songTitle, artistName);
      
      if (!video) {
        return null;
      }

      const stats = await this.getVideoStats(video.id.videoId);
      return stats;
    } catch (error) {
      console.error(`❌ Error getting YouTube data for "${songTitle}":`, error.message);
      return null;
    }
  }

  /**
   * Parse YouTube duration format (PT4M33S) to seconds
   */
  parseDuration(duration) {
    try {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
      
      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      console.error('Error parsing duration:', error);
      return 0;
    }
  }

  /**
   * Get multiple video stats at once
   */
  async getMultipleVideoStats(videoIds) {
    try {
      // YouTube allows up to 50 video IDs per request
      const chunks = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        chunks.push(videoIds.slice(i, i + 50));
      }

      const allStats = [];
      
      for (const chunk of chunks) {
        const response = await axios.get(
          'https://www.googleapis.com/youtube/v3/videos',
          {
            params: {
              part: 'statistics,snippet,contentDetails',
              id: chunk.join(','),
              key: this.apiKey
            }
          }
        );

        if (response.data.items) {
          const stats = response.data.items.map(video => ({
            videoId: video.id,
            title: video.snippet.title,
            views: parseInt(video.statistics.viewCount) || 0,
            likes: parseInt(video.statistics.likeCount) || 0,
            comments: parseInt(video.statistics.commentCount) || 0,
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails.maxres?.url || 
                      video.snippet.thumbnails.high?.url || 
                      video.snippet.thumbnails.default?.url,
            duration: this.parseDuration(video.contentDetails.duration),
            channelTitle: video.snippet.channelTitle
          }));
          
          allStats.push(...stats);
        }
        
        // Add delay between batch requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return allStats;
    } catch (error) {
      console.error('❌ Error fetching multiple video stats:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default YouTubeService;