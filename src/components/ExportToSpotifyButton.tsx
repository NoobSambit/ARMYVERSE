import React, { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
}

interface ExportToSpotifyButtonProps {
  tracks: Track[];
  isAuthenticated: boolean;
  onExportSuccess?: (playlistUrl: string) => void;
  onExportError?: (error: string) => void;
}

const ExportToSpotifyButton: React.FC<ExportToSpotifyButtonProps> = ({
  tracks,
  isAuthenticated,
  onExportSuccess,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!isAuthenticated) {
      onExportError?.('Please connect your Spotify account first');
      return;
    }

    setIsExporting(true);
    const token = localStorage.getItem('spotify_token');

    try {
      const response = await fetch('/api/export-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'AI Generated BTS Playlist',
          songs: tracks
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export playlist');
      }

      onExportSuccess?.(data.playlistUrl);
    } catch (error) {
      console.error('Error exporting playlist:', error);
      onExportError?.(error instanceof Error ? error.message : 'Failed to export playlist');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!isAuthenticated || isExporting}
      className={`flex items-center justify-center px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
        !isAuthenticated
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
          : isExporting
          ? 'bg-green-600 text-white cursor-wait'
          : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transform hover:scale-105'
      }`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <ExternalLink className="w-5 h-5 mr-2" />
          Export to Spotify
        </>
      )}
    </button>
  );
};

export default ExportToSpotifyButton; 