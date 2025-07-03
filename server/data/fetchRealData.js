import mongoose from 'mongoose';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import SpotifyService from '../services/spotifyService.js';
import YouTubeService from '../services/youtubeService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Fetch real BTS data from Spotify and YouTube APIs
 */
const fetchRealBTSData = async () => {
  try {
    console.log('🚀 Starting real BTS data fetch...');
    console.log('📅 Started at:', new Date().toISOString());
    
    // Validate environment variables
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }
    
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify API credentials are required');
    }
    
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('⚠️ YouTube API key not found. YouTube stats will be skipped.');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize services
    const spotifyService = new SpotifyService();
    const youtubeService = process.env.YOUTUBE_API_KEY ? new YouTubeService() : null;

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Song.deleteMany({});
    await Album.deleteMany({});
    console.log('✅ Database cleared');

    // Get BTS artist info
    console.log('👥 Fetching BTS artist information...');
    const artist = await spotifyService.getArtist();

    // Get all BTS albums
    console.log('💿 Fetching BTS albums...');
    const spotifyAlbums = await spotifyService.getArtistAlbums();
    console.log(`📀 Found ${spotifyAlbums.length} albums to process`);

    const createdAlbums = [];
    const allSongs = [];
    let processedSongs = 0;
    let totalSongs = 0;

    // Calculate total songs for progress tracking
    for (const album of spotifyAlbums) {
      totalSongs += album.total_tracks;
    }
    console.log(`🎵 Total songs to process: ${totalSongs}`);

    // Process each album
    for (const [albumIndex, spotifyAlbum] of spotifyAlbums.entries()) {
      try {
        console.log(`\n📀 [${albumIndex + 1}/${spotifyAlbums.length}] Processing album: "${spotifyAlbum.name}"`);
        console.log(`   Release Date: ${spotifyAlbum.release_date}`);
        console.log(`   Type: ${spotifyAlbum.album_type}`);
        console.log(`   Tracks: ${spotifyAlbum.total_tracks}`);

        // Create album document
        const albumData = {
          title: spotifyAlbum.name,
          releaseDate: new Date(spotifyAlbum.release_date),
          cover: spotifyAlbum.images[0]?.url || '',
          type: spotifyAlbum.album_type === 'album' ? 'Studio Album' : 
                spotifyAlbum.album_type === 'single' ? 'Single' : 'EP',
          description: `${spotifyAlbum.album_type} released on ${spotifyAlbum.release_date}`,
          songs: [],
          stats: {
            totalStreams: 0,
            totalViews: 0,
            averageRating: 0
          },
          trackCount: spotifyAlbum.total_tracks
        };

        const createdAlbum = await Album.create(albumData);
        createdAlbums.push(createdAlbum);

        // Get tracks for this album
        console.log(`   🎵 Fetching tracks...`);
        const tracks = await spotifyService.getAlbumTracks(spotifyAlbum.id);
        console.log(`   ✅ Found ${tracks.length} tracks`);

        const albumSongs = [];

        // Process each track
        for (const [trackIndex, track] of tracks.entries()) {
          try {
            processedSongs++;
            console.log(`      [${processedSongs}/${totalSongs}] 🎵 Processing: "${track.name}"`);

            // Get detailed track info including popularity
            const trackDetails = await spotifyService.getTrackDetails(track.id);
            
            // Get audio features for mood detection
            const audioFeatures = await spotifyService.getTrackAudioFeatures(track.id);

            // Determine mood based on audio features
            let mood = 'Calm';
            if (audioFeatures) {
              const energy = audioFeatures.energy;
              const valence = audioFeatures.valence;
              const danceability = audioFeatures.danceability;

              if (energy > 0.7 && valence > 0.6) mood = 'Happy';
              else if (energy > 0.7 && danceability > 0.7) mood = 'Energetic';
              else if (valence < 0.4) mood = 'Sad';
              else if (energy < 0.4 && valence > 0.5) mood = 'Calm';
              else if (valence > 0.7) mood = 'Romantic';
              else mood = 'Nostalgic';
            }

            // Determine genres based on album and audio features
            let genres = ['K-Pop'];
            if (audioFeatures) {
              if (audioFeatures.energy > 0.7) genres.push('Hip-Hop');
              if (audioFeatures.danceability > 0.7) genres.push('Dance');
              if (audioFeatures.acousticness > 0.5) genres.push('Ballad');
              if (audioFeatures.instrumentalness < 0.1) genres.push('Pop');
            }

            // Calculate estimated streams based on popularity
            const estimatedTotalStreams = trackDetails.popularity ? 
              Math.floor(trackDetails.popularity * 15000000 + Math.random() * 50000000) : 
              Math.floor(Math.random() * 100000000);
            
            const estimatedMonthlyStreams = Math.floor(estimatedTotalStreams * 0.05);
            const estimatedDailyStreams = Math.floor(estimatedMonthlyStreams / 30);

            // Search for YouTube video
            let youtubeData = null;
            if (youtubeService) {
              console.log(`         🔍 Searching YouTube...`);
              try {
                youtubeData = await youtubeService.searchAndGetStats(track.name);
                if (youtubeData) {
                  console.log(`         ✅ YouTube: ${youtubeData.views.toLocaleString()} views`);
                } else {
                  console.log(`         ⚠️ No YouTube video found`);
                }
              } catch (error) {
                console.log(`         ❌ YouTube search failed: ${error.message}`);
              }
            }
            
            // Create song document with clear Spotify/YouTube separation
            const songData = {
              title: track.name,
              artist: 'BTS',
              spotifyId: track.id,
              youtubeId: youtubeData?.videoId || null,
              album: createdAlbum._id,
              releaseDate: new Date(spotifyAlbum.release_date),
              duration: Math.round(track.duration_ms / 1000),
              genres: genres,
              mood: mood,
              isTitle: track.track_number === 1 || 
                       track.name.toLowerCase().includes('title') ||
                       spotifyAlbum.album_type === 'single',
              thumbnail: youtubeData?.thumbnail || spotifyAlbum.images[0]?.url || '',
              stats: {
                spotify: {
                  totalStreams: estimatedTotalStreams,
                  monthlyStreams: estimatedMonthlyStreams,
                  dailyStreams: estimatedDailyStreams,
                  popularity: trackDetails.popularity || 0
                },
                youtube: {
                  views: youtubeData?.views || 0,
                  likes: youtubeData?.likes || 0,
                  comments: youtubeData?.comments || 0,
                  dailyViews: youtubeData ? Math.floor(youtubeData.views * 0.001) : 0
                },
                lastUpdated: new Date()
              }
            };

            const createdSong = await Song.create(songData);
            albumSongs.push(createdSong);
            allSongs.push(createdSong);

            console.log(`         ✅ Created: Spotify ${trackDetails.popularity}/100, ${estimatedTotalStreams.toLocaleString()} streams`);

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 300));

          } catch (error) {
            console.error(`         ❌ Error processing track "${track.name}":`, error.message);
          }
        }

        // Update album with songs and calculated stats
        createdAlbum.songs = albumSongs.map(song => song._id);
        createdAlbum.stats.totalStreams = albumSongs.reduce((sum, song) => 
          sum + (song.stats.spotify.totalStreams || 0), 0);
        createdAlbum.stats.totalViews = albumSongs.reduce((sum, song) => 
          sum + (song.stats.youtube.views || 0), 0);
        
        await createdAlbum.save();
        console.log(`   ✅ Album completed: ${albumSongs.length} songs, ${(createdAlbum.stats.totalStreams / 1000000).toFixed(1)}M streams`);

      } catch (error) {
        console.error(`❌ Error processing album "${spotifyAlbum.name}":`, error.message);
      }
    }

    // Final summary
    console.log('\n🎉 Data fetch completed successfully!');
    console.log('📊 FINAL STATISTICS:');
    console.log(`📀 Albums created: ${createdAlbums.length}`);
    console.log(`🎵 Songs created: ${allSongs.length}`);
    
    const totalSpotifyStreams = allSongs.reduce((sum, song) => sum + (song.stats.spotify.totalStreams || 0), 0);
    const totalYouTubeViews = allSongs.reduce((sum, song) => sum + (song.stats.youtube.views || 0), 0);
    const songsWithYouTube = allSongs.filter(song => song.stats.youtube.views > 0).length;
    
    console.log(`🎵 Total Spotify streams: ${(totalSpotifyStreams / 1000000000).toFixed(2)}B`);
    console.log(`📺 Total YouTube views: ${(totalYouTubeViews / 1000000000).toFixed(2)}B`);
    console.log(`📹 Songs with YouTube data: ${songsWithYouTube}/${allSongs.length}`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);

    return {
      success: true,
      albumsCreated: createdAlbums.length,
      songsCreated: allSongs.length,
      totalSpotifyStreams,
      totalYouTubeViews,
      songsWithYouTube
    };

  } catch (error) {
    console.error('❌ CRITICAL ERROR during data fetch:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the data fetch if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchRealBTSData()
    .then(result => {
      console.log('✅ Script completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default fetchRealBTSData;