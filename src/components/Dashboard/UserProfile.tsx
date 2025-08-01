import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Music, Heart, Play, TrendingUp } from 'lucide-react';
import { SpotifyUser, DashboardOverview } from '../../utils/spotifyDashboard';

interface UserProfileProps {
  user: SpotifyUser;
  overview: DashboardOverview;
  loading?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, overview, loading = false }) => {
  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/30"
      >
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-700 h-20 rounded-lg"></div>
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
      {/* User Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <img
            src={user.images[0]?.url || 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=150&h=150'}
            alt={user.display_name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-purple-500/30"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </motion.div>
        
        <div className="flex-1">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold text-white mb-2"
          >
            {user.display_name}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center space-x-4 text-gray-300 text-sm"
          >
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Member for {overview.accountAge}</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{formatNumber(user.followers.total)} followers</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{overview.currentStreak} day streak</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Music className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-300">Tracks</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(overview.totalTracks)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 border border-pink-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <User className="w-5 h-5 text-pink-400" />
            <span className="text-xs text-pink-300">Artists</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(overview.totalArtists)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Play className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-300">Playlists</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(overview.totalPlaylists)}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-red-400" />
            <span className="text-xs text-red-300">BTS Plays</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(overview.btsPlays)}</p>
          <p className="text-xs text-red-300">{overview.btsPercentage}% of total</p>
        </motion.div>
      </motion.div>

      {/* Listening Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Total Listening Time</p>
            <p className="text-lg font-bold text-white">{formatDuration(overview.totalListeningTime)}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile; 