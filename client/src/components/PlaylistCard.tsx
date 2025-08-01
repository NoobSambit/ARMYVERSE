import React from 'react';
import { motion } from 'framer-motion';
import { Music, Clock, Users, Sparkles } from 'lucide-react';

interface PlaylistCardProps {
  playlist: {
    _id: string;
    name: string;
    description: string;
    type: 'manual' | 'ai';
    songs: Array<{
      _id: string;
      title: string;
      artist: string;
      duration: number;
    }>;
    duration: number;
    mood?: string;
    tags: string[];
    createdAt: string;
    aiExplanation?: string;
  };
  onClick?: () => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 cursor-pointer border border-white/20 hover:border-white/40 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${
            playlist.type === 'ai' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
              : 'bg-gradient-to-r from-blue-500 to-teal-500'
          }`}>
            {playlist.type === 'ai' ? (
              <Sparkles className="w-6 h-6 text-white" />
            ) : (
              <Music className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{playlist.name}</h3>
            <p className="text-white/70 text-sm">{playlist.description}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          playlist.type === 'ai'
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {playlist.type === 'ai' ? 'AI Generated' : 'Manual'}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-white/70 text-sm mb-4">
        <div className="flex items-center space-x-1">
          <Music className="w-4 h-4" />
          <span>{playlist.songs.length} songs</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatDuration(playlist.duration)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4" />
          <span>{formatDate(playlist.createdAt)}</span>
        </div>
      </div>

      {/* Tags */}
      {playlist.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {playlist.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {playlist.tags.length > 3 && (
            <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
              +{playlist.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* AI Explanation */}
      {playlist.type === 'ai' && playlist.aiExplanation && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/70 text-sm italic">
            "{playlist.aiExplanation.substring(0, 100)}..."
          </p>
        </div>
      )}

      {/* Song Preview */}
      <div className="mt-4 space-y-2">
        <p className="text-white/60 text-xs font-medium">PREVIEW</p>
        {playlist.songs.slice(0, 3).map((song, index) => (
          <div key={song._id} className="flex items-center space-x-3 text-sm">
            <span className="text-white/40 w-4">{index + 1}</span>
            <span className="text-white/80 truncate">{song.title}</span>
            <span className="text-white/60 text-xs ml-auto">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        ))}
        {playlist.songs.length > 3 && (
          <p className="text-white/60 text-xs">
            and {playlist.songs.length - 3} more songs...
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PlaylistCard;