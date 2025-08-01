import React from 'react';
import { SongDoc } from '../hooks/useAllSongs';

interface Props {
  songs: SongDoc[];
  primaryId: string;
}

const CompactPlaylistGrid: React.FC<Props> = ({ songs, primaryId }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {songs.map((song, idx) => (
        <a
          key={song.spotifyId + idx}
          href={`https://open.spotify.com/track/${song.spotifyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center bg-black/40 border border-white/10 rounded-xl p-3 hover:bg-white/5 transition group"
        >
          <div className="relative w-20 h-20 mr-4">
            <img
              src={song.thumbnails?.large || song.thumbnails?.medium || song.thumbnails?.small}
              alt={song.name}
              className="w-full h-full object-cover rounded-lg group-hover:brightness-110"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 rounded-lg">
              <span className="text-white text-xl">▶️</span>
            </div>
            {song.spotifyId === primaryId && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-xs px-2 py-0.5 rounded-full">🔥 Focus</span>
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-white font-semibold truncate">{song.name}</h4>
            <p className="text-sm text-gray-400 truncate">{song.artist}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

export default CompactPlaylistGrid;