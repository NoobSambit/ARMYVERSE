import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Share2, Calendar, Music2, ExternalLink } from 'lucide-react';

interface SongCardProps {
  song: {
    id?: string;
    _id?: string;
    title: string;
    artist: string;
    album: {
      title: string;
      cover: string;
    };
    thumbnail?: string;
    duration: number;
    stats?: {
      spotify: {
        totalStreams: number;
        monthlyStreams: number;
        dailyStreams: number;
        popularity: number;
      };
    };
    popularity?: number;
    releaseDate: string;
    mood?: string;
    isTitle?: boolean;
    spotifyUrl?: string;
    uri?: string;
  };
  onClick?: () => void;
  showSpotifyLink?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({ song, onClick, showSpotifyLink = true }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSpotifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.spotifyUrl) {
      window.open(song.spotifyUrl, '_blank');
    }
  };

  // Get stats from either format (cached or live)
  const stats = song.stats?.spotify;
  const popularity = song.popularity || stats?.popularity || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-4 cursor-pointer border border-white/20 hover:border-white/40 transition-all duration-300 group"
    >
      <div className="flex items-start space-x-3 mb-3">
        {/* Thumbnail */}
        <div className="relative">
          <img
            src={song.thumbnail || song.album?.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'}
            alt={song.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            onClick={handleSpotifyClick}
            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer"
          >
            <Play className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-white truncate text-sm">{song.title}</h3>
            {song.isTitle && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                Title
              </span>
            )}
          </div>
          <p className="text-white/70 text-xs">{song.artist}</p>
          <p className="text-white/60 text-xs">{song.album?.title || song.album}</p>
          
          {/* Duration */}
          <div className="flex items-center space-x-1 mt-1">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-white/70">
              {formatDuration(song.duration)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {showSpotifyLink && song.spotifyUrl && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSpotifyClick}
              className="p-2 rounded-full bg-green-500/20 text-green-400 hover:text-green-300 hover:bg-green-500/30"
              title="Open in Spotify"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
          >
            <Heart className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Spotify Stats Section */}
      <div className="mb-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
        <div className="flex items-center space-x-2 mb-2">
          <Music2 className="w-4 h-4 text-green-400" />
          <span className="text-green-300 font-medium text-sm">Spotify</span>
          <span className="ml-auto text-green-300 text-xs">
            {popularity}/100
          </span>
        </div>
        
        {stats ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {stats.totalStreams && (
              <div>
                <span className="text-white/60 text-xs">Total</span>
                <div className="text-white font-medium text-sm">
                  {formatNumber(stats.totalStreams)}
                </div>
              </div>
            )}
            {stats.monthlyStreams && (
              <div>
                <span className="text-white/60 text-xs">Monthly</span>
                <div className="text-white font-medium text-sm">
                  {formatNumber(stats.monthlyStreams)}
                </div>
              </div>
            )}
            {stats.dailyStreams && (
              <div>
                <span className="text-white/60 text-xs">Daily</span>
                <div className="text-white font-medium text-sm">
                  {formatNumber(stats.dailyStreams)}
                </div>
              </div>
            )}
            <div>
              <span className="text-white/60 text-xs">Score</span>
              <div className="text-white font-medium text-sm">
                {popularity}%
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-1">
            <div className="text-white font-medium text-sm">{popularity}%</div>
            <span className="text-white/60 text-xs">Popularity Score</span>
          </div>
        )}
      </div>

      {/* Mood and Badges */}
      <div className="flex items-center justify-between">
        {song.mood && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30">
            {song.mood}
          </span>
        )}
        
        {/* Platform Badges */}
        <div className="flex space-x-1 flex-wrap">
          {popularity > 80 && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              🔥 Hot on Spotify
            </span>
          )}
          {stats?.totalStreams && stats.totalStreams > 1000000000 && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
              🎵 1B+ Streams
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SongCard;