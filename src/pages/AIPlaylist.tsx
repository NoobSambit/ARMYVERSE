import React, { useState } from 'react';
import { Sparkles, Music, RefreshCw, Play, AlertCircle, TestTube, Brain, Sliders, Calendar, Users, Heart, ExternalLink } from 'lucide-react';
import SpotifyAuth from '../components/SpotifyAuth';
import ExportToSpotifyButton from '../components/ExportToSpotifyButton';

interface GeneratedTrack {
  title: string;
  artist: string;
  spotifyId?: string;
  albumArt?: string;
  spotifyUrl?: string;
  duration?: number;
  popularity?: number;
}

interface PlaylistParams {
  prompt: string;
  mood: string;
  artistBias: string[];
  playlistLength: number;
  yearEra: string[];
  playlistType: 'feel-based' | 'genre-based' | 'album-based';
}

const AIPlaylist = () => {
  const [playlistParams, setPlaylistParams] = useState<PlaylistParams>({
    prompt: '',
    mood: '',
    artistBias: [],
    playlistLength: 10,
    yearEra: [],
    playlistType: 'feel-based'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<GeneratedTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUsedMode, setLastUsedMode] = useState<'test' | 'ai' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Predefined options
  const moodOptions = [
    'Happy & Energetic', 'Sad & Emotional', 'Chill & Relaxed', 'Intense & Powerful', 
    'Romantic & Sweet', 'Nostalgic & Dreamy', 'Confident & Bold', 'Peaceful & Calm'
  ];

  const btsMembersOptions = [
    'RM', 'Jin', 'Suga', 'J-Hope', 'Jimin', 'V', 'Jungkook'
  ];

  const yearEraOptions = [
    '2013-2014 (Debut Era)', '2015-2016 (HYYH Era)', '2017-2018 (Wings/LY Era)', 
    '2019-2020 (MOTS Era)', '2021-2022 (BE/Butter Era)', '2023-2024 (Solo Era)'
  ];

  const handleGenerate = async (mode: 'test' | 'ai') => {
    if (!playlistParams.prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedPlaylist([]);
    setLastUsedMode(mode);
    setExportSuccess(null);
    
    try {
      const endpoint = mode === 'test' ? '/api/test-playlist' : '/api/ai-playlist-db';
      console.log(`🎵 ${mode === 'test' ? 'Testing' : 'AI generating'} playlist...`);
      
      const requestBody = mode === 'test' 
        ? { prompt: playlistParams.prompt }
        : playlistParams;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const playlist = await response.json();
      console.log('✅ Received playlist:', playlist);
      setGeneratedPlaylist(playlist);
      
    } catch (error) {
      console.error('Error generating playlist:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate playlist');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setPlaylistParams({
      prompt: '',
      mood: '',
      artistBias: [],
      playlistLength: 10,
      yearEra: [],
      playlistType: 'feel-based'
    });
    setGeneratedPlaylist([]);
    setError(null);
    setLastUsedMode(null);
    setExportSuccess(null);
  };

  const handleExportSuccess = (playlistUrl: string) => {
    setExportSuccess(playlistUrl);
  };

  const handleExportError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const toggleArraySelection = (array: string[], item: string, setter: (newArray: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Spotify Auth */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full mr-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Playlist Generator
            </h1>
          </div>
          <SpotifyAuth onAuthSuccess={() => setIsAuthenticated(true)} />
        </div>

        <div className="text-center mb-8">
          <p className="text-xl text-gray-400">
            Create personalized BTS playlists with AI-powered customization and export to Spotify!
          </p>
        </div>

        {/* Enhanced Generator Interface */}
        <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
          
          {/* Main Prompt Input */}
          <div className="mb-8">
            <label htmlFor="prompt" className="block text-lg font-semibold text-white mb-3">
              <Sparkles className="inline w-5 h-5 mr-2" />
              Describe your playlist vibe...
            </label>
            <div className="relative">
              <textarea
                id="prompt"
                value={playlistParams.prompt}
                onChange={(e) => setPlaylistParams({...playlistParams, prompt: e.target.value})}
                placeholder="e.g., 'energetic workout songs to pump me up', 'emotional ballads for late night feels'..."
                className="w-full p-4 bg-gray-800/50 border-2 border-gray-600 rounded-2xl focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none h-32 text-white placeholder-gray-400 transition-all duration-300"
                maxLength={300}
              />
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                {playlistParams.prompt.length}/300
              </div>
            </div>
          </div>

          {/* Advanced Options Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Mood Selector */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Heart className="inline w-4 h-4 mr-2" />
                  Mood (Optional)
                </label>
                                 <select
                   value={playlistParams.mood}
                   onChange={(e) => setPlaylistParams({...playlistParams, mood: e.target.value})}
                   className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-purple-400 focus:outline-none text-white"
                   aria-label="Select mood"
                 >
                  <option value="">Any mood</option>
                  {moodOptions.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>

              {/* Playlist Length */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Music className="inline w-4 h-4 mr-2" />
                  Playlist Length: {playlistParams.playlistLength} songs
                </label>
                <div className="px-3">
                                     <input
                     type="range"
                     min="5"
                     max="20"
                     step="5"
                     value={playlistParams.playlistLength}
                     onChange={(e) => setPlaylistParams({...playlistParams, playlistLength: parseInt(e.target.value)})}
                     className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                     title="Playlist length slider"
                     aria-label="Select playlist length"
                   />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              {/* Playlist Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Sliders className="inline w-4 h-4 mr-2" />
                  Playlist Type
                </label>
                <div className="space-y-2">
                  {(['feel-based', 'genre-based', 'album-based'] as const).map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="playlistType"
                        value={type}
                        checked={playlistParams.playlistType === type}
                        onChange={(e) => setPlaylistParams({...playlistParams, playlistType: e.target.value as any})}
                        className="mr-3 text-purple-500"
                      />
                      <span className="text-gray-300 capitalize">
                        {type.replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Artist Bias */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Users className="inline w-4 h-4 mr-2" />
                  Artist Bias (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {btsMembersOptions.map(member => (
                    <button
                      key={member}
                      onClick={() => toggleArraySelection(
                        playlistParams.artistBias, 
                        member, 
                        (newArray) => setPlaylistParams({...playlistParams, artistBias: newArray})
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        playlistParams.artistBias.includes(member)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Select members to bias the playlist towards</p>
              </div>

              {/* Year/Era */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Era Preference (Optional)
                </label>
                <div className="space-y-2">
                  {yearEraOptions.map(era => (
                    <label key={era} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={playlistParams.yearEra.includes(era)}
                        onChange={() => toggleArraySelection(
                          playlistParams.yearEra, 
                          era, 
                          (newArray) => setPlaylistParams({...playlistParams, yearEra: newArray})
                        )}
                        className="mr-3 text-purple-500"
                      />
                      <span className="text-gray-300 text-sm">{era}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleGenerate('test')}
              disabled={!playlistParams.prompt.trim() || isGenerating}
              className={`flex items-center justify-center px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                !playlistParams.prompt.trim() || isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:scale-105'
              }`}
            >
              {isGenerating && lastUsedMode === 'test' ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5 mr-2" />
                  Test (Hardcoded)
                </>
              )}
            </button>

            <button
              onClick={() => handleGenerate('ai')}
              disabled={!playlistParams.prompt.trim() || isGenerating}
              className={`flex items-center justify-center px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                !playlistParams.prompt.trim() || isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105'
              }`}
            >
              {isGenerating && lastUsedMode === 'ai' ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  AI Generating...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  AI Generate
                </>
              )}
            </button>
            
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-full font-semibold text-purple-400 border-2 border-purple-400/50 hover:border-purple-400 hover:bg-purple-400/10 transition-all duration-300"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-red-500/20">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Export Success State */}
        {exportSuccess && (
          <div className="bg-green-500/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-500/20">
            <div className="flex items-center text-green-400">
              <Music className="w-5 h-5 mr-2" />
              <span className="font-medium">
                ✅ Playlist exported successfully!{' '}
                <a
                  href={exportSuccess}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-300"
                >
                  Open in Spotify
                </a>
              </span>
            </div>
          </div>
        )}

        {/* Generated Playlist */}
        {generatedPlaylist.length > 0 && (
          <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/20 shadow-2xl shadow-purple-500/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Music className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-2xl font-bold text-white">
                  {lastUsedMode === 'test' ? 'Test Playlist' : 'AI Generated Playlist'}
                </h3>
              </div>
              <div className="text-gray-400 text-sm">
                {generatedPlaylist.length} tracks
              </div>
            </div>
            
                        {/* Square Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {generatedPlaylist.map((track, index) => (
                <div 
                  key={`${track.title}-${index}`}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-purple-400/30 group aspect-square flex flex-col"
                >
                  {/* Square Thumbnail */}
                  <div className="relative flex-1 mb-3">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      {track.albumArt ? (
                        <img 
                          src={track.albumArt} 
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-400">
                          <Music className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Play Button Overlay - Always visible since all tracks have URLs now */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
                      <a
                        href={track.spotifyId ? `https://open.spotify.com/track/${track.spotifyId}` : track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                        title={`${track.spotifyId ? 'Play' : 'Search for'} ${track.title} on Spotify`}
                      >
                        <Play className="w-6 h-6 fill-white" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="text-center">
                    <h4 className="font-semibold text-white text-sm leading-tight mb-1 truncate" title={track.title}>
                      {track.title}
                    </h4>
                    <p className="text-gray-400 text-xs truncate" title={track.artist}>{track.artist}</p>
                  </div>
                  
                  {/* Bottom Status */}
                  <div className="mt-2 flex justify-center">
                    {track.spotifyId ? (
                      <div className="text-green-400 text-xs flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                        Play
                      </div>
                    ) : (
                      <div className="text-blue-400 text-xs flex items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                        Search
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Export to Spotify Button */}
            <div className="flex justify-center mb-6">
              <ExportToSpotifyButton
                tracks={generatedPlaylist}
                isAuthenticated={isAuthenticated}
                onExportSuccess={handleExportSuccess}
                onExportError={handleExportError}
              />
            </div>

            <div className="text-center">
              <div className={`p-4 rounded-xl border ${
                lastUsedMode === 'test' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : 'bg-green-500/10 border-green-500/20'
              }`}>
                <p className={`font-medium ${
                  lastUsedMode === 'test' ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {lastUsedMode === 'test' 
                    ? '🧪 TEST MODE: Basic playlist to verify connection works!'
                    : '🤖 AI MODE: Personalized playlist created with your preferences!'
                  }
                </p>
                <p className={`text-sm mt-2 ${
                  lastUsedMode === 'test' ? 'text-blue-300' : 'text-green-300'
                }`}>
                  {lastUsedMode === 'test'
                    ? 'Try the "AI Generate" button with custom settings for personalized results!'
                    : isAuthenticated 
                      ? 'Your custom playlist is ready - export it to save to your Spotify account!'
                      : 'Connect your Spotify account to export this personalized playlist!'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for slider */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(168, 85, 247);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(168, 85, 247);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AIPlaylist;