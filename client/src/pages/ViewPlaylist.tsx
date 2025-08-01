import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music, Clock, Play, Share2, Heart, Download, Sparkles } from 'lucide-react';
import SongCard from '../components/SongCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

const ViewPlaylist = () => {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;
      
      try {
        const response = await api.get(`/playlist/${id}`);
        setPlaylist(response.data);
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading playlist..." />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12 space-y-4">
        <Music className="w-20 h-20 text-white/30 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Playlist Not Found</h2>
        <p className="text-white/70">The playlist you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Playlist Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
      >
        <div className="flex flex-col md:flex-row md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Playlist Icon */}
          <div className={`p-6 rounded-xl ${
            playlist.type === 'ai' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
              : 'bg-gradient-to-r from-blue-500 to-teal-500'
          }`}>
            {playlist.type === 'ai' ? (
              <Sparkles className="w-12 h-12 text-white" />
            ) : (
              <Music className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {playlist.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                playlist.type === 'ai'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {playlist.type === 'ai' ? 'AI Generated' : 'Manual'}
              </span>
            </div>
            
            <p className="text-white/80 text-lg mb-4">{playlist.description}</p>
            
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center space-x-1">
                <Music className="w-4 h-4" />
                <span>{playlist.songs.length} songs</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(playlist.duration)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Created on {formatDate(playlist.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-8">
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Play All</span>
          </button>
          
          {playlist.spotifyUrl && (
            <button 
              onClick={() => window.open(playlist.spotifyUrl, '_blank')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.6 0-.359.24-.66.54-.78 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.48.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Open in Spotify</span>
            </button>
          )}
          
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Save</span>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
          
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* AI Explanation */}
      {playlist.type === 'ai' && playlist.aiExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">AI Explanation</h2>
          </div>
          <p className="text-white/80 italic">"{playlist.aiExplanation}"</p>
          
          {playlist.aiPrompt && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <p className="text-white/60 text-sm">
                <strong>Original Prompt:</strong> "{playlist.aiPrompt}"
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Tags */}
      {playlist.tags && playlist.tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {playlist.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full border border-white/20"
            >
              #{tag}
            </span>
          ))}
        </motion.div>
      )}

      {/* Songs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold text-white">Songs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlist.songs.map((song: any, index: number) => (
            <motion.div
              key={song._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <SongCard song={song} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ViewPlaylist;