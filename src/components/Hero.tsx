import React from 'react';
import { Heart, Music, Sparkles, ArrowDown } from 'lucide-react';

const Hero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        {/* Logo/Title Section */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-purple-500 mr-3 animate-pulse" />
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
              ARMYVERSE
            </h1>
            <Heart className="w-8 h-8 text-purple-500 ml-3 animate-pulse" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <p className="text-xl md:text-2xl text-gray-600 font-medium">
              Where Streaming Meets Passion
            </p>
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed">
          Discover trending BTS content, create AI-powered playlists, and connect with the ARMY community. 
          Your ultimate destination for all things Bangtan! 💜
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <button 
            onClick={() => scrollToSection('trending')}
            className="group bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <span className="flex items-center">
              <Music className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Explore Stats
            </span>
          </button>
          <button 
            onClick={() => scrollToSection('ai-generator')}
            className="group bg-white hover:bg-gray-50 text-purple-600 font-semibold py-4 px-8 rounded-full shadow-lg border-2 border-purple-200 hover:border-purple-300 transform transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 group-hover:animate-spin" />
              Generate Playlists
            </span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="animate-bounce">
          <ArrowDown className="w-6 h-6 text-purple-400 mx-auto cursor-pointer" onClick={() => scrollToSection('trending')} />
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </section>
  );
};

export default Hero;