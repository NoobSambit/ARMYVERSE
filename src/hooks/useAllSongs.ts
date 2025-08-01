import { useEffect, useState } from 'react';

export interface SongDoc {
  spotifyId: string;
  name: string;
  artist: string;
  album: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

let cachedSongs: SongDoc[] | null = null;
let cachedError: string | null = null;
let inflight: Promise<void> | null = null;

export const useAllSongs = () => {
  const [songs, setSongs] = useState<SongDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSongs = async () => {
      if (cachedSongs) {
        setSongs(cachedSongs);
        return;
      }
      if (!inflight) {
        inflight = (async () => {
          setLoading(true);
          try {
            const res = await fetch('/api/songs');
            if (!res.ok) throw new Error('Failed to fetch songs');
            const data = await res.json();
            cachedSongs = data;
          } catch (err: any) {
            cachedError = err.message || 'Unknown error';
          } finally {
            setLoading(false);
            inflight = null;
          }
        })();
      }
      await inflight;
      if (mounted) {
        if (cachedSongs) setSongs(cachedSongs);
        if (cachedError) setError(cachedError);
      }
    };

    fetchSongs();
    return () => { mounted = false; };
  }, []);

  return { songs, loading, error };
};