import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Heart, Music, Star, TrendingUp, Play, ExternalLink } from 'lucide-react';
import { BTSAnalytics as BTSAnalyticsType, SpotifyTrack } from '../../utils/spotifyDashboard';

interface BTSAnalyticsProps {
  btsAnalytics: BTSAnalyticsType;
  loading?: boolean;
}

const BTSAnalytics: React.FC<BTSAnalyticsProps> = ({ btsAnalytics, loading = false }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'members' | 'tracks'>('overview');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const memberChartData = btsAnalytics.memberPreference.map((member, index) => ({
    member: member.member,
    plays: member.plays,
    color: `hsl(${index * 51}, 70%, 60%)`
  }));

  const radarData = btsAnalytics.memberPreference.map((member, index) => ({
    subject: member.member,
    A: member.plays,
    fullMark: Math.max(...btsAnalytics.memberPreference.map(m => m.plays))
  }));

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/40 backdrop-blur-lg rounded-3xl p-6 border border-purple-500/30"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-700 h-32 rounded-lg"></div>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-white flex items-center space-x-2"
        >
          <Heart className="w-5 h-5 text-red-400" />
          <span>BTS Analytics</span>
        </motion.h3>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-800/50 rounded-lg p-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'overview'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('members')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'members'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Members
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('tracks')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'tracks'
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Tracks
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Music className="w-5 h-5 text-red-400" />
                  <span className="text-xs text-red-300">BTS Plays</span>
                </div>
                <p className="text-2xl font-bold text-white">{btsAnalytics.totalBTSPlays}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-purple-300">Favorite Album</span>
                </div>
                <p className="text-lg font-bold text-white truncate">{btsAnalytics.favoriteBTSAlbum}</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 border border-pink-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <Play className="w-5 h-5 text-pink-400" />
                  <span className="text-xs text-pink-300">Solo Tracks</span>
                </div>
                <p className="text-2xl font-bold text-white">{btsAnalytics.soloTracks.length}</p>
              </motion.div>
            </div>

            {/* Member Preference Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="member" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #6B7280',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Bar dataKey="plays" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {viewMode === 'members' && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Radar Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                  <PolarRadiusAxis stroke="#9CA3AF" />
                  <Radar name="Plays" dataKey="A" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #6B7280',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Member List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {btsAnalytics.memberPreference.map((member, index) => (
                <motion.div
                  key={member.member}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{member.member}</p>
                      <p className="text-gray-400 text-sm">{member.plays} plays</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'tracks' && (
          <motion.div
            key="tracks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* BTS Tracks */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">BTS Group Tracks</h4>
              <div className="space-y-2">
                {btsAnalytics.btsTracks.slice(0, 5).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    <img
                      src={track.album.images[0]?.url || 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=40&h=40'}
                      alt={track.album.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm truncate">{track.album.name}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => window.open(track.external_urls.spotify, '_blank')}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Solo Tracks */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Solo Tracks</h4>
              <div className="space-y-2">
                {btsAnalytics.soloTracks.slice(0, 5).map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-300"
                  >
                    <img
                      src={track.album.images[0]?.url || 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=40&h=40'}
                      alt={track.album.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{track.name}</p>
                      <p className="text-gray-400 text-sm truncate">{track.artists.map(a => a.name).join(', ')}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => window.open(track.external_urls.spotify, '_blank')}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {btsAnalytics.totalBTSPlays === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No BTS content found</p>
          <p className="text-gray-500 text-sm">Start listening to BTS to see your analytics</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BTSAnalytics; 