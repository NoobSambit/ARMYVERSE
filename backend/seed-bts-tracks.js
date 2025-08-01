import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from './models/Track.js';

dotenv.config();

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Get Spotify access token
const getSpotifyAccessToken = async () => {
  try {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('❌ Spotify credentials not set in environment variables');
      return null;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Spotify token error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to get Spotify access token:', error);
    return null;
  }
};

// === ARTIST MAP ===
const ARTIST_IDS = {
  BTS: '3Nrfpe0tUJi4K4DXYWgMUX',
  RM: '2auC28zjQyVTsiZKNgPRGs',
  Jin: '5vV3bFXnN6D6N3Nj4xRvaV',
  SUGA: '0ebNdVaOfp6N0oZ1guIxM8', // Agust D / SUGA
  'Agust D': '5RmQ8k4l3HZ8JoPb4mNsML',
  'j-hope': '0b1sIQumIAsNbqAoIClSpy',
  Jimin: '1oSPZhvZMIrWW5I41kPkkY',
  V: '3JsHnjpbhX4SnySpvpa9DK',
  'Jung Kook': '6HaGTQPmzraVmaVxvz6EUc'
};

// Create optimized Set for O(1) lookups (critical performance optimization)
const validArtistIdsSet = new Set(Object.values(ARTIST_IDS));

console.log('🎯 Valid BTS Family Artist IDs:', Array.from(validArtistIdsSet));

// === NEW HELPERS FOR FULL DISCOGRAPHY CRAWL ===

// Fetch Spotify artist ID by name (first search result)
const getArtistId = async (token, artistName) => {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error(`❌ Artist search failed for "${artistName}":`, res.status);
    return null;
  }
  const data = await res.json();
  return data.artists.items[0]?.id || null;
};

// Paginate through all albums for an artist ID (including appears_on for features)
const fetchAlbumsForArtist = async (token, artistId) => {
  let albums = [];
  let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on&limit=50`;
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error('❌ Album fetch error:', res.status, url);
      break;
    }
    const data = await res.json();
    albums = albums.concat(data.items);
    url = data.next;
    await new Promise(r => setTimeout(r, 300)); // small delay to respect rate limits
  }
  return albums;
};

// Fetch all tracks for an album ID (handles pagination if >50)
const fetchTracksForAlbum = async (token, albumId) => {
  // Get the full album object which includes tracks with complete album info
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, { 
    headers: { Authorization: `Bearer ${token}` } 
  });
  
  if (!res.ok) {
    console.error('❌ Album fetch error:', res.status, albumId);
    return [];
  }
  
  const albumData = await res.json();
  
  // Add the full album info to each track
  const tracksWithAlbumInfo = albumData.tracks.items.map(track => ({
    ...track,
    album: {
      id: albumData.id,
      name: albumData.name,
      images: albumData.images,
      release_date: albumData.release_date,
      album_type: albumData.album_type
    }
  }));
  
  await new Promise(r => setTimeout(r, 200));
  return tracksWithAlbumInfo;
};

// ===============================================

// Get track audio features
const getTrackFeatures = async (token, trackId) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to get features for track ${trackId}:`, error);
    return null;
  }
};

// Convert Spotify track to our Track model
const convertSpotifyTrack = (spotifyTrack, audioFeatures = null) => {
  return {
    spotifyId: spotifyTrack.id,
    name: spotifyTrack.name,
    artist: spotifyTrack.artists[0].name,
    album: spotifyTrack.album.name,
    duration: spotifyTrack.duration_ms,
    popularity: spotifyTrack.popularity,
    releaseDate: spotifyTrack.album.release_date,
    genres: [], // Will be populated from artist data if needed
    audioFeatures: audioFeatures ? {
      danceability: audioFeatures.danceability,
      energy: audioFeatures.energy,
      valence: audioFeatures.valence,
      tempo: audioFeatures.tempo,
      acousticness: audioFeatures.acousticness,
      instrumentalness: audioFeatures.instrumentalness,
      liveness: audioFeatures.liveness,
      speechiness: audioFeatures.speechiness
    } : null,
    thumbnails: {
      small: spotifyTrack.album.images[2]?.url || null,
      medium: spotifyTrack.album.images[1]?.url || null,
      large: spotifyTrack.album.images[0]?.url || null
    },
    previewUrl: spotifyTrack.preview_url,
    isExplicit: spotifyTrack.explicit,
    isBTSFamily: true // All tracks are pre-validated by track-level filtering
  };
};

// Main seeding function
const seedBTSTracks = async () => {
  try {
    console.log('🌱 Starting BTS tracks seeding...');

    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/armyverse';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Get Spotify access token
    const token = await getSpotifyAccessToken();
    if (!token) {
      throw new Error('Failed to get Spotify access token');
    }
    console.log('✅ Got Spotify access token');

    // === NEW FULL CATALOG FETCH ===
    const artistNames = ['BTS', 'RM', 'Jin', 'Suga', 'Agust D', 'j-hope', 'Jimin', 'V', 'Jung Kook'];

    const allTracks = [];
    const processedIds = new Set();
    const processedIsrcs = new Set();

    for (const artistName of artistNames) {
      console.log(`🎤 Processing artist: ${artistName}`);
      const artistId = ARTIST_IDS[artistName];
      if (!artistId) {
        console.warn(`⚠️  Artist ID not found for ${artistName}, skipping`);
        continue;
      }

      const albums = await fetchAlbumsForArtist(token, artistId);
      console.log(`   📀 Albums found: ${albums.length}`);

      for (const album of albums) {
        console.log(`   📀 Processing album: "${album.name}" (${album.album_type}) - ${album.total_tracks} tracks`);
        // Skip compilation albums and non-BTS releases to avoid duplicates
        if (album.album_type === 'compilation') {
          console.log(`🔀 Skipping compilation album: "${album.name}" (compilation)`);
          continue;
        }
        const albumHasBTSArtist = album.artists.some(a => validArtistIdsSet.has(a.id));
        if (!albumHasBTSArtist) {
          console.log(`🚫 Skipping album not by BTS-family: "${album.name}"`);
          continue;
        }

        const albumTracks = await fetchTracksForAlbum(token, album.id);
        for (const track of albumTracks) {
          // Dedupe across releases
          if (processedIds.has(track.id)) continue;
          const trackIsrc = track.external_ids?.isrc;
          if (trackIsrc && processedIsrcs.has(trackIsrc)) continue;
          
          // CRITICAL: Track-level validation - only authentic BTS family tracks
          const isTrackByBTSFamily = track.artists.some(artist => validArtistIdsSet.has(artist.id));
          
          if (!isTrackByBTSFamily) {
            console.log(`❌ Rejected non-BTS track: "${track.name}" by ${track.artists.map(a => a.name).join(', ')} (from ${album.name})`);
            continue;
          }
          
          console.log(`✅ Validated BTS track: "${track.name}" by ${track.artists.map(a => a.name).join(', ')}`);
          processedIds.add(track.id);
          if (trackIsrc) processedIsrcs.add(trackIsrc);
          allTracks.push({ ...track, album });
        }
      }
    }

    console.log(`📊 Total unique tracks collected: ${allTracks.length}`);

    // Get audio features in batches of 100
    const tracksWithFeatures = [];
    for (let i = 0; i < allTracks.length; i += 100) {
      const batch = allTracks.slice(i, i + 100);
      const ids = batch.map(t => t.id).join(',');
      const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let featuresArray = [];
      if (res.ok) {
        const data = await res.json();
        featuresArray = data.audio_features || [];
      } else {
        console.warn('⚠️  Audio-features fetch failed:', res.status);
      }

      batch.forEach((track, idx) => {
        const converted = convertSpotifyTrack(track, featuresArray[idx]);
        tracksWithFeatures.push(converted);
      });

      await new Promise(r => setTimeout(r, 500)); // rate-limit delay
    }

    // Clear and insert
    console.log('🗑️ Clearing existing tracks...');
    await Track.deleteMany({});

    console.log('💾 Inserting tracks to database...');
    const insertedTracks = await Track.insertMany(tracksWithFeatures);

    console.log(`✅ Successfully seeded ${insertedTracks.length} BTS-family tracks!`);

    // Summary
    const stats = {
      totalTracks: insertedTracks.length,
      byArtist: {},
      withPreview: insertedTracks.filter(t => t.previewUrl).length,
      withFeatures: insertedTracks.filter(t => t.audioFeatures).length
    };
    insertedTracks.forEach(t => {
      stats.byArtist[t.artist] = (stats.byArtist[t.artist] || 0) + 1;
    });
    console.log('📈 Breakdown by artist:', stats.byArtist);

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run the seeding
seedBTSTracks();