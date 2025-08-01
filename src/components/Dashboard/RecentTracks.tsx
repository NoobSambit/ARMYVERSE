import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Music, ExternalLink } from 'lucide-react';
import { SpotifyTrack } from '../../utils/spotifyDashboard';

interface RecentTracksProps {
  tracks: SpotifyTrack[];
  loading?: boolean;
}

const RecentTracks: React.FC<RecentTracksProps> = ({ tracks, loading = false }) => {
  const [expanded, setExpanded] = useState(false);
  const displayedTracks = expanded ? tracks : tracks.slice(0, 5);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (playedAt: string): string => {
    const now = new Date();
    const played = new Date(playedAt);
    const diffMs = now.getTime() - played.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/30"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="w-16 h-4 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-black/40 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/30"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-white flex items-center space-x-2"
        >
          <Music className="w-5 h-5 text-purple-400" />
          <span>Recent Tracks</span>
        </motion.h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded(!expanded)}
          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
        >
          {expanded ? 'Show Less' : `Show All (${tracks.length})`}
        </motion.button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayedTracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
            >
              {/* Album Art */}
              <div className="relative">
                <img
                  src={track.album.images[0]?.url || 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=60&h=60'}
                  alt={track.album.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="w-5 h-5 text-white" />
                </motion.div>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="text-white font-medium truncate"
                >
                  {track.name}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  className="text-gray-400 text-sm truncate"
                >
                  {track.artists.map(artist => artist.name).join(', ')}
                </motion.p>
              </div>

              {/* Duration & Actions */}
              <div className="flex items-center space-x-3">
                <div className="text-gray-400 text-sm flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(track.duration_ms)}</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => window.open(track.external_urls.spotify, '_blank')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {!expanded && tracks.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-gray-700/50"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(true)}
            className="w-full py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30 text-purple-300 hover:text-white transition-colors"
          >
            Show {tracks.length - 5} More Tracks
          </motion.button>
        </motion.div>
      )}

      {/* Empty State */}
      {tracks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Music className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No recent tracks found</p>
          <p className="text-gray-500 text-sm">Start listening to see your recent activity</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RecentTracks; 