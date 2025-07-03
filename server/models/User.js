import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  savedPlaylists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  createdPlaylists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  favoriteBias: {
    type: String,
    enum: ['RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'],
    default: null
  },
  preferences: {
    favoriteGenres: [{
      type: String,
      enum: ['K-Pop', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Ballad', 'Dance', 'Electronic']
    }],
    favoriteMoods: [{
      type: String,
      enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Inspirational', 'Nostalgic']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);