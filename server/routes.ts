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
  }
  return mongoClient.db('armyverse');
}

// Cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastSpotifyRequest = 0;
const SPOTIFY_RATE_LIMIT = 1000; // 1 second between requests

// Helper function to get Spotify access token
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
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

  // Stats routes
  app.get('/api/stats/group', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      // Get unique songs only - deduplicate by spotifyId
      const uniqueSongs = await collection.aggregate([
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
      
      const totalSongs = uniqueSongs.length;
      
      let totalStreams = 0;
      let totalAlbums = new Set();
      
      uniqueSongs.forEach(song => {
        if (song.stats?.spotify?.totalStreams) {
          totalStreams += song.stats.spotify.totalStreams;
        }
        if (song.album?.title) {
          totalAlbums.add(song.album.title);
        }
      });
      
      const averageStreamsPerSong = totalSongs > 0 ? Math.round(totalStreams / totalSongs) : 0;
      
      // Get album count from aggregation
      const albumCount = await collection.aggregate([
        {
          $group: {
            _id: "$album"
          }
        },
        {
          $match: {
            _id: { $ne: null }
          }
        },
        {
          $count: "totalAlbums"
        }
      ]).toArray();
      
      const totalAlbumsCount = albumCount.length > 0 ? albumCount[0].totalAlbums : 0;
      
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
      
      // Get trending songs (sorted by streams)
      const trendingSongs = await collection
        .find({})
        .sort({ 'stats.spotify.totalStreams': -1 })
        .limit(20)
        .toArray();
      
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
      
      const songs = await collection
        .find({})
        .sort({ [sortField]: -1 })
        .limit(parseInt(limit as string))
        .toArray();
      
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
      const albumsCollection = db.collection('albums');
      
      // First check if albums collection exists
      const albumsFromCollection = await albumsCollection.find({}).toArray();
      console.log(`Albums in albums collection: ${albumsFromCollection.length}`);
      
      // Get unique albums from songs collection
      const albums = await songsCollection.aggregate([
        {
          $group: {
            _id: "$album",
            songCount: { $sum: 1 },
            totalStreams: { $sum: "$stats.spotify.totalStreams" },
            firstSong: { $first: "$$ROOT" }
          }
        },
        {
          $match: {
            _id: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "albums",
            localField: "_id",
            foreignField: "_id",
            as: "albumData"
          }
        },
        {
          $sort: { totalStreams: -1 }
        }
      ]).toArray();
      
      console.log(`Found ${albums.length} album groups from songs`);
      
      const formattedAlbums = albums.map(album => {
        const albumInfo = album.albumData?.[0] || {};
        return {
          _id: album._id,
          title: albumInfo.title || `Album ${album._id}`,
          cover: albumInfo.cover || '',
          releaseDate: albumInfo.releaseDate || '',
          type: 'album',
          calculatedStats: {
            songCount: album.songCount,
            totalStreams: album.totalStreams || 0
          }
        };
      });
      
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
      
      await rateLimitSpotify();
      await getSpotifyToken();
      
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
        const fallbackTracks = await collection.find({}).limit(30).toArray();
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
      
      await rateLimitSpotify();
      await getSpotifyToken();
      
      const searchResults = await spotifyApi.searchTracks(q as string, { 
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
        const fallbackTracks = await collection.find({
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { artist: { $regex: searchQuery, $options: 'i' } }
          ]
        }).limit(parseInt(req.query.limit as string || '30')).toArray();
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
      
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const aiPrompt = `Based on this request: "${prompt}", suggest ${count} BTS songs that match the mood and theme. Return only a JSON array with song titles and brief explanations for each choice.`;
      
      const result = await model.generateContent(aiPrompt);
      const response = await result.response;
      
      res.json({
        success: true,
        playlist: {
          name: `AI Generated: ${prompt}`,
          aiExplanation: response.text(),
          spotifyUrl: `https://open.spotify.com/playlist/dummy-ai-playlist-id`
        }
      });
    } catch (error) {
      console.error('Error generating AI playlist:', error);
      res.status(500).json({ error: 'Failed to generate AI playlist' });
    }
  });

  // Cleanup duplicates route
  app.post('/api/cleanup/duplicates', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
      // Find and remove duplicate songs by spotifyId
      const duplicates = await collection.aggregate([
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
      
      let removedCount = 0;
      for (const duplicate of duplicates) {
        // Keep the first document, remove the rest
        const toRemove = duplicate.docs.slice(1);
        for (const doc of toRemove) {
          await collection.deleteOne({ _id: doc._id });
          removedCount++;
        }
      }
      
      res.json({ 
        message: `Removed ${removedCount} duplicate songs`,
        duplicatesFound: duplicates.length
      });
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      res.status(500).json({ error: 'Failed to clean up duplicates' });
    }
  });

  // Comprehensive sync route to get all BTS music
  app.post('/api/sync', async (req, res) => {
    try {
      await getSpotifyToken();
      const db = await getMongoDb();
      const collection = db.collection('songs');
      const albumCollection = db.collection('albums');
      
      let allTracks: any[] = [];
      let allAlbums: any[] = [];
      let offset = 0;
      const limit = 50;
      
      // Search for BTS artist first
      const artistSearch = await spotifyApi.searchArtists('BTS', { limit: 1 });
      const btsArtist = artistSearch.body.artists?.items?.[0];
      
      if (!btsArtist) {
        return res.status(404).json({ error: 'BTS artist not found' });
      }
      
      console.log('Found BTS artist:', btsArtist.name, 'ID:', btsArtist.id);
      
      // Get all BTS albums
      let albumOffset = 0;
      let hasMoreAlbums = true;
      
      while (hasMoreAlbums) {
        await rateLimitSpotify();
        const albumResults = await spotifyApi.getArtistAlbums(btsArtist.id, {
          limit: 50,
          offset: albumOffset
        });
        
        const albums = (albumResults as any).body.items || [];
        allAlbums.push(...albums);
        
        console.log(`Fetched ${albums.length} albums (offset: ${albumOffset})`);
        
        hasMoreAlbums = albums.length === 50;
        albumOffset += 50;
      }
      
      console.log(`Total albums found: ${allAlbums.length}`);
      
      // Get tracks from each album
      for (const album of allAlbums) {
        try {
          await rateLimitSpotify();
          const albumTracks = await spotifyApi.getAlbumTracks(album.id, { limit: 50 });
          const tracks = albumTracks.body.items || [];
          
          // Get full track details including audio features
          for (const track of tracks) {
            try {
              await rateLimitSpotify();
              const fullTrack = await spotifyApi.getTrack(track.id);
              const trackData = fullTrack.body;
              
              // Save album data
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
              
              // Save track data
              const trackDoc = {
                _id: track.id,
                title: trackData.name,
                artist: trackData.artists.map((a: any) => a.name).join(', '),
                spotifyId: track.id,
                album: album.id,
                albumTitle: album.name,
                stats: {
                  spotify: {
                    dailyStreams: 0, // Would need additional API calls
                    monthlyStreams: 0,
                    totalStreams: 0,
                    popularity: trackData.popularity || 0
                  },
                  lastUpdated: new Date()
                },
                thumbnail: album.images?.[0]?.url || '',
                duration: trackData.duration_ms,
                releaseDate: album.release_date,
                mood: mood,
                spotifyUrl: trackData.external_urls?.spotify || '',
                uri: trackData.uri,
                audioFeatures: audioFeatures
              };
              
              await collection.updateOne(
                { spotifyId: track.id },
                { $set: trackDoc },
                { upsert: true }
              );
              
              allTracks.push(trackDoc);
              
            } catch (trackError) {
              if ((trackError as any).code === 11000) {
                // Duplicate key - track already exists, skip silently
                console.log(`Track already exists: ${track.name}`);
              } else {
                console.error('Error processing track:', track.name, trackError);
              }
            }
          }
          
          console.log(`Processed album: ${album.name} (${tracks.length} tracks)`);
          
        } catch (albumError) {
          console.error('Error processing album:', album.name, albumError);
        }
      }
      
      console.log(`Total tracks synced: ${allTracks.length}`);
      
      res.json({
        success: true,
        syncedTracks: allTracks.length,
        syncedAlbums: allAlbums.length,
        message: `Successfully synced ${allTracks.length} BTS tracks from ${allAlbums.length} albums`
      });
      
    } catch (error) {
      console.error('Error syncing data:', error);
      res.status(500).json({ error: 'Failed to sync data: ' + (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
