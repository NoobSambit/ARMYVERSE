import axios from 'axios';

/**
 * Spotify API Service for fetching BTS data
 */
class SpotifyService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    if (!this.clientId || !this.clientSecret) {
      console.error('❌ Spotify credentials not found in environment variables');
      throw new Error('Spotify API credentials are required');
    }
  }

  /**
   * Get Spotify access token using client credentials flow
   */
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('🔑 Getting Spotify access token...');
      
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      console.log('✅ Spotify access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting Spotify access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  /**
   * Get BTS artist information
   */
  async getArtist(artistId = '3Nrfpe0tUJi4K4DXYWgMUX') {
    try {
      const token = await this.getAccessToken();
      
      console.log(`👥 Fetching BTS artist data (ID: ${artistId})...`);
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log(`✅ Found artist: ${response.data.name} with ${response.data.followers.total.toLocaleString()} followers`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching BTS artist data:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all BTS albums
   */
  async getArtistAlbums(artistId = '3Nrfpe0tUJi4K4DXYWgMUX') {
    try {
      const token = await this.getAccessToken();
      let allAlbums = [];
      let offset = 0;
      const limit = 50;

      console.log('💿 Fetching BTS albums...');

      while (true) {
        const response = await axios.get(
          `https://api.spotify.com/v1/artists/${artistId}/albums`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              include_groups: 'album,single',
              market: 'US',
              limit: limit,
              offset: offset
            }
          }
        );

        allAlbums = allAlbums.concat(response.data.items);

        if (response.data.items.length < limit) {
          break;
        }
        offset += limit;
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Filter out duplicates and sort by release date
      const uniqueAlbums = allAlbums.filter((album, index, self) => 
        index === self.findIndex(a => a.name === album.name)
      );

      console.log(`✅ Found ${uniqueAlbums.length} unique albums`);
      return uniqueAlbums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    } catch (error) {
      console.error('❌ Error fetching BTS albums:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get tracks for a specific album
   */
  async getAlbumTracks(albumId) {
    try {
      const token = await this.getAccessToken();
      let allTracks = [];
      let offset = 0;
      const limit = 50;

      while (true) {
        const response = await axios.get(
          `https://api.spotify.com/v1/albums/${albumId}/tracks`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              market: 'US',
              limit: limit,
              offset: offset
            }
          }
        );

        allTracks = allTracks.concat(response.data.items);

        if (response.data.items.length < limit) {
          break;
        }
        offset += limit;
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return allTracks;
    } catch (error) {
      console.error(`❌ Error fetching tracks for album ${albumId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get detailed track information including popularity
   */
  async getTrackDetails(trackId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            market: 'US'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching track details for ${trackId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get audio features for a track
   */
  async getTrackAudioFeatures(trackId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.spotify.com/v1/audio-features/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching audio features for ${trackId}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get multiple tracks at once (batch request)
   */
  async getMultipleTracks(trackIds) {
    try {
      const token = await this.getAccessToken();
      
      // Spotify allows up to 50 tracks per request
      const chunks = [];
      for (let i = 0; i < trackIds.length; i += 50) {
        chunks.push(trackIds.slice(i, i + 50));
      }

      const allTracks = [];
      
      for (const chunk of chunks) {
        const response = await axios.get(
          'https://api.spotify.com/v1/tracks',
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            params: {
              ids: chunk.join(','),
              market: 'US'
            }
          }
        );

        allTracks.push(...response.data.tracks);
        
        // Add delay between batch requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return allTracks;
    } catch (error) {
      console.error('❌ Error fetching multiple tracks:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default SpotifyService;