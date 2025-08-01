import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Music, Calendar, Filter, Search, Music2, RefreshCw } from 'lucide-react';
import SongCard from '../components/SongCard';
import StatChart from '../components/StatChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';

const StatsDashboard = () => {
  const [songs, setSongs] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [groupStats, setGroupStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortBy, setSortBy] = useState('totalStreams');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  const fetchData = async () => {
    try {
      const [songsResponse, albumsResponse, groupResponse] = await Promise.all([
        api.get(`/stats/songs?sort=${sortBy}&limit=50`),
        api.get('/stats/albums'),
        api.get('/stats/group')
      ]);
      
      setSongs(songsResponse.data.songs || []);
      setAlbums(albumsResponse.data || []);
      setGroupStats(groupResponse.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await api.post('/sync');
      console.log('Sync result:', response.data);
      
      // Refresh data after sync
      await fetchData();
      
      alert('✅ Data synced successfully!');
    } catch (error) {
      console.error('Error syncing data:', error);
      alert('❌ Error syncing data. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    topSongs: songs.slice(0, 10).map(song => ({
      name: song.title.length > 15 ? song.title.substring(0, 15) + '...' : song.title,
      streams: song.stats.spotify.totalStreams
    })),
    albumStats: albums.map(album => ({
      name: album.title.length > 15 ? album.title.substring(0, 15) + '...' : album.title,
      streams: album.calculatedStats.totalStreams,
      songs: album.calculatedStats.songCount
    })),
    moodDistribution: songs.reduce((acc, song) => {
      if (song.mood) {
        acc[song.mood] = (acc[song.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  };

  const moodChartData = Object.entries(chartData.moodDistribution).map(([mood, count]) => ({
    name: mood,
    value: count
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading analytics..." />
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
          Analytics Dashboard
        </h1>
        <p className="text-white/80 text-lg">
          Deep dive into BTS's performance on Spotify
        </p>
      </motion.div>

      {/* Group Stats Summary */}
      {groupStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              BTS Overview
            </h2>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              {syncing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Music2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-300">
                {(groupStats.summary.totalStreams / 1000000000).toFixed(1)}B
              </div>
              <div className="text-white/70 text-sm">Spotify Streams</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Music className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-300">
                {groupStats.summary.totalSongs}
              </div>
              <div className="text-white/70 text-sm">Songs</div>
            </div>
            <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <BarChart3 className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-300">
                {groupStats.summary.totalAlbums}
              </div>
              <div className="text-white/70 text-sm">Albums</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-300">
                {(groupStats.summary.averageStreamsPerSong / 1000000).toFixed(1)}M
              </div>
              <div className="text-white/70 text-sm">Avg per Song</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <StatChart
          data={chartData.topSongs}
          type="bar"
          title="🎵 Top Songs by Spotify Streams"
          xAxisKey="name"
          yAxisKey="streams"
          color="#1DB954"
        />
        <StatChart
          data={chartData.albumStats}
          type="bar"
          title="📀 Albums by Total Streams"
          xAxisKey="name"
          yAxisKey="streams"
          color="#8B5CF6"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <StatChart
          data={chartData.topSongs}
          type="line"
          title="📈 Streaming Trends"
          xAxisKey="name"
          yAxisKey="streams"
          color="#10B981"
        />
        <StatChart
          data={moodChartData}
          type="pie"
          title="🎭 Songs by Mood Distribution"
          xAxisKey="name"
          yAxisKey="value"
          height={350}
        />
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center"
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-white/60" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="totalStreams">Total Streams</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </motion.div>

      {/* Songs Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredSongs.map((song, index) => (
          <motion.div
            key={song._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <SongCard song={song} />
          </motion.div>
        ))}
      </motion.div>

      {filteredSongs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Music className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 text-lg">No songs found matching your search.</p>
        </motion.div>
      )}
    </div>
  );
};

export default StatsDashboard;