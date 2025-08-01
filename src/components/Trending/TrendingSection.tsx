import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Star, Music, Eye } from 'lucide-react';
import { fetchYouTubeTrending, fetchSpotifyTrending, fetchAllMembersSpotlight, fetchMembersYouTubeData, formatViewCount, formatPopularity } from '../../utils/fetchTrending';

interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  videoUrl: string;
  badges: Array<{ type: string; text: string; color: string }>;
}

interface TrendingTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  popularity: number;
  duration: string;
  spotifyUrl: string;
  estimatedStreams: number;
  badges: Array<{ type: string; text: string; color: string }>;
}

interface MemberSpotlight {
  member: string;
  track: {
    id: string;
    name: string;
    artist: string;
    album: string;
    albumArt: string;
    popularity: number;
    spotifyUrl: string;
    estimatedStreams: number;
  };
}

const TrendingSection = () => {
  const [activeTab, setActiveTab] = useState<'spotify' | 'youtube'>('spotify');
  const [memberTab, setMemberTab] = useState<'spotify' | 'youtube'>('spotify');
  const [spotifyTracks, setSpotifyTracks] = useState<TrendingTrack[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<TrendingVideo[]>([]);
  const [spotifyMembers, setSpotifyMembers] = useState<MemberSpotlight[]>([]);
  const [youtubeMembers, setYoutubeMembers] = useState<MemberSpotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [spotifyData, youtubeData, spotifyMembersData, youtubeMembersData] = await Promise.all([
        fetchSpotifyTrending(),
        fetchYouTubeTrending(),
        fetchAllMembersSpotlight(),
        fetchMembersYouTubeData()
      ]);
      
      setSpotifyTracks(spotifyData);
      setYoutubeVideos(youtubeData);
      setSpotifyMembers(spotifyMembersData);
      setYoutubeMembers(youtubeMembersData);
    } catch (err) {
      setError('Failed to load trending data. Please try again later.');
      console.error('Error fetching trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🔥 Trending BTS</h1>
          <p className="text-gray-300">Loading the hottest BTS content...</p>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
              <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-700 h-3 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">🔥 Trending BTS</h1>
        <div className="bg-red-900/20 border border-red-500 rounded-xl p-6">
          <p className="text-red-300">{error}</p>
          <button 
            onClick={fetchTrendingData}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">🔥 Trending BTS</h1>
        <p className="text-gray-300">Discover the hottest BTS content across platforms</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setActiveTab('spotify')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'spotify'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Music className="inline mr-2" size={20} />
            Spotify
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'youtube'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Eye className="inline mr-2" size={20} />
            YouTube
          </button>
        </div>
      </div>

      {/* Top 5 Trending Songs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <TrendingUp className="mr-2" />
          Top 5 Trending {activeTab === 'spotify' ? 'Songs' : 'Videos'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {(activeTab === 'spotify' ? spotifyTracks : youtubeVideos).map((item, index) => (
            <div key={item.id} className="group relative">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300 border border-gray-700/50 hover:border-purple-500/50">
                {/* Badges */}
                {item.badges.length > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    {item.badges.map((badge, badgeIndex) => (
                      <span
                        key={badgeIndex}
                        className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${badge.color} text-white shadow-lg`}
                      >
                        {badge.text}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                    #{index + 1}
                  </div>
                </div>

                {/* Thumbnail - Square aspect ratio for consistent display */}
                <div className="relative mb-4">
                  <div className="aspect-square w-full rounded-lg overflow-hidden">
                  <img
                    src={activeTab === 'spotify' ? (item as TrendingTrack).albumArt : (item as TrendingVideo).thumbnail}
                    alt={activeTab === 'spotify' ? (item as TrendingTrack).name : (item as TrendingVideo).title}
                      className="w-full h-full object-cover"
                  />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm line-clamp-2">
                    {activeTab === 'spotify' ? (item as TrendingTrack).name : (item as TrendingVideo).title}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {activeTab === 'spotify' 
                      ? (item as TrendingTrack).artist 
                      : (item as TrendingVideo).channelTitle
                    }
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 text-xs">
                      {activeTab === 'spotify' 
                        ? formatPopularity((item as TrendingTrack).popularity)
                        : `${formatViewCount((item as TrendingVideo).viewCount)} views`
                      }
                    </span>
                    <button
                      onClick={() => handlePlayClick(
                        activeTab === 'spotify' 
                          ? (item as TrendingTrack).spotifyUrl 
                          : (item as TrendingVideo).videoUrl
                      )}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full transition-colors flex items-center"
                    >
                      <Play size={12} className="mr-1" />
                      Play
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Spotlight */}
      {(memberTab === 'spotify' ? spotifyMembers : youtubeMembers).length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="mr-2" />
            Member Spotlight
          </h2>
          
          {/* Member Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
              <button
                onClick={() => setMemberTab('spotify')}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${
                  memberTab === 'spotify'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Music className="inline mr-1" size={16} />
                Spotify
              </button>
              <button
                onClick={() => setMemberTab('youtube')}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${
                  memberTab === 'youtube'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Eye className="inline mr-1" size={16} />
                YouTube
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(memberTab === 'spotify' ? spotifyMembers : youtubeMembers).map((member) => (
              <div key={member.member} className="group relative">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-300 border border-gray-700/50 hover:border-purple-500/50">
                  {/* Member Name Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                      <span className="text-white text-xs font-bold">{member.member}</span>
                    </div>
                  </div>
                  
                  {/* Fire Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">🔥</span>
                    </div>
                  </div>

                  {/* Thumbnail - Square aspect ratio for consistent display */}
                  <div className="relative mb-4">
                    <div className="aspect-square w-full rounded-lg overflow-hidden">
                    <img
                      src={member.track.albumArt}
                      alt={member.track.name}
                        className="w-full h-full object-cover"
                    />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white text-sm line-clamp-2">{member.track.name}</h3>
                    <p className="text-gray-400 text-xs">{member.track.artist}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 text-xs">
                        {memberTab === 'spotify' 
                          ? formatPopularity(member.track.popularity)
                          : `${formatViewCount(member.track.estimatedStreams)} views`
                        }
                      </span>
                      <button
                        onClick={() => handlePlayClick(member.track.spotifyUrl)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full transition-colors flex items-center"
                      >
                        <Play size={12} className="mr-1" />
                        Play
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingSection;