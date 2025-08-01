// Trending API utilities for ArmyVerse BTS app
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyBmcNfXCNkMSF6gjNxglZ-DstlUCK8hGrU';
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'b41dc354c04b4e1dad741ae54a61ea9c';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || 'b8e4c73b374440dd8abadb4609ebd165';

// Helper function to add delays between API calls
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
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
  releaseDate: string;
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

// YouTube API v3 - Single request to get top 5 trending BTS videos
export const fetchYouTubeTrending = async (): Promise<TrendingVideo[]> => {
  try {
    console.log('🎬 Fetching YouTube trending data...');
    console.log('🔑 YouTube API Key:', YOUTUBE_API_KEY ? 'Present' : 'Missing');
    
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=BTS&maxResults=5&order=viewCount&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('❌ YouTube API error:', response.status, response.statusText);
      if (response.status === 403) {
        console.error('🚫 YouTube API 403: Check API key, quota, or restrictions');
        // Return fallback data for 403 errors
        return getFallbackYouTubeData();
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ YouTube search response received');
    
    if (!data.items || data.items.length === 0) {
      console.warn('⚠️ No YouTube items found, using fallback');
      return getFallbackYouTubeData();
    }
    
    // Get video statistics for each video
    const videoIds = data.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(',');
    
    // Add delay to prevent rate limiting
    await sleep(1000);
    
    const statsResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!statsResponse.ok) {
      console.error('❌ YouTube stats API error:', statsResponse.status);
      // Use search data without detailed stats
      return data.items.map((item: { id: { videoId: string }, snippet: any }, index: number) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: 1000000 * (5 - index), // Estimated based on order
        likeCount: 50000 * (5 - index),
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        badges: []
      }));
    }
    
    const statsData = await statsResponse.json();
    
    // Combine snippet and statistics data
    const trendingVideos: TrendingVideo[] = data.items.map((item: any, index: number) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: parseInt(statsData.items[index]?.statistics.viewCount || '0'),
      likeCount: parseInt(statsData.items[index]?.statistics.likeCount || '0'),
      videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      badges: getMilestoneBadges(parseInt(statsData.items[index]?.statistics.viewCount || '0'))
    }));
    
    console.log('✅ YouTube trending data processed successfully');
    return trendingVideos;
  } catch (error) {
    console.error('❌ Error fetching YouTube trending:', error);
    console.log('🔄 Using fallback YouTube data');
    return getFallbackYouTubeData();
  }
};

// Spotify API - Get trending BTS tracks
export const fetchSpotifyTrending = async (): Promise<TrendingTrack[]> => {
  try {
    // First get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get Spotify access token');
    }
    
    // Search for BTS tracks
    const searchResponse = await fetch(
      'https://api.spotify.com/v1/search?q=BTS&type=track&limit=20&market=US',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );
    
    const searchData = await searchResponse.json();
    
    // Filter and sort by popularity
    const trendingTracks: TrendingTrack[] = searchData.tracks.items
      .filter((track: any) => track.artists.some((artist: any) => artist.name === 'BTS'))
      .slice(0, 5)
      .map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url,
        popularity: track.popularity,
        duration: formatDuration(track.duration_ms),
        spotifyUrl: track.external_urls.spotify,
        releaseDate: track.album.release_date,
        // Use popularity percentage instead of estimated streams
        estimatedStreams: track.popularity,
        badges: getMilestoneBadges(track.popularity)
      }));
    
    return trendingTracks;
  } catch (error) {
    console.error('Error fetching Spotify trending:', error);
    throw error;
  }
};

// Get all solo members with their top tracks - Future-proof approach
export const fetchAllMembersSpotlight = async (): Promise<MemberSpotlight[]> => {
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: 'grant_type=client_credentials'
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get Spotify access token');
    }
    
    // BTS members with their Spotify artist IDs and alternative names
    const membersData = [
      { 
        name: 'Jimin', 
        spotifyArtistIds: ['1oSPZhvZMIrWW5I41kPkkY'], // Jimin's artist ID
        alternativeNames: ['박지민', 'Park Jimin'],
        keywords: ['jimin solo', 'jimin face', 'jimin like crazy']
      },
      { 
        name: 'Jungkook', 
        spotifyArtistIds: ['6HaGTQPmzraVmaVxvz6EUc'], // Jungkook's artist ID
        alternativeNames: ['전정국', 'Jeon Jungkook'],
        keywords: ['jungkook solo', 'jungkook seven', 'jungkook golden']
      },
      { 
        name: 'V', 
        spotifyArtistIds: ['3JsHnjpbhX4SnySpvpa9DK'], // V's artist ID
        alternativeNames: ['김태형', 'Kim Taehyung', 'Taehyung'],
        keywords: ['v layover', 'kim taehyung', 'v solo']
      },
      { 
        name: 'RM', 
        spotifyArtistIds: ['2auC28zjQyVTsiZKNgPRGs'], // RM's artist ID
        alternativeNames: ['김남준', 'Kim Namjoon', 'Namjoon'],
        keywords: ['rm indigo', 'namjoon solo', 'rm wildflower']
      },
      { 
        name: 'Suga', 
        spotifyArtistIds: ['5RmQ8k4l3HZ8JoPb4mNsML'], // Agust D's artist ID
        alternativeNames: ['민윤기', 'Min Yoongi', 'Agust D', 'SUGA'],
        keywords: ['agust d', 'suga d-day', 'min yoongi']
      },
      { 
        name: 'J-Hope', 
        spotifyArtistIds: ['0b1sIQumIAsNbqAoIClSpy'], // J-Hope's artist ID
        alternativeNames: ['정호석', 'Jung Hoseok', 'Hobi'],
        keywords: ['j-hope jack', 'hobi solo', 'jhope more']
      },
      { 
        name: 'Jin', 
        spotifyArtistIds: ['5vV3bFXnN6D6N3Nj4xRvaV'], // Jin's artist ID (if available)
        alternativeNames: ['김석진', 'Kim Seokjin', 'Seokjin'],
        keywords: ['jin astronaut', 'seokjin solo', 'jin epiphany']
      }
    ];
    
    const memberSpotlights: MemberSpotlight[] = [];
    
    for (const member of membersData) {
      try {
        let bestTrack = null;
        let highestPopularity = 0;
        
        // Method 1: Try artist ID search (most reliable)
        for (const artistId of member.spotifyArtistIds) {
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
              {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`
                }
              }
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.tracks && data.tracks.length > 0) {
                const topTrack = data.tracks[0];
                if (topTrack.popularity > highestPopularity) {
                  highestPopularity = topTrack.popularity;
                  bestTrack = topTrack;
                }
              }
            }
          } catch (error) {
            console.log(`Artist ID search failed for ${member.name}:`, error);
          }
        }
        
        // Method 2: Fallback to keyword search if artist ID fails
        if (!bestTrack) {
          for (const keyword of member.keywords) {
            try {
              const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(keyword)}&type=track&limit=10&market=US`,
                {
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                  }
                }
              );
              
              const data = await response.json();
              
              if (data.tracks && data.tracks.items) {
                // Look for tracks by the specific member (not BTS group)
                const memberTracks = data.tracks.items.filter((track: any) => {
                  const artistNames = track.artists.map((artist: any) => artist.name.toLowerCase());
                  const memberNameLower = member.name.toLowerCase();
                  
                  // Check if member name is in artist names and it's not a BTS group song
                  return artistNames.some((name: string) => 
                    name.includes(memberNameLower) || 
                    member.alternativeNames.some(altName => name.includes(altName.toLowerCase()))
                  ) && !artistNames.includes('bts') && !artistNames.includes('방탄소년단');
                });
                
                if (memberTracks.length > 0) {
                  const topTrack = memberTracks[0];
                  if (topTrack.popularity > highestPopularity) {
                    highestPopularity = topTrack.popularity;
                    bestTrack = topTrack;
                  }
                }
              }
            } catch (error) {
              console.log(`Keyword search failed for ${member.name} with ${keyword}:`, error);
            }
          }
        }
        
        // Add the best track found or create placeholder
        if (bestTrack) {
          memberSpotlights.push({
            member: member.name,
            track: {
              id: bestTrack.id,
              name: bestTrack.name,
              artist: bestTrack.artists.map((a: any) => a.name).join(', '),
              album: bestTrack.album.name,
              albumArt: bestTrack.album.images[0]?.url,
              popularity: bestTrack.popularity,
              spotifyUrl: bestTrack.external_urls.spotify,
              estimatedStreams: bestTrack.popularity
            }
          });
        } else {
          // Fallback: create a placeholder entry so all 7 members appear
          memberSpotlights.push({
            member: member.name,
            track: {
              id: `placeholder-${member.name}`,
              name: `${member.name} Solo Work`,
              artist: member.name,
              album: 'Solo',
              albumArt: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
              popularity: 50,
              spotifyUrl: 'https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX', // BTS artist page
              estimatedStreams: 50
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching data for ${member.name}:`, error);
      }
    }
    
    // Sort by popularity and ensure we have all 7 members
    return memberSpotlights.sort((a, b) => b.track.popularity - a.track.popularity);
  } catch (error) {
    console.error('Error fetching member spotlights:', error);
    return [];
  }
};

// Get YouTube data for BTS members - Future-proof approach
export const fetchMembersYouTubeData = async (): Promise<MemberSpotlight[]> => {
  try {
    console.log('🎬 Fetching YouTube member data...');
    
    const membersData = [
      { 
        name: 'Jimin', 
        channelKeywords: ['지민', 'Jimin BTS', 'Park Jimin'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'Jungkook', 
        channelKeywords: ['정국', 'Jungkook BTS', 'Jeon Jungkook'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'V', 
        channelKeywords: ['태형', 'V BTS', 'Kim Taehyung', 'Taehyung'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'RM', 
        channelKeywords: ['남준', 'RM BTS', 'Kim Namjoon', 'Namjoon'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'Suga', 
        channelKeywords: ['윤기', 'Suga BTS', 'Agust D', 'Min Yoongi'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'J-Hope', 
        channelKeywords: ['호석', 'J-Hope BTS', 'Jung Hoseok', 'Hobi'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      },
      { 
        name: 'Jin', 
        channelKeywords: ['석진', 'Jin BTS', 'Kim Seokjin', 'Seokjin'],
        excludeKeywords: ['wiz khalifa', 'billie eilish', 'charlie puth', 'bts ot7', '방탄소년단 전체']
      }
    ];
    
    const memberSpotlights: MemberSpotlight[] = [];
    
    for (const member of membersData) {
      try {
        let bestVideo = null;
        let highestViewCount = 0;
        
        // Search for member solo content with rate limiting
        for (const keyword of member.channelKeywords.slice(0, 1)) { // Reduced to 1 search per member to save quota
          try {
            // Add delay to prevent rate limiting
            await sleep(1000); // Wait 1 second between requests
            
            const response = await fetch(
              `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword + ' solo')}&maxResults=3&order=viewCount&type=video&key=${YOUTUBE_API_KEY}`
            );
            
            if (!response.ok) {
              console.error(`❌ YouTube API error for ${member.name}:`, response.status);
              if (response.status === 403) {
                console.error('🚫 YouTube API 403 for member search - Rate limit or quota exceeded');
                // Wait longer before continuing
                await sleep(5000);
                break; // Stop trying more searches if we hit quota
              }
              continue;
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
              for (const video of data.items) {
                const title = video.snippet.title.toLowerCase();
                const channelTitle = video.snippet.channelTitle.toLowerCase();
                
                // Check if this is likely a solo video and not excluded content
                const isExcluded = member.excludeKeywords.some(excludeWord => 
                  title.includes(excludeWord.toLowerCase()) || 
                  channelTitle.includes(excludeWord.toLowerCase())
                );
                
                const isSolo = !title.includes('bts (') && 
                              !title.includes('방탄소년단 (') && 
                              !title.includes('bangtan sonyeondan') &&
                              !isExcluded &&
                              (title.includes(member.name.toLowerCase()) || 
                               member.channelKeywords.some(kw => title.includes(kw.toLowerCase())));
                
                if (isSolo) {
                  // Try to get video statistics, but don't fail if it doesn't work
                  let viewCount = 1000000; // Default fallback
                  try {
                    // Add delay to prevent rate limiting
                    await sleep(500); // Wait 0.5 seconds before stats call
                    
                    const statsResponse = await fetch(
                      `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${video.id.videoId}&key=${YOUTUBE_API_KEY}`
                    );
                    
                    if (statsResponse.ok) {
                      const statsData = await statsResponse.json();
                      viewCount = parseInt(statsData.items[0]?.statistics.viewCount || '1000000');
                    }
                  } catch (error) {
                    console.warn(`⚠️ Could not get stats for ${video.snippet.title}:`, error);
                  }
                  
                  if (viewCount > highestViewCount) {
                    highestViewCount = viewCount;
                    bestVideo = {
                      ...video,
                      viewCount: viewCount
                    };
                  }
                }
              }
            }
          } catch (error) {
            console.log(`⚠️ YouTube search failed for ${member.name} with ${keyword}:`, error);
          }
        }
        
        if (bestVideo) {
          memberSpotlights.push({
            member: member.name,
            track: {
              id: bestVideo.id.videoId,
              name: bestVideo.snippet.title,
              artist: member.name,
              album: 'YouTube',
              albumArt: bestVideo.snippet.thumbnails.high?.url || bestVideo.snippet.thumbnails.medium?.url,
              popularity: Math.min(Math.floor(bestVideo.viewCount / 1000000), 100),
              spotifyUrl: `https://www.youtube.com/watch?v=${bestVideo.id.videoId}`,
              estimatedStreams: bestVideo.viewCount
            }
          });
        } else {
          // Fallback: create a placeholder so all members appear
          memberSpotlights.push({
            member: member.name,
            track: {
              id: `yt-placeholder-${member.name}`,
              name: `${member.name} Solo Content`,
              artist: member.name,
              album: 'YouTube',
              albumArt: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
              popularity: 50,
              spotifyUrl: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${member.name} BTS solo`),
              estimatedStreams: 1000000
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error fetching YouTube data for ${member.name}:`, error);
      }
    }
    
    // Sort by popularity (view count) and ensure we have all 7 members
    return memberSpotlights.sort((a, b) => b.track.estimatedStreams - a.track.estimatedStreams);
  } catch (error) {
    console.error('❌ Error fetching members YouTube data:', error);
    return getFallbackMemberYouTubeData();
  }
};

// Fallback data when YouTube API fails
const getFallbackYouTubeData = (): TrendingVideo[] => {
  return [
    {
      id: 'fallback-1',
      title: 'BTS (방탄소년단) \'Dynamite\' Official MV',
      thumbnail: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=480&h=270',
      channelTitle: 'HYBE LABELS',
      publishedAt: '2020-08-21T00:00:00Z',
      viewCount: 1400000000,
      likeCount: 24000000,
      videoUrl: 'https://www.youtube.com/results?search_query=BTS+Dynamite',
      badges: [{ type: 'views', text: '💎 1B+ Views', color: 'bg-yellow-500' }]
    },
    {
      id: 'fallback-2',
      title: 'BTS (방탄소년단) \'Butter\' Official MV',
      thumbnail: 'https://images.pexels.com/photos/6975421/pexels-photo-6975421.jpeg?auto=compress&cs=tinysrgb&w=480&h=270',
      channelTitle: 'HYBE LABELS',
      publishedAt: '2021-05-21T00:00:00Z',
      viewCount: 900000000,
      likeCount: 18000000,
      videoUrl: 'https://www.youtube.com/results?search_query=BTS+Butter',
      badges: [{ type: 'views', text: '💎 100M+ Views', color: 'bg-blue-500' }]
    },
    {
      id: 'fallback-3',
      title: 'BTS (방탄소년단) \'Permission to Dance\' Official MV',
      thumbnail: 'https://images.pexels.com/photos/6975456/pexels-photo-6975456.jpeg?auto=compress&cs=tinysrgb&w=480&h=270',
      channelTitle: 'HYBE LABELS',
      publishedAt: '2021-07-09T00:00:00Z',
      viewCount: 650000000,
      likeCount: 15000000,
      videoUrl: 'https://www.youtube.com/results?search_query=BTS+Permission+to+Dance',
      badges: [{ type: 'views', text: '💎 100M+ Views', color: 'bg-blue-500' }]
    },
    {
      id: 'fallback-4',
      title: 'BTS (방탄소년단) \'Life Goes On\' Official MV',
      thumbnail: 'https://images.pexels.com/photos/6975387/pexels-photo-6975387.jpeg?auto=compress&cs=tinysrgb&w=480&h=270',
      channelTitle: 'HYBE LABELS',
      publishedAt: '2020-11-20T00:00:00Z',
      viewCount: 400000000,
      likeCount: 12000000,
      videoUrl: 'https://www.youtube.com/results?search_query=BTS+Life+Goes+On',
      badges: [{ type: 'views', text: '💎 100M+ Views', color: 'bg-blue-500' }]
    },
    {
      id: 'fallback-5',
      title: 'BTS (방탄소년단) \'Spring Day\' Official MV',
      thumbnail: 'https://images.pexels.com/photos/6975434/pexels-photo-6975434.jpeg?auto=compress&cs=tinysrgb&w=480&h=270',
      channelTitle: 'HYBE LABELS',
      publishedAt: '2017-02-13T00:00:00Z',
      viewCount: 380000000,
      likeCount: 11000000,
      videoUrl: 'https://www.youtube.com/results?search_query=BTS+Spring+Day',
      badges: [{ type: 'views', text: '💎 100M+ Views', color: 'bg-blue-500' }]
    }
  ];
};

// Fallback member data when YouTube API fails
const getFallbackMemberYouTubeData = (): MemberSpotlight[] => {
  return [
    {
      member: 'Jimin',
      track: {
        id: 'fallback-jimin',
        name: 'Jimin Solo Content',
        artist: 'Jimin',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 95,
        spotifyUrl: 'https://www.youtube.com/results?search_query=Jimin+BTS+solo',
        estimatedStreams: 50000000
      }
    },
    {
      member: 'Jungkook',
      track: {
        id: 'fallback-jungkook',
        name: 'Jungkook Solo Content',
        artist: 'Jungkook',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975421/pexels-photo-6975421.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 94,
        spotifyUrl: 'https://www.youtube.com/results?search_query=Jungkook+BTS+solo',
        estimatedStreams: 45000000
      }
    },
    {
      member: 'V',
      track: {
        id: 'fallback-v',
        name: 'V Solo Content',
        artist: 'V',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975456/pexels-photo-6975456.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 93,
        spotifyUrl: 'https://www.youtube.com/results?search_query=V+BTS+solo',
        estimatedStreams: 40000000
      }
    },
    {
      member: 'RM',
      track: {
        id: 'fallback-rm',
        name: 'RM Solo Content',
        artist: 'RM',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975387/pexels-photo-6975387.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 92,
        spotifyUrl: 'https://www.youtube.com/results?search_query=RM+BTS+solo',
        estimatedStreams: 35000000
      }
    },
    {
      member: 'Suga',
      track: {
        id: 'fallback-suga',
        name: 'Suga Solo Content',
        artist: 'Suga',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975434/pexels-photo-6975434.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 91,
        spotifyUrl: 'https://www.youtube.com/results?search_query=Suga+BTS+solo',
        estimatedStreams: 30000000
      }
    },
    {
      member: 'J-Hope',
      track: {
        id: 'fallback-jhope',
        name: 'J-Hope Solo Content',
        artist: 'J-Hope',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975398/pexels-photo-6975398.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 90,
        spotifyUrl: 'https://www.youtube.com/results?search_query=J-Hope+BTS+solo',
        estimatedStreams: 25000000
      }
    },
    {
      member: 'Jin',
      track: {
        id: 'fallback-jin',
        name: 'Jin Solo Content',
        artist: 'Jin',
        album: 'YouTube',
        albumArt: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=300&h=300',
        popularity: 89,
        spotifyUrl: 'https://www.youtube.com/results?search_query=Jin+BTS+solo',
        estimatedStreams: 20000000
      }
    }
  ];
};

// Helper functions
const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getMilestoneBadges = (count: number): Array<{ type: string; text: string; color: string }> => {
  const badges: Array<{ type: string; text: string; color: string }> = [];
  if (count >= 1000000000) badges.push({ type: 'views', text: '💎 1B+ Views', color: 'bg-yellow-500' });
  else if (count >= 100000000) badges.push({ type: 'views', text: '💎 100M+ Views', color: 'bg-blue-500' });
  else if (count >= 10000000) badges.push({ type: 'views', text: '💎 10M+ Views', color: 'bg-red-500' });
  
  return badges;
};

// Format view count for display
export const formatViewCount = (count: number): string => {
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`;
  } else if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

// Format popularity for Spotify
export const formatPopularity = (popularity: number): string => {
  return `${popularity}% popularity`;
}; 