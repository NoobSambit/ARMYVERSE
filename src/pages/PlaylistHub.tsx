import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Music, 
  Search, 
  Plus, 
  Heart, 
  Brain, 
  Users, 
  Star,
  ArrowRight,
  Play,
  Zap,
  Palette,
  Target,
  TrendingUp,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SpotifyAuth from '../components/SpotifyAuth';

interface PlaylistFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const PlaylistHub: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleAuthenticated = (userId: string) => {
    setIsAuthenticated(true);
    setUserId(userId);
  };

  const aiFeatures: PlaylistFeature[] = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Generation",
      description: "Create playlists using advanced AI that understands your mood, preferences, and BTS favorites",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Mood-Based Creation",
      description: "Generate playlists based on specific moods like happy, sad, energetic, or relaxed",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Member-Focused",
      description: "Create playlists featuring specific BTS members or their solo work",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Era-Based Selection",
      description: "Generate playlists from specific BTS eras and albums",
      color: "from-orange-500 to-red-500"
    }
  ];

  const customFeatures: PlaylistFeature[] = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Advanced Search",
      description: "Search through the entire BTS discography with filters and sorting options",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: "Manual Curation",
      description: "Hand-pick your favorite tracks and create the perfect playlist",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Custom Organization",
      description: "Organize tracks by album, year, mood, or any criteria you prefer",
      color: "from-teal-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Quality Control",
      description: "Ensure every track meets your standards with detailed track information",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <motion.div 
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Header */}
            <motion.div 
              className="text-center mb-16"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Playlist Hub
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Create the perfect BTS playlist with AI assistance or manual curation. 
                Connect your Spotify account to save and sync your playlists.
              </motion.p>

              {/* Spotify Auth Section */}
              {!isAuthenticated ? (
                <motion.div
                  className="bg-black/40 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 max-w-md mx-auto"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="text-center mb-6">
                    <Heart className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Connect to Spotify
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Link your account to save playlists and access your library
                    </p>
                  </div>
                  <SpotifyAuth onAuthenticated={handleAuthenticated} />
                </motion.div>
              ) : (
                <motion.div
                  className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 max-w-md mx-auto"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                    <span className="text-green-400 font-medium">Connected to Spotify</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* AI Playlist Card */}
              <motion.div
                className="relative group"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">AI Playlist Creator</h2>
                      <p className="text-gray-400">Powered by advanced AI</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Let AI create the perfect BTS playlist for you. Describe your mood, 
                    preferences, or let the AI surprise you with amazing track combinations.
                  </p>

                  <div className="space-y-3 mb-8">
                    {aiFeatures.map((feature, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mr-3`}>
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                          <p className="text-gray-400 text-xs">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Link 
                    to="/ai-playlist"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Create AI Playlist
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </motion.div>

              {/* Custom Playlist Card */}
              <motion.div
                className="relative group"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Custom Playlist</h2>
                      <p className="text-gray-400">Manual curation</p>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Take full control and create your perfect playlist. Search through the 
                    entire BTS discography and hand-pick every track for your collection.
                  </p>

                  <div className="space-y-3 mb-8">
                    {customFeatures.map((feature, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`w-8 h-8 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mr-3`}>
                          {feature.icon}
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{feature.title}</h4>
                          <p className="text-gray-400 text-xs">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Link 
                    to="/create-playlist"
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Create Custom Playlist
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            {/* Benefits Section */}
            <motion.div 
              className="text-center mb-16"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                Why Choose Our Playlist Tools?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                  <p className="text-gray-400">Create playlists in seconds with AI or take your time with manual curation</p>
                </motion.div>

                <motion.div 
                  className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Star className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">BTS Focused</h3>
                  <p className="text-gray-400">Specialized for BTS fans with member-specific and era-based features</p>
                </motion.div>

                <motion.div 
                  className="bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Play className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Spotify Ready</h3>
                  <p className="text-gray-400">Direct integration with Spotify to save and sync your playlists</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlaylistHub; 