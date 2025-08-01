import React from 'react';
import { Heart, Music, Github, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Heart className="w-6 h-6 text-pink-400 mr-2" />
              <h3 className="text-2xl font-bold">ARMYVERSE</h3>
            </div>
            <p className="text-purple-200 mb-4 max-w-md">
              Your ultimate destination for BTS content discovery, playlist creation, and connecting with the global ARMY community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-purple-300 hover:text-white transition-colors duration-300">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-purple-300 hover:text-white transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#trending" className="text-purple-200 hover:text-white transition-colors duration-300">Trending</a></li>
              <li><a href="#ai-generator" className="text-purple-200 hover:text-white transition-colors duration-300">AI Generator</a></li>
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Playlists</a></li>
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Community</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Help Center</a></li>
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Terms of Service</a></li>
              <li><a href="#" className="text-purple-200 hover:text-white transition-colors duration-300">Contact Us</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-purple-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center text-purple-200 mb-4 md:mb-0">
            <Music className="w-4 h-4 mr-2" />
            <span>Made with 💜 for ARMY by ARMY</span>
          </div>
          <div className="text-purple-300 text-sm">
            © 2025 ArmyVerse. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;