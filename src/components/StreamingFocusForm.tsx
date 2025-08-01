import React, { useState, useMemo } from 'react';
import { useAllSongs, SongDoc } from '../hooks/useAllSongs';
import { Loader2 } from 'lucide-react';

interface Props {
  onGenerated: (songs: SongDoc[]) => void;
}

type GapMode = 'auto' | 'manual';

type FillMode = 'random' | 'album' | 'era';

const ERAS = [
  { label: '2013-2014 (School/Skool Luv)', value: '2013-2014' },
  { label: '2015-2016 (HYYH)', value: '2015-2016' },
  { label: '2017-2018 (Love Yourself)', value: '2017-2018' },
  { label: '2019-2020 (Map Of The Soul / BE)', value: '2019-2020' },
  { label: '2021-Present (Solo Era)', value: '2021-2025' }
];

const StreamingFocusForm: React.FC<Props> = ({ onGenerated }) => {
  const { songs, loading, error } = useAllSongs();

  /* shared */
  const [primaryId, setPrimaryId] = useState('');
  const [search, setSearch] = useState('');
  const [totalLength, setTotalLength] = useState(20);
  const [generating, setGenerating] = useState(false);

  /* gap strategy */
  const [gapMode, setGapMode] = useState<GapMode>('auto');

  /* auto */
  const [minGap, setMinGap] = useState(2);
  const [maxGap, setMaxGap] = useState(3);
  const [fillMode, setFillMode] = useState<FillMode>('random');
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [selectedEra, setSelectedEra] = useState<string>('2013-2014');
  const [albumSearch, setAlbumSearch] = useState('');

  /* manual */
  const [gapCount, setGapCount] = useState(6);
  const [manualSearch, setManualSearch] = useState('');
  const [manualPool, setManualPool] = useState<SongDoc[]>([]);

  /* derived lists */
  const shuffled = useMemo(() => {
    const arr = [...songs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [songs]);

  const primaryOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return songs.filter(s => s.name.toLowerCase().includes(q) || s.album.toLowerCase().includes(q));
  }, [search, songs]);

  const albumList = useMemo(() => {
    const map = new Map<string, { name: string; thumb: string }>();
    songs.forEach(s => {
      if (!map.has(s.album)) map.set(s.album, { name: s.album, thumb: s.thumbnails?.small || s.thumbnails?.medium || s.thumbnails?.large || '' });
    });
    return Array.from(map.values());
  }, [songs]);

  const manualFiltered = useMemo(() => {
    const q = manualSearch.toLowerCase();
    return songs.filter(s => (s.name + s.album + s.artist).toLowerCase().includes(q));
  }, [manualSearch, songs]);

  const toggleAlbum = (albumName: string) => {
    setSelectedAlbums(prev => prev.includes(albumName) ? prev.filter(a => a !== albumName) : [...prev, albumName]);
  };

  const toggleManualSong = (song: SongDoc) => {
    setManualPool(prev => prev.some(s => s.spotifyId === song.spotifyId) ? prev.filter(s => s.spotifyId !== song.spotifyId) : [...prev, song]);
  };

  /* submission */
  const handleGenerate = async () => {
    if (!primaryId) return;
    setGenerating(true);

    const payload: any = {
      mode: gapMode,
      primaryTrackId: primaryId,
      totalLength,
    };
    if (gapMode === 'auto') {
      payload.auto = {
        minGap,
        maxGap,
        fillMode,
        albums: fillMode === 'album' ? selectedAlbums : undefined,
        era: fillMode === 'era' ? selectedEra : undefined
      };
    } else {
      payload.manual = {
        gapCount,
        gapSongIds: manualPool.map(s => s.spotifyId)
      };
    }

    try {
      const res = await fetch('/api/playlist/streaming-focused', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) onGenerated(data);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30 mb-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Streaming-Focused Playlist</h2>

      {/* primary track */}
      <div className="mb-8">
        <label className="block text-sm mb-1 text-gray-300">Primary Track</label>
        <input aria-label="Primary search" title="Primary search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search BTS songs…" className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl mb-2" />
        <div className="max-h-48 overflow-y-auto space-y-1">
          {loading && <p className="text-gray-400">Loading…</p>}
          {error && <p className="text-red-400">{error}</p>}
          {primaryOptions.slice(0, 20).map(t => (
            <button key={t.spotifyId} onClick={() => { setPrimaryId(t.spotifyId); setSearch(''); }} className={`flex items-center w-full p-2 rounded hover:bg-white/10 ${primaryId === t.spotifyId ? 'bg-purple-600/30' : ''}`}> <img src={t.thumbnails?.small || t.thumbnails?.medium || t.thumbnails?.large} alt={t.name} className="w-8 h-8 mr-3 rounded" /> {t.name} – {t.artist}</button>
          ))}
        </div>
        {primaryId && <p className="text-green-400 text-sm mt-2">Primary track selected!</p>}
      </div>

      {/* gap mode toggle */}
      <div className="mb-6 flex space-x-4 items-center">
        <span className="text-sm text-gray-300">Gap mode:</span>
        <button onClick={() => setGapMode('auto')} className={`px-4 py-2 rounded-xl text-sm ${gapMode === 'auto' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Auto</button>
        <button onClick={() => setGapMode('manual')} className={`px-4 py-2 rounded-xl text-sm ${gapMode === 'manual' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Manual</button>
      </div>

      {gapMode === 'auto' ? (
        <>
          {/* gap range & total length */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-1 text-gray-300">Min gap</label>
              <input aria-label="Min gap" title="Min gap" type="number" min={1} value={minGap} onChange={e => setMinGap(Number(e.target.value))} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-300">Max gap</label>
              <input aria-label="Max gap" title="Max gap" type="number" min={minGap} value={maxGap} onChange={e => setMaxGap(Number(e.target.value))} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl" />
            </div>
          </div>

          {/* fill mode */}
          <div className="mb-6">
            <label className="block text-sm mb-1 text-gray-300">Fill Mode</label>
            <select aria-label="Fill mode" title="Fill mode" value={fillMode} onChange={e => setFillMode(e.target.value as FillMode)} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl">
              <option value="random">Random BTS songs</option>
              <option value="album">By album</option>
              <option value="era">By era</option>
            </select>
          </div>

          {fillMode === 'album' && (
            <div className="mb-6">
              <label className="block text-sm mb-2 text-gray-300">Choose Albums</label>
              <input value={albumSearch} onChange={e=>setAlbumSearch(e.target.value)} placeholder="Search albums…" className="w-full p-2 mb-2 bg-gray-800/50 border border-gray-600 rounded" />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {albumList.filter(alb => alb.name.toLowerCase().includes(albumSearch.trim().toLowerCase())).map(alb => (
                  <label key={alb.name} className="flex items-center space-x-3 px-2 py-1 hover:bg-white/5 rounded cursor-pointer">
                    <input type="checkbox" checked={selectedAlbums.includes(alb.name)} onChange={() => toggleAlbum(alb.name)} />
                    <img src={alb.thumb} alt={alb.name} className="w-6 h-6 rounded" />
                    <span className="text-sm">{alb.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {fillMode === 'era' && (
            <div className="mb-6">
              <label className="block text-sm mb-1 text-gray-300">Select Era</label>
              <select aria-label="Era" title="Era" value={selectedEra} onChange={e => setSelectedEra(e.target.value)} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl">
                {ERAS.map(er => <option key={er.value} value={er.value}>{er.label}</option>)}
              </select>
            </div>
          )}
        </>
      ) : (
        <>
          {/* manual gap count */}
          <div className="mb-6">
            <label className="block text-sm mb-1 text-gray-300">Number of gap songs</label>
            <input aria-label="Gap songs count" title="Gap songs count" type="number" min={1} value={gapCount} onChange={e => setGapCount(Number(e.target.value))} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl" />
          </div>
          <div className="mb-6">
            <label className="block text-sm mb-1 text-gray-300">Search & select gap songs</label>
            <input aria-label="Manual search" title="Manual search" value={manualSearch} onChange={e => setManualSearch(e.target.value)} placeholder="Search…" className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl mb-2" />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {manualFiltered.slice(0, 30).map(t => (
                <label key={t.spotifyId} className="flex items-center w-full p-2 rounded hover:bg-white/10 cursor-pointer">
                  <input type="checkbox" className="mr-2" checked={manualPool.some(s => s.spotifyId === t.spotifyId)} onChange={() => toggleManualSong(t)} />
                  <img src={t.thumbnails?.small || t.thumbnails?.medium || t.thumbnails?.large} alt={t.name} className="w-6 h-6 mr-3 rounded" />
                  <span className="text-sm flex-1">{t.name} – {t.artist}</span>
                </label>
              ))}
            </div>
            {manualPool.length > 0 && <p className="text-green-400 text-sm mt-2">{manualPool.length} songs selected</p>}
          </div>
        </>
      )}

      {/* total length */}
      <div className="mb-6">
        <label className="block text-sm mb-1 text-gray-300">Playlist length</label>
        <input aria-label="Playlist length" title="Playlist length" type="number" min={5} value={totalLength} onChange={e => setTotalLength(Number(e.target.value))} className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-xl" />
      </div>

      <button disabled={!primaryId || generating} onClick={handleGenerate} className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 ${primaryId ? 'bg-purple-600/80 hover:bg-purple-600' : 'bg-gray-600'} text-white`}>
        {generating ? <Loader2 className="animate-spin w-5 h-5" /> : 'Generate Streaming Playlist'}
      </button>
    </div>
  );
};

export default StreamingFocusForm;
