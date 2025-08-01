import express from 'express';
import Track from '../models/Track.js';

const router = express.Router();

// GET /api/songs  – lightweight catalogue for dropdowns
router.get('/songs', async (_req, res) => {
  try {
    const songs = await Track.find({ isBTSFamily: true }, {
      spotifyId: 1,
      name: 1,
      artist: 1,
      album: 1,
      thumbnails: 1,
      releaseDate: 1,
      _id: 0
    }).sort({ popularity: -1 });
    res.json(songs);
  } catch (err) {
    console.error('❌ Error fetching songs:', err);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

/*
POST /api/playlist/streaming-focused
Auto gap example:
{
  mode: 'auto',
  primaryTrackId: 'xxx',
  totalLength: 20,
  auto: {
    minGap: 2,
    maxGap: 3,
    fillMode: 'random' | 'album' | 'era',
    albums?: [ 'Love Yourself 轉 "Tear"', ... ],
    era?: '2015-2016'
  }
}
Manual gap example:
{
  mode: 'manual',
  primaryTrackId: 'xxx',
  totalLength: 20,
  manual: {
    gapCount: 2,
    gapSongIds: [ 'aaa', 'bbb', 'ccc' ]
  }
}
*/
router.post('/playlist/streaming-focused', async (req, res) => {
  try {
    const { mode = 'auto', primaryTrackId, totalLength = 20, auto = {}, manual = {} } = req.body;
    if (!primaryTrackId) return res.status(400).json({ error: 'primaryTrackId required' });

    const primaryTrack = await Track.findOne({ spotifyId: primaryTrackId });
    if (!primaryTrack) return res.status(404).json({ error: 'Primary track not found' });

    const randomPick = arr => arr[Math.floor(Math.random() * arr.length)];

    let fillerPool = [];
    let minGap = 2, maxGap = 3;
    let manualPool = [];
    let gapCountManual = 1;

    if (mode === 'auto') {
      minGap = Math.max(1, Number(auto.minGap) || 2);
      maxGap = Math.max(minGap, Number(auto.maxGap) || 3);
      const fillMode = auto.fillMode || 'random';

      const query = { isBTSFamily: true, spotifyId: { $ne: primaryTrackId } };

      if (fillMode === 'album' && Array.isArray(auto.albums) && auto.albums.length) {
        query.album = { $in: auto.albums };
      }

      if (fillMode === 'era' && typeof auto.era === 'string') {
        const [start, end] = auto.era.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          query.releaseDate = { $gte: new Date(`${start}-01-01`), $lte: new Date(`${end}-12-31`) };
        }
      }

      fillerPool = await Track.find(query);
      if (!fillerPool.length) return res.status(400).json({ error: 'No candidate songs for gap found' });
    } else if (mode === 'manual') {
      gapCountManual = Math.max(1, Number(manual.gapCount) || 1);
      const ids = Array.isArray(manual.gapSongIds) ? manual.gapSongIds : [];
      if (!ids.length) return res.status(400).json({ error: 'gapSongIds required for manual mode' });
      manualPool = await Track.find({ spotifyId: { $in: ids } });
      if (!manualPool.length) return res.status(400).json({ error: 'gapSongIds not found' });
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const playlist = [];
    const usedIds = new Set();

    // Build playlist until desired length
    while (playlist.length < totalLength) {
      if (mode === 'auto' && !fillerPool.length) {
        // out of candidates, stop to avoid endless primary repeats
        break;
      }
      // add primary track
      playlist.push(primaryTrack);
      if (playlist.length >= totalLength) break;

      let gapSize = mode === 'auto'
        ? Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap
        : gapCountManual;

      for (let i = 0; i < gapSize && playlist.length < totalLength; i++) {
        let pick;
        if (mode === 'auto') {
          if (!fillerPool.length) break; // shouldn't happen
          pick = randomPick(fillerPool);
          if (fillerPool.length > 1) fillerPool = fillerPool.filter(s => s.spotifyId !== pick.spotifyId);
        } else {
          pick = randomPick(manualPool);
        }
        if (!pick) break;
        playlist.push(pick);
      }
    }

    // format
    const response = playlist.slice(0, totalLength).map(t => ({
      spotifyId: t.spotifyId,
      name: t.name,
      artist: t.artist,
      album: t.album,
      thumbnails: t.thumbnails
    }));

    res.json(response);
  } catch (err) {
    console.error('❌ Error building streaming playlist:', err);
    res.status(500).json({ error: 'Failed to build playlist' });
  }
});

export default router;
