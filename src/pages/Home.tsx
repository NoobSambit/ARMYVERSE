import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles } from 'lucide-react';
import TrendingSection from '../components/Trending/TrendingSection';

const Home = () => {
  const scrollToTrending = () => {
    document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                ARMYVERSE
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-3">
              Where Streaming Meets Passion
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Discover trending BTS content, create AI-powered playlists, and dive deep into analytics. 
              Your ultimate destination for all things Bangtan! 💜
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <button 
              onClick={scrollToTrending}
              className="group bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-pink-500/25 transform transition-all duration-300 hover:scale-105 hover:shadow-pink-500/40"
            >
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Explore Trending
              </span>
            </button>
            <Link 
              to="/playlist-hub"
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-full border border-purple-400/50 hover:border-purple-400 transform transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
                Create Playlists
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section id="trending-section" className="py-12 px-6">
        <TrendingSection />
      </section>
    </div>
  );
};

export default Home;