import mongoose from 'mongoose';
import Song from '../models/Song.js';
import Album from '../models/Album.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/armyverse');
    
    // Clear existing data
    await Song.deleteMany({});
    await Album.deleteMany({});
    
    // Create Albums
    const albums = [
      {
        title: 'Map of the Soul: 7',
        releaseDate: new Date('2020-02-21'),
        type: 'Studio Album',
        cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop',
        description: 'The fourth Korean studio album by BTS'
      },
      {
        title: 'BE',
        releaseDate: new Date('2020-11-20'),
        type: 'Studio Album',
        cover: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=500&h=500&fit=crop',
        description: 'The fifth Korean studio album by BTS'
      },
      {
        title: 'Proof',
        releaseDate: new Date('2022-06-10'),
        type: 'Compilation',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
        description: 'An anthology album by BTS'
      }
    ];

    const createdAlbums = await Album.insertMany(albums);
    
    // Create Songs with Spotify-only data
    const songs = [
      {
        title: 'Dynamite',
        artist: 'BTS',
        album: createdAlbums[1]._id,
        releaseDate: new Date('2020-08-21'),
        duration: 199,
        genres: ['K-Pop', 'Pop', 'Dance'],
        mood: 'Happy',
        isTitle: true,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        stats: {
          spotify: {
            totalStreams: 1400000000,
            monthlyStreams: 45000000,
            dailyStreams: 1500000,
            popularity: 95
          }
        }
      },
      {
        title: 'Butter',
        artist: 'BTS',
        album: createdAlbums[2]._id,
        releaseDate: new Date('2021-05-21'),
        duration: 164,
        genres: ['K-Pop', 'Pop', 'Dance'],
        mood: 'Happy',
        isTitle: true,
        thumbnail: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=300&h=300&fit=crop',
        stats: {
          spotify: {
            totalStreams: 1200000000,
            monthlyStreams: 42000000,
            dailyStreams: 1400000,
            popularity: 93
          }
        }
      },
      {
        title: 'Black Swan',
        artist: 'BTS',
        album: createdAlbums[0]._id,
        releaseDate: new Date('2020-01-17'),
        duration: 196,
        genres: ['K-Pop', 'R&B', 'Hip-Hop'],
        mood: 'Sad',
        isTitle: false,
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
        stats: {
          spotify: {
            totalStreams: 800000000,
            monthlyStreams: 25000000,
            dailyStreams: 850000,
            popularity: 88
          }
        }
      },
      {
        title: 'Spring Day',
        artist: 'BTS',
        album: createdAlbums[0]._id,
        releaseDate: new Date('2017-02-13'),
        duration: 236,
        genres: ['K-Pop', 'Ballad', 'R&B'],
        mood: 'Nostalgic',
        isTitle: true,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        stats: {
          spotify: {
            totalStreams: 950000000,
            monthlyStreams: 35000000,
            dailyStreams: 1200000,
            popularity: 91
          }
        }
      },
      {
        title: 'Life Goes On',
        artist: 'BTS',
        album: createdAlbums[1]._id,
        releaseDate: new Date('2020-11-20'),
        duration: 207,
        genres: ['K-Pop', 'Pop', 'Ballad'],
        mood: 'Calm',
        isTitle: true,
        thumbnail: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=300&h=300&fit=crop',
        stats: {
          spotify: {
            totalStreams: 750000000,
            monthlyStreams: 28000000,
            dailyStreams: 900000,
            popularity: 86
          }
        }
      }
    ];

    const createdSongs = await Song.insertMany(songs);
    
    // Update albums with song references
    for (const album of createdAlbums) {
      const albumSongs = createdSongs.filter(song => 
        song.album.toString() === album._id.toString()
      );
      
      album.songs = albumSongs.map(song => song._id);
      album.trackCount = albumSongs.length;
      
      // Calculate album stats
      album.stats.totalStreams = albumSongs.reduce((sum, song) => 
        sum + (song.stats.spotify.totalStreams || 0), 0
      );
      
      await album.save();
    }

    console.log('✅ Database seeded successfully!');
    console.log(`📀 Created ${createdAlbums.length} albums`);
    console.log(`🎵 Created ${createdSongs.length} songs`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export default seedData;