import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Music, X, Save, Shuffle, ExternalLink } from 'lucide-react';
import SongCard from '../components/SongCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

const PlaylistCreator = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load trending tracks on component mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await api.get('/playlist/trending');
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error fetching trending tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  // Search tracks when query changes
  useEffect(() => {
    const searchTracks = async () => {
      if (!searchQuery.trim()) {
        // Load trending when search is empty
        try {
          const response = await api.get('/playlist/trending');
          setSearchResults(response.data);
        } catch (error) {
          console.error('Error fetching trending tracks:', error);
        }
        return;
      }

      try {
        setSearchLoading(true);
        const response = await api.get(`/playlist/search-tracks?q=${encodeURIComponent(searchQuery)}&limit=30`);
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error searching tracks:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTracks, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSongSelect = (song: any) => {
    if (selectedSongs.find(s => s.id === song.id)) {
      setSelectedSongs(selectedSongs.filter(s => s.id !== song.id));
    } else {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || selectedSongs.length === 0) {
      alert('Please enter a playlist name and select at least one song.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/playlist/create-spotify', {
        name: playlistName,
        description: playlistDescription,
        spotifyTrackIds: selectedSongs.map(song => song.id),
        tags: ['manual', 'custom'],
        type: 'manual'
      });

      if (response.data.success) {
        alert(`✅ Playlist "${playlistName}" created successfully! Opening in Spotify...`);
        
        // Open Spotify playlist in new tab
        if (response.data.playlist.spotifyUrl) {
          window.open(response.data.playlist.spotifyUrl, '_blank');
        }
        
        // Reset form
        setPlaylistName('');
        setPlaylistDescription('');
        setSelectedSongs([]);
      }
      
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('❌ Error creating playlist. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShuffleSelection = () => {
    const shuffled = [...searchResults].sort(() => 0.5 - Math.random());
    setSelectedSongs(shuffled.slice(0, 10));
  };

  const totalDuration = selectedSongs.reduce((sum, song) => sum + (song.duration || 0), 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading BTS tracks..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Create Playlist
        </h1>
        <p className="text-white/80 text-lg">
          Search BTS tracks and create your perfect playlist on Spotify
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Song Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search BTS songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">
                {searchQuery ? `Search Results (${searchResults.length})` : `Trending BTS Tracks (${searchResults.length})`}
              </h3>
              <button
                onClick={handleShuffleSelection}
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm"
              >
                <Shuffle className="w-4 h-4" />
                <span>Random 10</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {searchResults.map((song) => (
                <motion.div
                  key={song.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSongSelect(song)}
                  className={`cursor-pointer transition-all duration-200 relative ${
                    selectedSongs.find(s => s.id === song.id)
                      ? 'ring-2 ring-purple-500 ring-opacity-50'
                      : ''
                  }`}
                >
                  <SongCard song={song} showSpotifyLink={false} />
                  {selectedSongs.find(s => s.id === song.id) && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-10">
                      ✓
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Playlist Info & Selected Songs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Playlist Details */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Playlist Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="My Awesome BTS Playlist"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Describe your playlist..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Playlist Stats */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/70">Songs:</span>
                <span className="text-white">{selectedSongs.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-white/70">Duration:</span>
                <span className="text-white">{formatDuration(totalDuration)}</span>
              </div>
            </div>

            {/* Create Button */}
            <div className="mt-6">
              <button
                onClick={handleCreatePlaylist}
                disabled={saving || !playlistName.trim() || selectedSongs.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Create on Spotify</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Selected Songs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Selected Songs</h2>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                >
                  <span className="text-white/60 text-sm w-6">{index + 1}</span>
                  <img
                    src={song.album.cover}
                    alt={song.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {song.title}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {song.artist}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSongSelect(song)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              
              {selectedSongs.length === 0 && (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-white/30 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">No songs selected yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlaylistCreator;