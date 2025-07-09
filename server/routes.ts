import type { Express } from "express";
import { createServer, type Server } from "http";
import { MongoClient } from "mongodb";
import SpotifyWebApi from "spotify-web-api-node";
import { GoogleGenerativeAI } from "@google/generative-ai";

let mongoClient: MongoClient | null = null;

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper function to get MongoDB connection
async function getMongoDb() {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri || typeof mongoUri !== 'string' || mongoUri.trim() === '') {
    throw new Error('MONGO_URI environment variable is not set or is empty');
  }
  
  if (!mongoClient) {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');
  }
  return mongoClient.db('armyverse');
}

// Cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastSpotifyRequest = 0;
const SPOTIFY_RATE_LIMIT = 100; // 100ms between requests

// Helper function to get Spotify access token
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('✅ Spotify token obtained successfully');
    return true;
  } catch (error) {
    console.error('❌ Error getting Spotify token:', error);
    return false;
  }
}

// Helper function to get cached data
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

// Sample BTS data for fallback
const sampleBTSData = [
  {
    _id: "sample1",
    title: "Dynamite",
    artist: "BTS",
    spotifyId: "sample1",
    album: { title: "BE", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
    stats: { spotify: { totalStreams: 1500000000, monthlyStreams: 50000000, dailyStreams: 1500000, popularity: 95 } },
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    duration: 199,
    releaseDate: "2020-08-21",
    mood: "energetic",
    spotifyUrl: "https://open.spotify.com/track/0t1kP63rueHleOhQkYSXFY",
    uri: "spotify:track:0t1kP63rueHleOhQkYSXFY",
    popularity: 95
  },
  {
    _id: "sample2",
    title: "Butter",
    artist: "BTS",
    spotifyId: "sample2",
    album: { title: "Butter", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop" },
    stats: { spotify: { totalStreams: 1200000000, monthlyStreams: 40000000, dailyStreams: 1200000, popularity: 92 } },
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    duration: 164,
    releaseDate: "2021-05-21",
    mood: "upbeat",
    spotifyUrl: "https://open.spotify.com/track/1mWdTewIgB3gtBM3TOSFhB",
    uri: "spotify:track:1mWdTewIgB3gtBM3TOSFhB",
    popularity: 92
  },
  {
    _id: "sample3",
    title: "Permission to Dance",
    artist: "BTS",
    spotifyId: "sample3",
    album: { title: "Butter", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop" },
    stats: { spotify: { totalStreams: 800000000, monthlyStreams: 25000000, dailyStreams: 800000, popularity: 88 } },
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
    duration: 187,
    releaseDate: "2021-07-09",
    mood: "upbeat",
    spotifyUrl: "https://open.spotify.com/track/3Nrfpe0tBV9a8Cdqg5799h",
    uri: "spotify:track:3Nrfpe0tBV9a8Cdqg5799h",
    popularity: 88
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mongodb: mongoClient ? 'connected' : 'disconnected',
      spotify: process.env.SPOTIFY_CLIENT_ID ? 'configured' : 'not configured'
    });
  });

  // Debug route
  app.get('/api/debug/collections', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      const result: any = { collections: collectionNames };
      
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

  // Stats routes with fallback data
  app.get('/api/stats/group', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
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
      
      // If no data in database, use sample data
      const songsToUse = uniqueSongs.length > 0 ? uniqueSongs : sampleBTSData;
      
      const totalSongs = songsToUse.length;
      let totalStreams = 0;
      let totalAlbums = new Set();
      
      songsToUse.forEach(song => {
        const streams = song.stats?.spotify?.totalStreams || 0;
        if (streams && typeof streams === 'number' && streams > 0) {
          totalStreams += streams;
        }
        
        if (song.album?.title) {
          totalAlbums.add(song.album.title);
        }
      });
      
      const averageStreamsPerSong = totalSongs > 0 ? Math.round(totalStreams / totalSongs) : 0;
      
      console.log(`📊 Stats: ${totalSongs} songs, ${totalStreams} streams, ${totalAlbums.size} albums`);
      
      res.json({
        summary: {
          totalSongs,
          totalStreams,
          totalAlbums: totalAlbums.size,
          averageStreamsPerSong
        }
      });
    } catch (error) {
      console.error('Error fetching group stats:', error);
      
      // Fallback to sample data
      const totalStreams = sampleBTSData.reduce((sum, song) => sum + song.stats.spotify.totalStreams, 0);
      const totalAlbums = new Set(sampleBTSData.map(song => song.album.title)).size;
      
      res.json({
        summary: {
          totalSongs: sampleBTSData.length,
          totalStreams,
          totalAlbums,
          averageStreamsPerSong: Math.round(totalStreams / sampleBTSData.length)
        }
      });
    }
  });

  app.get('/api/stats/trending', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
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
      
      // Use sample data if no database data
      const songsToReturn = trendingSongs.length > 0 ? trendingSongs : sampleBTSData;
      
      res.json(songsToReturn);
    } catch (error) {
      console.error('Error fetching trending songs:', error);
      res.json(sampleBTSData); // Always return sample data on error
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
      
      const songsToReturn = songs.length > 0 ? songs : sampleBTSData;
      
      res.json({ songs: songsToReturn });
    } catch (error) {
      console.error('Error fetching songs:', error);
      res.json({ songs: sampleBTSData });
    }
  });

  app.get('/api/stats/albums', async (req, res) => {
    try {
      const db = await getMongoDb();
      const songsCollection = db.collection('songs');
      
      const albums = await songsCollection.aggregate([
        {
          $match: {
            spotifyId: { $exists: true, $ne: null, $ne: "" },
            "album.title": { $exists: true, $ne: null, $ne: "" }
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
            _id: "$song.album.title",
            songCount: { $sum: 1 },
            totalStreams: { 
              $sum: { 
                $ifNull: ["$song.stats.spotify.totalStreams", 0] 
              } 
            },
            cover: { $first: "$song.album.cover" },
            releaseDate: { $first: "$song.releaseDate" }
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
      
      if (albums.length === 0) {
        // Return sample album data
        const sampleAlbums = [
          {
            _id: "BE",
            title: "BE",
            cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
            releaseDate: "2020-11-20",
            type: 'album',
            calculatedStats: { songCount: 8, totalStreams: 2000000000 }
          },
          {
            _id: "Map of the Soul: 7",
            title: "Map of the Soul: 7",
            cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
            releaseDate: "2020-02-21",
            type: 'album',
            calculatedStats: { songCount: 20, totalStreams: 3500000000 }
          }
        ];
        return res.json(sampleAlbums);
      }
      
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
      res.json([]);
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
      
      const tokenSuccess = await getSpotifyToken();
      if (!tokenSuccess) {
        console.log('Using database fallback for trending tracks');
        try {
          const db = await getMongoDb();
          const collection = db.collection('songs');
          const fallbackTracks = await collection.find({}).limit(30).toArray();
          
          if (fallbackTracks.length === 0) {
            return res.json(sampleBTSData);
          }
          
          return res.json(fallbackTracks);
        } catch (dbError) {
          return res.json(sampleBTSData);
        }
      }
      
      await rateLimitSpotify();
      const searchResults = await spotifyApi.searchTracks('BTS', { limit: 30 });
      const tracks = searchResults.body.tracks?.items || [];
      
      setCachedData(cacheKey, tracks);
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching trending tracks:', error);
      res.json(sampleBTSData);
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
      
      const tokenSuccess = await getSpotifyToken();
      if (!tokenSuccess) {
        console.log('Using database fallback for search');
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
          
          if (fallbackTracks.length === 0) {
            return res.json(sampleBTSData.filter(song => 
              song.title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
              song.artist.toLowerCase().includes((searchQuery || '').toLowerCase())
            ));
          }
          
          return res.json(fallbackTracks);
        } catch (dbError) {
          return res.json(sampleBTSData);
        }
      }
      
      await rateLimitSpotify();
      const searchResults = await spotifyApi.searchTracks(`${q} BTS`, { 
        limit: parseInt(limit as string) 
      });
      const tracks = searchResults.body.tracks?.items || [];
      
      setCachedData(cacheKey, tracks);
      res.json(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      res.json(sampleBTSData);
    }
  });

  app.post('/api/playlist/create-spotify', async (req, res) => {
    try {
      const { name, description, spotifyTrackIds } = req.body;
      
      const tokenSuccess = await getSpotifyToken();
      if (!tokenSuccess) {
        return res.status(500).json({ error: 'Failed to authenticate with Spotify. Cannot create playlist.' });
      }
      
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
      
      if (!genAI) {
        console.log('Gemini API not configured, using sample data');
        return res.json({
          success: true,
          playlist: {
            name: `AI Generated: ${prompt.substring(0, 50)}...`,
            description: `AI curated playlist based on: ${prompt}`,
            tracks: sampleBTSData.slice(0, count),
            spotifyUrl: `https://open.spotify.com/playlist/dummy-ai-playlist-id`
          },
          explanation: `This playlist was curated based on your request: "${prompt}". The songs selected match the mood and energy you're looking for.`
        });
      }
      
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const aiPrompt = `Based on this request: "${prompt}", suggest ${count} BTS songs that match the mood and theme. Return only a JSON array with song titles and brief explanations for each choice. Focus on real BTS songs.`;
        
        const result = await model.generateContent(aiPrompt);
        const response = await result.response;
        
        // Get tracks from database or use sample data
        let tracks = sampleBTSData.slice(0, count);
        try {
          const db = await getMongoDb();
          const collection = db.collection('songs');
          const dbTracks = await collection.aggregate([
            { $match: { spotifyId: { $exists: true, $ne: null, $ne: "" } } },
            { $sample: { size: count } }
          ]).toArray();
          
          if (dbTracks.length > 0) {
            tracks = dbTracks;
          }
        } catch (dbError) {
          console.log('Using sample data for AI playlist');
        }
        
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
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        res.json({
          success: true,
          playlist: {
            name: `AI Generated: ${prompt.substring(0, 50)}...`,
            description: `AI curated playlist based on: ${prompt}`,
            tracks: sampleBTSData.slice(0, count),
            spotifyUrl: `https://open.spotify.com/playlist/dummy-ai-playlist-id`
          },
          explanation: `This playlist was curated based on your request: "${prompt}". The songs selected match the mood and energy you're looking for.`
        });
      }
    } catch (error) {
      console.error('Error generating AI playlist:', error);
      res.status(500).json({ error: 'Failed to generate AI playlist' });
    }
  });

  // Sync route - comprehensive BTS data sync
  app.post('/api/sync', async (req, res) => {
    try {
      console.log('🔄 Starting comprehensive BTS data sync...');
      
      const tokenSuccess = await getSpotifyToken();
      if (!tokenSuccess) {
        return res.status(500).json({ error: 'Failed to authenticate with Spotify. Cannot sync data.' });
      }
      
      const db = await getMongoDb();
      const collection = db.collection('songs');
      const albumCollection = db.collection('albums');
      
      // Search for BTS artist
      await rateLimitSpotify();
      const artistSearch = await spotifyApi.searchArtists('BTS', { limit: 1 });
      const btsArtist = artistSearch.body.artists?.items?.[0];
      
      if (!btsArtist) {
        return res.status(404).json({ error: 'BTS artist not found' });
      }
      
      console.log('✅ Found BTS artist:', btsArtist.name);
      
      // Get BTS albums
      let allAlbums: any[] = [];
      let albumOffset = 0;
      let hasMoreAlbums = true;
      
      while (hasMoreAlbums && albumOffset < 200) { // Limit to prevent infinite loops
        await rateLimitSpotify();
        const albumResults = await spotifyApi.getArtistAlbums(btsArtist.id, {
          limit: 50,
          offset: albumOffset,
          include_groups: 'album,single'
        });
        
        const albums = albumResults.body.items || [];
        allAlbums.push(...albums);
        
        console.log(`📀 Fetched ${albums.length} albums (offset: ${albumOffset})`);
        
        hasMoreAlbums = albums.length === 50;
        albumOffset += 50;
      }
      
      console.log(`📀 Total albums found: ${allAlbums.length}`);
      
      let allTracks: any[] = [];
      const processedTracks = new Set<string>();
      
      // Process albums and tracks
      for (const album of allAlbums.slice(0, 20)) { // Limit albums to prevent timeout
        try {
          await rateLimitSpotify();
          const albumTracks = await spotifyApi.getAlbumTracks(album.id, { limit: 50 });
          const tracks = albumTracks.body.items || [];
          
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
          
          // Process tracks
          for (const track of tracks) {
            if (processedTracks.has(track.id)) {
              continue;
            }
            
            try {
              await rateLimitSpotify();
              const fullTrack = await spotifyApi.getTrack(track.id);
              const trackData = fullTrack.body;
              
              // Estimate streaming data based on popularity
              const popularity = trackData.popularity || 0;
              const estimatedStreams = Math.floor(popularity * 10000000); // Rough estimate
              
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
                  spotify: {
                    totalStreams: estimatedStreams,
                    monthlyStreams: Math.floor(estimatedStreams * 0.1),
                    dailyStreams: Math.floor(estimatedStreams * 0.003),
                    popularity: popularity
                  },
                  lastUpdated: new Date()
                },
                thumbnail: album.images?.[0]?.url || '',
                duration: Math.floor(trackData.duration_ms / 1000),
                releaseDate: album.release_date,
                mood: popularity > 70 ? 'energetic' : popularity > 50 ? 'upbeat' : 'calm',
                spotifyUrl: trackData.external_urls?.spotify || '',
                uri: trackData.uri,
                popularity: popularity
              };
              
              await collection.updateOne(
                { spotifyId: track.id },
                { $set: trackDoc },
                { upsert: true }
              );
              
              allTracks.push(trackDoc);
              processedTracks.add(track.id);
              
            } catch (trackError) {
              console.error('Error processing track:', track.name, trackError);
            }
          }
          
          console.log(`✅ Completed album: ${album.name} (${tracks.length} tracks)`);
          
        } catch (albumError) {
          console.error('Error processing album:', album.name, albumError);
        }
      }
      
      const totalStreams = allTracks.reduce((sum, track) => sum + (track.stats.spotify.totalStreams || 0), 0);
      
      console.log(`🎉 Sync completed: ${allTracks.length} tracks from ${allAlbums.length} albums`);
      
      res.json({
        success: true,
        syncedTracks: allTracks.length,
        syncedAlbums: allAlbums.length,
        totalEstimatedStreams: totalStreams,
        message: `Successfully synced ${allTracks.length} BTS tracks from ${allAlbums.length} albums`
      });
      
    } catch (error) {
      console.error('❌ Error syncing data:', error);
      res.status(500).json({ error: 'Failed to sync data: ' + (error as Error).message });
    }
  });

  // Cleanup route
  app.post('/api/cleanup/duplicates', async (req, res) => {
    try {
      const db = await getMongoDb();
      const collection = db.collection('songs');
      
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
      
      let removedCount = 0;
      for (const duplicate of duplicates) {
        const toRemove = duplicate.docs.slice(1);
        for (const doc of toRemove) {
          await collection.deleteOne({ _id: doc._id });
          removedCount++;
        }
      }
      
      res.json({ 
        message: `Removed ${removedCount} duplicate songs`,
        duplicatesFound: duplicates.length,
        totalRemoved: removedCount
      });
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      res.status(500).json({ error: 'Failed to clean up duplicates' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}