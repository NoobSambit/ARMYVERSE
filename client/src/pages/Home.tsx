import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Music, Users, Star, ArrowRight, Play, RefreshCw, Music2 } from 'lucide-react';
import SongCard from '../components/SongCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, trendingResponse] = await Promise.all([
        api.get('/stats/group'),
        api.get('/stats/trending')
      ]);
      
      setStats(statsResponse.data);
      setTrending(trendingResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setSyncing(true);
    try {
      // Refresh the data from Spotify
      await fetchData();
      alert('✅ Data refreshed successfully from Spotify!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('❌ Error refreshing data. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      title: 'Spotify Streams',
      value: stats?.summary?.totalStreams || 0,
      icon: Music2,
      color: 'from-green-500 to-emerald-500',
      platform: 'spotify'
    },
    {
      title: 'Songs',
      value: stats?.summary?.totalSongs || 0,
      icon: Music,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Albums',
      value: stats?.summary?.totalAlbums || 0,
      icon: Star,
      color: 'from-orange-500 to-yellow-500'
    },
    {
      title: 'Avg Streams/Song',
      value: stats?.summary?.averageStreamsPerSong || 0,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading ARMYverse..." />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center py-20"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          ARMYverse
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto"
        >
          Your ultimate destination for BTS music analytics, AI-powered playlists, and real-time Spotify streaming data
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            to="/stats"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Explore Stats</span>
          </Link>
          <Link
            to="/ai-playlist"
            className="bg-white/10 backdrop-blur-lg text-white px-6 py-2.5 rounded-lg font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
          >
            <Music className="w-5 h-5" />
            <span>Create AI Playlist</span>
          </Link>
          <button
            onClick={handleRefreshData}
            disabled={syncing}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm"
          >
            {syncing ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </motion.div>
      </motion.section>

      {/* Stats Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-5 border border-white/20 hover:border-white/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-white/60 text-xs font-medium">{stat.title}</span>
                  {stat.platform && (
                    <div className="text-xs px-2 py-0.5 rounded-full mt-1 bg-green-500/20 text-green-300 border border-green-500/30">
                      🎵 Spotify
                    </div>
                  )}
                </div>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatNumber(stat.value)}
              </div>
            </motion.div>
          );
        })}
      </motion.section>

      {/* Spotify Overview */}
      {stats?.summary?.totalSongs > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-green-500/10 backdrop-blur-lg rounded-xl p-5 border border-green-500/20"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500 p-2.5 rounded-lg">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Spotify Analytics</h3>
              <p className="text-green-300 text-sm">Streaming Performance Overview</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xl font-bold text-green-300">
                {formatNumber(stats.summary.totalStreams)}
              </div>
              <div className="text-white/70 text-xs">Total Streams</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xl font-bold text-green-300">
                {formatNumber(stats.summary.averageStreamsPerSong)}
              </div>
              <div className="text-white/70 text-xs">Avg per Song</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-xl font-bold text-green-300">
                {stats.summary.totalSongs}
              </div>
              <div className="text-white/70 text-xs">Total Songs</div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Trending Songs */}
      {trending.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">🔥 Trending Now</h2>
            <Link
              to="/stats"
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.slice(0, 6).map((song, index) => (
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
        </motion.section>
      )}

      {/* Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Spotify Integration</h3>
          <p className="text-white/70 text-sm">
            Real-time streaming data, popularity scores, and detailed analytics from Spotify's official API.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Live Data Sync</h3>
          <p className="text-white/70 text-sm">
            Automatically fetch and update the latest streaming statistics from Spotify.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">AI Playlists</h3>
          <p className="text-white/70 text-sm">
            Create personalized BTS playlists using AI and export them directly to your Spotify account.
          </p>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;