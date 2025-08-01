import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Music, 
  Star, 
  Sparkles, 
  Users, 
  Calendar,
  BookOpen,
  PenTool,
  Camera,
  Mic,
  Video,
  Globe,
  ArrowRight,
  Clock
} from 'lucide-react';

const BTSBlog: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    }
  };

  const upcomingFeatures = [
    {
      icon: <PenTool className="w-6 h-6" />,
      title: "Member Spotlights",
      description: "Deep dives into each BTS member's journey, solo work, and contributions",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "Album Reviews",
      description: "Comprehensive analysis of BTS albums, from debut to latest releases",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Camera className="w-6 h-6" />,
      title: "MV Analysis",
      description: "Detailed breakdowns of music videos, symbolism, and storytelling",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Lyrics Deep Dives",
      description: "Exploring the meaning and poetry behind BTS lyrics and messages",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "Performance Reviews",
      description: "Analysis of live performances, choreography, and stage presence",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "ARMY Stories",
      description: "Sharing personal stories and experiences from the BTS community",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const btsMembers = [
    { name: "RM", color: "from-blue-500 to-cyan-500" },
    { name: "Jin", color: "from-pink-500 to-rose-500" },
    { name: "Suga", color: "from-purple-500 to-indigo-500" },
    { name: "J-Hope", color: "from-green-500 to-emerald-500" },
    { name: "Jimin", color: "from-yellow-500 to-orange-500" },
    { name: "V", color: "from-red-500 to-pink-500" },
    { name: "Jungkook", color: "from-indigo-500 to-purple-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Header */}
          <motion.div 
            className="text-center mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="mb-8"
              variants={itemVariants}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                BTS Universe Blog
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                Your Gateway to the Bangtan Universe
              </p>
            </motion.div>

            {/* Coming Soon Badge */}
            <motion.div
              className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full font-semibold mb-8"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Clock className="w-5 h-5 mr-2" />
              Coming Soon
            </motion.div>

            <motion.p 
              className="text-lg md:text-xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Get ready to dive deep into the world of BTS with our comprehensive blog featuring 
              member spotlights, album reviews, MV analysis, and exclusive ARMY content. 
              We're crafting something special for the global BTS community! 💜
            </motion.p>
          </motion.div>

          {/* BTS Members Section */}
          <motion.div 
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white text-center mb-8"
              variants={itemVariants}
            >
              Meet the Bangtan Boys
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {btsMembers.map((member, index) => (
                <motion.div
                  key={member.name}
                  className="text-center"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r ${member.color} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <p className="text-white font-medium text-sm md:text-base">{member.name}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Features */}
          <motion.div 
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
              variants={itemVariants}
            >
              What's Coming to BTS Universe Blog
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative group"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300`}></div>
                  <div className="relative bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter Signup */}
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-purple-500/30 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              <Heart className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Stay Updated with ARMY
              </h3>
              <p className="text-gray-400 mb-6">
                Be the first to know when our blog launches and get exclusive BTS content delivered to your inbox.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                />
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                  <Star className="w-4 h-4 mr-2" />
                  Subscribe
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* Footer Message */}
          <motion.div 
            className="text-center mt-16"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="inline-flex items-center text-gray-400">
              <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
              <span className="text-sm">
                Crafted with love for the global ARMY community
              </span>
              <Sparkles className="w-5 h-5 ml-2 text-purple-400" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BTSBlog; 