import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Stats from './pages/Stats';
import AIPlaylist from './pages/AIPlaylist';
import CreatePlaylist from './pages/CreatePlaylist';
import PlaylistHub from './pages/PlaylistHub';
import BTSBlog from './pages/BTSBlog';
import TrendingSection from './components/Trending/TrendingSection';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/playlist-hub" element={<PlaylistHub />} />
          <Route path="/blog" element={<BTSBlog />} />
          <Route path="/ai-playlist" element={<AIPlaylist />} />
          <Route path="/create-playlist" element={<CreatePlaylist />} />
          <Route path="/trending" element={<TrendingSection />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;