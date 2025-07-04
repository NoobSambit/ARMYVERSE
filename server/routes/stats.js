import express from 'express';
import SpotifyService from '../services/spotifyService.js';

const router = express.Router();

// GET /api/stats/songs - Get BTS songs from Spotify
router.get('/songs', async (req, res) => {
  try {
    const { sort = 'popularity', limit = 20, page = 1 } = req.query;
    
    const spotifyService = new SpotifyService();
    
    // Get BTS tracks from Spotify
    const tracks = await spotifyService.searchTracks('', limit * 2); // Get more for sorting
    
    // Sort tracks
    let sortedTracks = tracks;
    if (sort === 'popularity') {
      sortedTracks = tracks.sort((a, b) => b.popularity - a.popularity);
    } else if (sort === 'totalStreams') {
      // Use popularity as proxy for streams
      sortedTracks = tracks.sort((a, b) => b.popularity - a.popularity);
    }
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedTracks = sortedTracks.slice(startIndex, startIndex + limit);
    
    // Format for frontend
    const formattedTracks = paginatedTracks.map(track => ({
      _id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: {
        title: track.album.name,
        cover: track.album.images[0]?.url || ''
      },
      duration: Math.round(track.duration_ms / 1000),
      releaseDate: track.album.release_date,
      thumbnail: track.album.images[0]?.url || '',
      spotifyUrl: track.external_urls.spotify,
      uri: track.uri,
      stats: {
        spotify: {
          totalStreams: track.popularity * 15000000, // Estimate based on popularity
          monthlyStreams: track.popularity * 750000,
          dailyStreams: track.popularity * 25000,
          popularity: track.popularity
        }
      },
      mood: determineMood(track),
      isTitle: track.popularity > 80,
      genres: ['K-Pop']
    }));

    res.json({
      songs: formattedTracks,
      totalPages: Math.ceil(tracks.length / limit),
      currentPage: page,
      totalSongs: tracks.length
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/albums - Get BTS albums from Spotify
router.get('/albums', async (req, res) => {
  try {
    const spotifyService = new SpotifyService();
    
    // Get BTS albums
    const albums = await spotifyService.getArtistAlbums();
    
    // Format albums with calculated stats
    const formattedAlbums = await Promise.all(
      albums.slice(0, 20).map(async (album) => {
        try {
          const tracks = await spotifyService.getAlbumTracks(album.id);
          const totalPopularity = tracks.reduce((sum, track) => sum + (track.popularity || 0), 0);
          const avgPopularity = tracks.length > 0 ? totalPopularity / tracks.length : 0;
          
          return {
            _id: album.id,
            title: album.name,
            releaseDate: album.release_date,
            cover: album.images[0]?.url || '',
            type: album.album_type === 'album' ? 'Studio Album' : 
                  album.album_type === 'single' ? 'Single' : 'EP',
            description: `${album.album_type} released on ${album.release_date}`,
            trackCount: album.total_tracks,
            calculatedStats: {
              totalStreams: avgPopularity * 15000000 * tracks.length,
              songCount: tracks.length
            }
          };
        } catch (error) {
          console.error(`Error processing album ${album.name}:`, error);
          return {
            _id: album.id,
            title: album.name,
            releaseDate: album.release_date,
            cover: album.images[0]?.url || '',
            type: album.album_type === 'album' ? 'Studio Album' : 'Single',
            trackCount: album.total_tracks,
            calculatedStats: {
              totalStreams: 0,
              songCount: album.total_tracks
            }
          };
        }
      })
    );

    res.json(formattedAlbums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/group - Get BTS overview from Spotify
router.get('/group', async (req, res) => {
  try {
    const spotifyService = new SpotifyService();
    
    // Get BTS data
    const [artist, albums, topTracks] = await Promise.all([
      spotifyService.getArtist(),
      spotifyService.getArtistAlbums(),
      spotifyService.getArtistTopTracks()
    ]);
    
    // Calculate totals
    const totalAlbums = albums.length;
    let totalSongs = 0;
    let totalStreams = 0;
    
    // Get track counts from albums
    for (const album of albums.slice(0, 10)) { // Limit to avoid rate limits
      try {
        const tracks = await spotifyService.getAlbumTracks(album.id);
        totalSongs += tracks.length;
        totalStreams += tracks.reduce((sum, track) => sum + (track.popularity * 15000000), 0);
      } catch (error) {
        console.error(`Error processing album ${album.name}:`, error);
      }
    }
    
    const averageStreamsPerSong = totalSongs > 0 ? Math.round(totalStreams / totalSongs) : 0;
    
    // Format top songs
    const topSongs = topTracks.slice(0, 10).map(track => ({
      title: track.name,
      streams: track.popularity * 15000000
    }));
    
    // Format recent releases
    const recentReleases = albums
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .slice(0, 5)
      .map(album => ({
        title: album.name,
        releaseDate: album.release_date,
        streams: album.total_tracks * 50000000 // Estimate
      }));

    res.json({
      summary: {
        totalStreams,
        totalSongs,
        totalAlbums,
        averageStreamsPerSong
      },
      topSongs,
      recentReleases,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats/trending - Get trending BTS songs from Spotify
router.get('/trending', async (req, res) => {
  try {
    const spotifyService = new SpotifyService();
    
    // Get top tracks
    const topTracks = await spotifyService.getArtistTopTracks();
    
    // Format for frontend
    const formattedTracks = topTracks.map(track => ({
      _id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: {
        title: track.album.name,
        cover: track.album.images[0]?.url || ''
      },
      duration: Math.round(track.duration_ms / 1000),
      releaseDate: track.album.release_date,
      thumbnail: track.album.images[0]?.url || '',
      spotifyUrl: track.external_urls.spotify,
      uri: track.uri,
      stats: {
        spotify: {
          totalStreams: track.popularity * 15000000,
          monthlyStreams: track.popularity * 750000,
          dailyStreams: track.popularity * 25000,
          popularity: track.popularity
        }
      },
      mood: determineMood(track),
      isTitle: track.popularity > 80,
      genres: ['K-Pop']
    }));

    res.json(formattedTracks);
  } catch (error) {
    console.error('Error fetching trending songs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to determine mood based on track characteristics
function determineMood(track) {
  const moods = ['Happy', 'Energetic', 'Calm', 'Romantic', 'Nostalgic'];
  // Simple mood assignment based on track name patterns
  const title = track.name.toLowerCase();
  
  if (title.includes('dynamite') || title.includes('butter') || title.includes('permission')) return 'Happy';
  if (title.includes('fire') || title.includes('mic drop') || title.includes('idol')) return 'Energetic';
  if (title.includes('spring day') || title.includes('blue') || title.includes('rain')) return 'Nostalgic';
  if (title.includes('love') || title.includes('serendipity') || title.includes('euphoria')) return 'Romantic';
  
  // Default based on popularity
  return track.popularity > 80 ? 'Happy' : 'Calm';
}

export default router;