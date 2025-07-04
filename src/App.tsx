import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StatsDashboard from './pages/StatsDashboard';
import PlaylistCreator from './pages/PlaylistCreator';
import AIPlaylist from './pages/AIPlaylist';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative min-h-screen"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=1920&h=1080&fit=crop&crop=center&blend=multiply&blend-alpha=20')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50" />
          
          {/* Content */}
          <div className="relative z-10">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/stats" element={<StatsDashboard />} />
                <Route path="/playlist/create" element={<PlaylistCreator />} />
                <Route path="/ai-playlist" element={<AIPlaylist />} />
              </Routes>
            </main>
          </div>
        </motion.div>
      </div>
    </Router>
  );
}

export default App;