import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MongoClient } from "mongodb";
import SpotifyWebApi from "spotify-web-api-node";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize MongoDB connection
const mongoUri = process.env.MONGO_URI;
let mongoClient: MongoClient | null = null;

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to get MongoDB connection
async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri!);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
  }
  return mongoClient.db('armyverse');
}

// Cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastSpotifyRequest = 0;
const SPOTIFY_RATE_LIMIT = 100; // 100ms between requests to avoid rate limiting

// Helper function to get Spotify access token
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Spotify token obtained successfully');
    return true;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return false;
  }
}

// Helper function to get cached data or fetch new
function getCachedData(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

// Helper function to cache data
function setCachedData(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// Helper function to rate limit Spotify requests
async function rateLimitSpotify() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastSpotifyRequest;
  if (timeSinceLastRequest < SPOTIFY_RATE_LIMIT) {
    await new Promise(resolve => setTimeout(resolve, SPOTIFY_RATE_LIMIT - timeSinceLastRequest));
  }
  lastSpotifyRequest = Date.now();
}

// Helper function to get actual streaming data from Spotify
async function getTrackStreamingData(trackId: string) {
  try {
    await rateLimitSpotify();
    const track = await spotifyApi.getTrack(trackId);
    
    // Spotify doesn't provide actual stream counts in their public API
    // We'll use popularity as a proxy and estimate streams
    const popularity = track.body.popularity;
    
    // Rough estimation based on popularity (this is approximate)
    const estimatedStreams = Math.floor(popularity * 50000000); // Very rough estimate
    
    return {
      totalStreams: estimatedStreams,
      monthlyStreams: Math.floor(estimatedStreams * 0.1),
      dailyStreams: Math.floor(estimatedStreams * 0.003),
      popularity: popularity
    };
  } catch (error) {
    console.error('Error getting track streaming data:', error);
    return {
      totalStreams: 0,
      monthlyStreams: 0,
      dailyStreams: 0,
      popularity: 0
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug route to check collections and data structure
  app.get('/api/debug/collections', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      const result: any = { collections: collectionNames };
      
      // Get sample documents from each collection
      for (const collName of collectionNames) {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        const sample = await collection.findOne();
        result[collName] = { count, sample };
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error in debug route:', error);
      res.status(500).json({ error: 'Failed to get debug info' });
    }
  });

  // Stats routes with proper deduplication
  app.get('/api/stats/group', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      // Get unique songs only - deduplicate by spotifyId and ensure no null values
      const uniqueSongs = await collection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            song: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$song" }
        }
      ]).toArray();
      
      console.log(`Found ${uniqueSongs.length} unique songs`);
      
      const totalSongs = uniqueSongs.length;
      
      let totalStreams = 0;
      let totalAlbums = new Set();
      
      uniqueSongs.forEach(song => {
        // More robust stream counting
        const streams = song.stats?.spotify?.totalStreams || 0;
        if (streams && typeof streams === 'number' && streams > 0) {
          totalStreams += streams;
        }
        
        if (song.album?.title || song.albumTitle) {
          totalAlbums.add(song.album?.title || song.albumTitle);
        }
      });
      
      const averageStreamsPerSong = totalSongs > 0 ? Math.round(totalStreams / totalSongs) : 0;
      
      // Get unique album count
      const albumCount = await collection.aggregate([
        {
          $match: {
            $or: [
              { "album.title": { $exists: true, $ne: null, $ne: "" } },
              { "albumTitle": { $exists: true, $ne: null, $ne: "" } }
            ]
          }
        },
        {
          $group: {
            _id: {
              $ifNull: ["$album.title", "$albumTitle"]
            }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: "" }
          }
        },
        {
          $count: "totalAlbums"
        }
      ]).toArray();
      
      const totalAlbumsCount = albumCount.length > 0 ? albumCount[0].totalAlbums : totalAlbums.size;
      
      console.log(`Stats: ${totalSongs} songs, ${totalStreams} streams, ${totalAlbumsCount} albums`);
      
      res.json({
        summary: {
          totalSongs,
          totalStreams,
          totalAlbums: totalAlbumsCount,
          averageStreamsPerSong
        }
      });
    } catch (error) {
      console.error('Error fetching group stats:', error);
      res.status(500).json({ error: 'Failed to fetch group stats' });
    }
  });

  app.get('/api/stats/trending', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      // Get trending songs with proper deduplication
      const trendingSongs = await collection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" },
            "stats.spotify.totalStreams": { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            song: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$song" }
        },
        {
          $sort: { 'stats.spotify.totalStreams': -1 }
        },
        {
          $limit: 20
        }
      ]).toArray();
      
      res.json(trendingSongs);
    } catch (error) {
      console.error('Error fetching trending songs:', error);
      res.status(500).json({ error: 'Failed to fetch trending songs' });
    }
  });

  app.get('/api/stats/songs', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      const { sort = 'totalStreams', limit = 50 } = req.query;
      
      let sortField = 'stats.spotify.totalStreams';
      if (sort === 'title') sortField = 'title';
      if (sort === 'artist') sortField = 'artist';
      if (sort === 'popularity') sortField = 'stats.spotify.popularity';
      
      // Get unique songs with proper sorting
      const songs = await collection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            song: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$song" }
        },
        {
          $sort: { [sortField]: -1 }
        },
        {
          $limit: parseInt(limit as string)
        }
      ]).toArray();
      
      res.json({ songs });
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.status(500).json({ error: 'Failed to fetch songs' });
    }
  });

  app.get('/api/stats/albums', async (req, res) => {
    try {
      const db = await getMongoDb();
      const songsCollection = db.collection('songs');
      
      // Get unique albums with proper aggregation
      const albums = await songsCollection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" },
            $or: [
              { "album.title": { $exists: true, $ne: null, $ne: "" } },
              { "albumTitle": { $exists: true, $ne: null, $ne: "" } }
            ]
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            song: { $first: "$$ROOT" }
          }
        },
        {
          $group: {
            _id: {
              $ifNull: ["$song.album.title", "$song.albumTitle"]
            },
            songCount: { $sum: 1 },
            totalStreams: { 
              $sum: { 
                $ifNull: ["$song.stats.spotify.totalStreams", 0] 
              } 
            },
            firstSong: { $first: "$song" },
            cover: { 
              $first: { 
                $ifNull: ["$song.album.cover", "$song.thumbnail"] 
              } 
            },
            releaseDate: { 
              $first: { 
                $ifNull: ["$song.album.releaseDate", "$song.releaseDate"] 
              } 
            }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: "" }
          }
        },
        {
          $sort: { totalStreams: -1 }
        }
      ]).toArray();
      
      const formattedAlbums = albums.map(album => ({
        _id: album._id,
        title: album._id,
        cover: album.cover || '',
        releaseDate: album.releaseDate || '',
        type: 'album',
        calculatedStats: {
          songCount: album.songCount,
          totalStreams: album.totalStreams || 0
        }
      }));
      
      res.json(formattedAlbums);
    } catch (error) {
      console.error('Error fetching albums:', error);
      res.status(500).json({ error: 'Failed to fetch albums' });
    }
  });

  // Playlist routes
  app.get('/api/playlist/trending', async (req, res) => {
    try {
      const cacheKey = 'trending_tracks';
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        return res.json(cachedData);
      }
      
      await getSpotifyToken();
      await rateLimitSpotify();
      
      // Search for BTS tracks
      const searchResults = await spotifyApi.searchTracks('BTS', { limit: 30 });
      const tracks = searchResults.body.tracks?.items || [];
      
      setCachedData(cacheKey, tracks);
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      
      // Fallback to database if Spotify fails
      try {
        const db = await getMongoDb();
        const collection = db.collection('songs');
        const fallbackTracks = await collection.aggregate([
          {
            $match: {
              spotifyId: { $exists: true, $ne: null, $ne: "" }
            }
          },
          {
            $group: {
              _id: "$spotifyId",
              song: { $first: "$$ROOT" }
            }
          },
          {
            $replaceRoot: { newRoot: "$song" }
          },
          {
            $limit: 30
          }
        ]).toArray();
        res.json(fallbackTracks);
      } catch (dbError) {
        res.status(500).json({ error: 'Failed to fetch trending tracks' });
      }
    }
  });

  app.get('/api/playlist/search-tracks', async (req, res) => {
    try {
      const { q, limit = 30 } = req.query;
      const cacheKey = `search_${q}_${limit}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        return res.json(cachedData);
      }
      
      await getSpotifyToken();
      await rateLimitSpotify();
      
      const searchResults = await spotifyApi.searchTracks(`${q} BTS`, { 
        limit: parseInt(limit as string) 
      });
      const tracks = searchResults.body.tracks?.items || [];
      
      setCachedData(cacheKey, tracks);
      res.json(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      
      // Fallback to database search if Spotify fails
      try {
        const db = await getMongoDb();
        const collection = db.collection('songs');
        const searchQuery = req.query.q as string;
        const fallbackTracks = await collection.aggregate([
          {
            $match: {
              spotifyId: { $exists: true, $ne: null, $ne: "" },
              $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { artist: { $regex: searchQuery, $options: 'i' } }
              ]
            }
          },
          {
            $group: {
              _id: "$spotifyId",
              song: { $first: "$$ROOT" }
            }
          },
          {
            $replaceRoot: { newRoot: "$song" }
          },
          {
            $limit: parseInt(req.query.limit as string || '30')
          }
        ]).toArray();
        res.json(fallbackTracks);
      } catch (dbError) {
        res.status(500).json({ error: 'Failed to search tracks' });
      }
    }
  });

  app.post('/api/playlist/create-spotify', async (req, res) => {
    try {
      const { name, description, spotifyTrackIds } = req.body;
      
      await getSpotifyToken();
      
      // For now, just return success without actually creating playlist
      // (would need user authentication for actual playlist creation)
      res.json({
        success: true,
        playlist: {
          name,
          description,
          spotifyUrl: `https://open.spotify.com/playlist/dummy-playlist-id`
        }
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });

  // AI Playlist generation
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { prompt, count = 12 } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const aiPrompt = `Based on this request: "${prompt}", suggest ${count} BTS songs that match the mood and theme. Return only a JSON array with song titles and brief explanations for each choice. Focus on real BTS songs.`;
      
      const result = await model.generateContent(aiPrompt);
      const response = await result.response;
      
      // Get some actual BTS tracks from database for the response
      const db = await getMongoDb();
      const collection = db.collection('songs');
      const tracks = await collection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            song: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$song" }
        },
        {
          $sample: { size: count }
        }
      ]).toArray();
      
      res.json({
        success: true,
        playlist: {
          name: `AI Generated: ${prompt.substring(0, 50)}...`,
          description: `AI curated playlist based on: ${prompt}`,
          tracks: tracks,
          spotifyUrl: `https://open.spotify.com/playlist/dummy-ai-playlist-id`
        },
        explanation: response.text()
      });
    } catch (error) {
      console.error('Error generating AI playlist:', error);
      res.status(500).json({ error: 'Failed to generate AI playlist' });
    }
  });

  // Clean up duplicates route - IMPROVED
  app.post('/api/cleanup/duplicates', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      console.log('Starting duplicate cleanup...');
      
      // Find duplicates by spotifyId
      const duplicates = await collection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" }
          }
        },
        {
          $group: {
            _id: "$spotifyId",
            count: { $sum: 1 },
            docs: { $push: { _id: "$_id", title: "$title" } }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]).toArray();
      
      console.log(`Found ${duplicates.length} duplicate groups`);
      
      let removedCount = 0;
      for (const duplicate of duplicates) {
        // Keep the first document, remove the rest
        const toRemove = duplicate.docs.slice(1);
        for (const doc of toRemove) {
          await collection.deleteOne({ _id: doc._id });
          removedCount++;
        }
      }
      
      // Also remove documents with null or empty spotifyId
      const nullResult = await collection.deleteMany({
        $or: [
          { spotifyId: null },
          { spotifyId: "" },
          { spotifyId: { $exists: false } }
        ]
      });
      
      console.log(`Cleanup complete: ${removedCount} duplicates + ${nullResult.deletedCount} null records removed`);
      
      res.json({ 
        message: `Removed ${removedCount} duplicate songs and ${nullResult.deletedCount} invalid records`,
        duplicatesFound: duplicates.length,
        totalRemoved: removedCount + nullResult.deletedCount
      });
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      res.status(500).json({ error: 'Failed to clean up duplicates' });
    }
  });

  // IMPROVED comprehensive sync route
  app.post('/api/sync', async (req, res) => {
    try {
      console.log('Starting comprehensive BTS data sync...');
      
      await getSpotifyToken();
      const db = await getMongoDb();
      const collection = db.collection('songs');
      const albumCollection = db.collection('albums');
      
      // Clear existing data to prevent duplicates
      console.log('Clearing existing data...');
      await collection.deleteMany({});
      await albumCollection.deleteMany({});
      
      let allTracks: any[] = [];
      let allAlbums: any[] = [];
      
      // Search for BTS artist first
      await rateLimitSpotify();
      const artistSearch = await spotifyApi.searchArtists('BTS', { limit: 1 });
      const btsArtist = artistSearch.body.artists?.items?.[0];
      
      if (!btsArtist) {
        return res.status(404).json({ error: 'BTS artist not found' });
      }
      
      console.log('Found BTS artist:', btsArtist.name, 'ID:', btsArtist.id);
      
      // Get all BTS albums with proper pagination
      let albumOffset = 0;
      let hasMoreAlbums = true;
      
      while (hasMoreAlbums) {
        await rateLimitSpotify();
        const albumResults = await spotifyApi.getArtistAlbums(btsArtist.id, {
          limit: 50,
          offset: albumOffset,
          include_groups: 'album,single,compilation'
        });
        
        const albums = albumResults.body.items || [];
        allAlbums.push(...albums);
        
        console.log(`Fetched ${albums.length} albums (offset: ${albumOffset})`);
        
        hasMoreAlbums = albums.length === 50;
        albumOffset += 50;
      }
      
      console.log(`Total albums found: ${allAlbums.length}`);
      
      // Process each album and its tracks
      const processedTracks = new Set<string>(); // Track processed spotifyIds
      
      for (const album of allAlbums) {
        try {
          await rateLimitSpotify();
          const albumTracks = await spotifyApi.getAlbumTracks(album.id, { limit: 50 });
          const tracks = albumTracks.body.items || [];
          
          // Save album data first
          const albumDoc = {
            _id: album.id,
            title: album.name,
            cover: album.images?.[0]?.url || '',
            releaseDate: album.release_date,
            type: album.album_type,
            totalTracks: album.total_tracks,
            spotifyUrl: album.external_urls?.spotify || ''
          };
          
          await albumCollection.updateOne(
            { _id: album.id },
            { $set: albumDoc },
            { upsert: true }
          );
          
          // Process tracks
          for (const track of tracks) {
            // Skip if already processed
            if (processedTracks.has(track.id)) {
              console.log(`Skipping duplicate track: ${track.name}`);
              continue;
            }
            
            try {
              await rateLimitSpotify();
              const fullTrack = await spotifyApi.getTrack(track.id);
              const trackData = fullTrack.body;
              
              // Get streaming data (estimated)
              const streamingData = await getTrackStreamingData(track.id);
              
              // Get audio features for mood analysis
              let audioFeatures = null;
              try {
                await rateLimitSpotify();
                const features = await spotifyApi.getAudioFeaturesForTrack(track.id);
                audioFeatures = features.body;
              } catch (audioError) {
                console.log('Could not get audio features for track:', track.name);
              }
              
              // Determine mood based on audio features
              let mood = 'unknown';
              if (audioFeatures) {
                const energy = audioFeatures.energy;
                const valence = audioFeatures.valence;
                const danceability = audioFeatures.danceability;
                
                if (energy > 0.7 && valence > 0.6) mood = 'energetic';
                else if (energy > 0.6 && danceability > 0.7) mood = 'upbeat';
                else if (valence < 0.4) mood = 'melancholic';
                else if (energy < 0.4) mood = 'calm';
                else mood = 'balanced';
              }
              
              // Create comprehensive track document
              const trackDoc = {
                _id: track.id,
                title: trackData.name,
                artist: trackData.artists.map((a: any) => a.name).join(', '),
                spotifyId: track.id,
                album: {
                  id: album.id,
                  title: album.name,
                  cover: album.images?.[0]?.url || ''
                },
                albumTitle: album.name,
                stats: {
                  spotify: streamingData,
                  lastUpdated: new Date()
                },
                thumbnail: album.images?.[0]?.url || '',
                duration: Math.floor(trackData.duration_ms / 1000), // Convert to seconds
                releaseDate: album.release_date,
                mood: mood,
                spotifyUrl: trackData.external_urls?.spotify || '',
                uri: trackData.uri,
                audioFeatures: audioFeatures,
                isTitle: track.name.toLowerCase().includes('title') || 
                         track.name.toLowerCase() === album.name.toLowerCase(),
                popularity: trackData.popularity || 0
              };
              
              await collection.insertOne(trackDoc);
              allTracks.push(trackDoc);
              processedTracks.add(track.id);
              
              console.log(`Processed: ${trackData.name} (${streamingData.totalStreams} streams)`);
              
            } catch (trackError) {
              console.error('Error processing track:', track.name, trackError);
            }
          }
          
          console.log(`Completed album: ${album.name} (${tracks.length} tracks)`);
          
        } catch (albumError) {
          console.error('Error processing album:', album.name, albumError);
        }
      }
      
      console.log(`Sync completed: ${allTracks.length} unique tracks from ${allAlbums.length} albums`);
      
      // Calculate total streams for verification
      const totalStreams = allTracks.reduce((sum, track) => sum + (track.stats.spotify.totalStreams || 0), 0);
      
      res.json({
        success: true,
        syncedTracks: allTracks.length,
        syncedAlbums: allAlbums.length,
        totalEstimatedStreams: totalStreams,
        message: `Successfully synced ${allTracks.length} unique BTS tracks from ${allAlbums.length} albums`
      });
      
    } catch (error) {
      console.error('Error syncing data:', error);
      res.status(500).json({ error: 'Failed to sync data: ' + (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}