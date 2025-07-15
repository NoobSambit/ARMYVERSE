import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Music, Lightbulb, Wand2, RefreshCw, ExternalLink } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import SongCard from '../components/SongCard';
import { api } from '../services/api';

const AIPlaylist = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const promptSuggestions = [
    "Create a upbeat BTS playlist for working out",
    "I need sad BTS songs for a rainy day",
    "Make me a romantic BTS playlist for a date night",
    "Create an energetic BTS playlist for studying",
    "I want nostalgic BTS songs that remind me of 2018",
    "Make a chill BTS playlist for relaxing at home",
    "Create a motivational BTS playlist for overcoming challenges",
    "I need BTS songs that make me feel confident"
  ];

  const handleGeneratePlaylist = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt to generate a playlist.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/generatePlaylist', {
        theme: prompt.trim()
      });

      if (response.data.message === 'Playlist created') {
        // Fetch the created playlist
        const playlistResponse = await api.get(`/playlists/${response.data.playlistId}`);
        
        setResult({
          playlist: {
            name: `AI Generated: ${playlistResponse.data.theme}`,
            description: `AI curated playlist based on: ${playlistResponse.data.theme}`,
            songs: playlistResponse.data.songs,
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(playlistResponse.data.theme + ' BTS')}`
          },
          explanation: `This playlist was curated based on your request: "${prompt}". The AI selected these BTS songs to match your theme.`
        });
        
        alert(`✅ AI Playlist created successfully with ${playlistResponse.data.songs.length} songs!`);
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      if (error.response?.status === 503) {
        alert('❌ AI service unavailable. Please configure Gemini API key.');
      } else {
        alert('❌ Error generating playlist. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleReset = () => {
    setPrompt('');
    setResult(null);
  };

  const handleOpenSpotify = () => {
    if (result?.playlist?.spotifyUrl) {
      window.open(result.playlist.spotifyUrl, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          AI Playlist Generator
        </h1>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Tell me what you're feeling or what you need, and I'll create the perfect BTS playlist and add it to your Spotify
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Describe Your Perfect Playlist</h2>
          </div>
          
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a motivational BTS playlist to pump me up for my workout..."
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-purple-500 resize-none"
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGeneratePlaylist}
                disabled={loading || !prompt.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate & Export to Spotify</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleReset}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Prompt Suggestions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Need Inspiration?</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promptSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handlePromptSuggestion(suggestion)}
                className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 text-white/80 hover:text-white text-sm"
              >
                "{suggestion}"
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Generated Playlist */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Playlist Header */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{result.playlist.name}</h2>
                <p className="text-white/70">{result.playlist.description}</p>
              </div>
              <button
                onClick={handleOpenSpotify}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Spotify</span>
              </button>
            </div>
            
            {/* Playlist Stats */}
            <div className="flex items-center space-x-6 text-white/70 text-sm mb-4">
              <div className="flex items-center space-x-1">
                <Music className="w-4 h-4" />
                <span>{result.playlist.songs.length} songs</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>✅ Exported to Spotify</span>
              </div>
            </div>

            {/* AI Explanation */}
            {result.explanation && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">Why I chose these songs:</h3>
                <p className="text-white/80 text-sm italic">"{result.explanation}"</p>
              </div>
            )}
          </div>

          {/* Songs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.playlist.songs.map((song: any, index: number) => (
              <motion.div
                key={song._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <SongCard song={song} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <LoadingSpinner size="lg" text="AI is crafting your perfect playlist..." />
          <p className="text-white/60 mt-4">
            Analyzing your preferences and creating your Spotify playlist...
          </p>
        </motion.div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 space-y-4"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-white text-xl font-semibold">Ready to create magic?</h3>
          <p className="text-white/70 max-w-md mx-auto">
            Enter your prompt above and let AI create the perfect BTS playlist tailored to your mood and export it directly to your Spotify account.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AIPlaylist;