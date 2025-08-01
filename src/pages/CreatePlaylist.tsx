import React, { useState } from 'react';
import { Search, Plus, Trash2, Music, ExternalLink } from 'lucide-react';

import StreamingFocusForm from '../components/StreamingFocusForm';
import CompactPlaylistGrid from '../components/CompactPlaylistGrid';
import { SongDoc, useAllSongs } from '../hooks/useAllSongs';

const CreatePlaylist: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistName, setPlaylistName] = useState('My BTS Playlist');
  const [playlistTracks, setPlaylistTracks] = useState<SongDoc[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState<'normal' | 'focus'>('normal');
  const [focusResult, setFocusResult] = useState<SongDoc[] | null>(null);
  const { songs: allSongs, loading: songsLoading } = useAllSongs();

  const filteredTracks = allSongs.filter(track =>
    track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToPlaylist = (track: SongDoc) => {
    if (!playlistTracks.find(t => t.spotifyId === track.spotifyId)) {
      setPlaylistTracks([...playlistTracks, track]);
    }
  };

  const removeFromPlaylist = (spotifyId: string) => {
    setPlaylistTracks(playlistTracks.filter(t => t.spotifyId !== spotifyId));
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* header + tabs */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Create Playlist
          </h1>
          <div className="inline-flex bg-gray-800/60 rounded-xl overflow-hidden border border-purple-500/40">
            <button
              onClick={() => setMode('normal')}
              className={`px-5 py-2 font-medium ${mode === 'normal' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >Normal</button>
            <button
              onClick={() => setMode('focus')}
              className={`px-5 py-2 font-medium ${mode === 'focus' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >Streaming Focus</button>
          </div>
        </div>

        {/* STREAMING FOCUS WORKFLOW */}
        {mode === 'focus' && (
          <>
            <StreamingFocusForm onGenerated={(songs) => setFocusResult(songs)} />
            {focusResult && (
              <div className="mb-10">
                <h3 className="text-white text-2xl font-bold mb-4">Generated Playlist</h3>
                <CompactPlaylistGrid songs={focusResult} primaryId={focusResult[0]?.spotifyId} />
              </div>
            )}
          </>
        )}

        {/* connection banner visible in both modes */}
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white font-medium">
                Spotify Status: {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <button
              onClick={() => setIsConnected(!isConnected)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isConnected
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect to Spotify'}
            </button>
          </div>
        </div>

        {/* MANUAL CREATOR WORKFLOW */}
        {mode === 'normal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* search */}
            <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/20">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Search className="w-6 h-6 mr-3 text-purple-400" />
                Search BTS Songs
              </h2>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for BTS songs..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-purple-400 focus:outline-none text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {songsLoading && <p className="text-gray-400">Loading songs…</p>}
                {!songsLoading && filteredTracks.length===0 && <p className="text-gray-400">No matches</p>}
                {filteredTracks.map((track) => (
                  <div key={track.spotifyId} className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">
                        {track.name}
                      </h4>
                      <p className="text-sm text-gray-400">{track.artist} • {track.album}</p>
                    </div>
                    
                    <button title="Add to playlist" aria-label="Add to playlist"
                      onClick={() => addToPlaylist(track)}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-full transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* playlist builder */}
            <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-green-500/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Music className="w-6 h-6 mr-3 text-green-400" />
                  Your Playlist
                </h2>
                <div className="text-gray-400 text-sm">{playlistTracks.length} tracks</div>
              </div>

              <div className="mb-6">
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl focus:border-green-400 focus:outline-none text-white"
                  placeholder="Playlist name..."
                />
              </div>

              {playlistTracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tracks added yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                  {playlistTracks.map((track, idx) => (
                    <div key={track.spotifyId} className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mr-4 text-white text-sm font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white group-hover:text-green-400 transition-colors duration-300">{track.name}</h4>
                        <p className="text-sm text-gray-400">{track.artist} • {track.album}</p>
                      </div>
                      
                      <button title="Remove" aria-label="Remove" onClick={() => removeFromPlaylist(track.spotifyId)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-all duration-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {playlistTracks.length > 0 && (
                <div className="space-y-4">
                  <button
                    disabled={!isConnected}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
                      isConnected ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Create Playlist on Spotify
                  </button>
                  {!isConnected && <p className="text-gray-400 text-sm text-center">Connect your Spotify account to create playlists</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlaylist;
