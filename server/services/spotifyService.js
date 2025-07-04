import axios from 'axios';

/**
 * Enhanced Spotify API Service for BTS data and playlist management
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
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching BTS artist data:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get BTS top tracks
   */
  async getArtistTopTracks(artistId = '3Nrfpe0tUJi4K4DXYWgMUX') {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            market: 'US'
          }
        }
      );

      return response.data.tracks;
    } catch (error) {
      console.error('❌ Error fetching BTS top tracks:', error.response?.data || error.message);
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const uniqueAlbums = allAlbums.filter((album, index, self) => 
        index === self.findIndex(a => a.name === album.name)
      );

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
   * Search for tracks (used for live search)
   */
  async searchTracks(query, limit = 20) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        'https://api.spotify.com/v1/search',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            q: `artist:BTS ${query}`,
            type: 'track',
            market: 'US',
            limit
          }
        }
      );

      return response.data.tracks.items;
    } catch (error) {
      console.error(`❌ Error searching tracks:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get multiple tracks at once (batch request)
   */
  async getMultipleTracks(trackIds) {
    try {
      const token = await this.getAccessToken();
      
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return allTracks;
    } catch (error) {
      console.error('❌ Error fetching multiple tracks:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a playlist on Spotify (requires user authentication)
   * Note: This would require OAuth flow for user authentication
   */
  async createPlaylist(userId, name, description, trackUris, isPublic = true) {
    try {
      // This would require user OAuth token, not client credentials
      // For now, return a mock response
      console.log('🎵 Creating Spotify playlist:', { name, description, trackCount: trackUris.length });
      
      // In a real implementation, you would:
      // 1. Use user's OAuth token
      // 2. Create playlist: POST https://api.spotify.com/v1/users/{user_id}/playlists
      // 3. Add tracks: POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks
      
      return {
        id: 'mock_playlist_id',
        external_urls: {
          spotify: 'https://open.spotify.com/playlist/mock_playlist_id'
        },
        name,
        description,
        tracks: {
          total: trackUris.length
        }
      };
    } catch (error) {
      console.error('❌ Error creating Spotify playlist:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default SpotifyService;