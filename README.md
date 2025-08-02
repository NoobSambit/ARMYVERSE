# 🎵 ArmyVerse - BTS Fan Dashboard

A comprehensive web application built for BTS fans (ARMY) to discover trending content, create AI-powered playlists, and dive deep into analytics. ArmyVerse combines streaming data, AI integration, and social features to create the ultimate BTS fan experience.

![ArmyVerse](https://img.shields.io/badge/ArmyVerse-BTS%20Fan%20Dashboard-purple?style=for-the-badge&logo=spotify)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)

## ✨ Features

### 🎯 Core Features
- **Trending BTS Content**: Real-time trending tracks, albums, and artist analytics
- **AI-Powered Playlists**: Create personalized playlists using Google's Generative AI
- **Spotify Integration**: Seamless connection with Spotify API for music streaming
- **Analytics Dashboard**: Comprehensive statistics and insights about BTS music
- **Playlist Hub**: Create, manage, and share playlists with the community
- **BTS Blog**: Latest news and updates about BTS

### 🚀 Technical Features
- **Modern UI/UX**: Beautiful gradient design with smooth animations
- **Real-time Data**: Live streaming statistics and trending content
- **Responsive Design**: Optimized for desktop and mobile devices
- **Type Safety**: Full TypeScript implementation
- **Performance Optimized**: Fast loading times and smooth interactions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** components for accessible UI
- **React Router** for navigation
- **Framer Motion** for animations
- **React Query** for data fetching
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **Spotify Web API** integration
- **Google Generative AI** for playlist creation
- **CORS** enabled for cross-origin requests
- **Rate limiting** and security middleware

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Concurrently** for running multiple services
- **Nodemon** for backend development

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Spotify Developer Account
- Google AI API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/armyverse.git
cd armyverse
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/armyverse
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/armyverse

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Server
PORT=5000
NODE_ENV=development
```

Create a `.env` file in the backend directory:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/armyverse

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Server
PORT=5000
NODE_ENV=development
```

### 4. Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# Seed the database with BTS tracks
cd backend
npm run seed
```

### 5. Start Development Servers
```bash
# Start both frontend and backend concurrently
npm run dev:all

# Or start them separately:
# Frontend only
npm run dev

# Backend only
npm run backend
```

## 🚀 Available Scripts

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run check        # TypeScript type checking
```

### Backend Scripts
```bash
cd backend
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run seed         # Seed database with BTS tracks
```

### Combined Scripts
```bash
npm run dev:all      # Start both frontend and backend
npm run backend      # Start backend server
```

## 📁 Project Structure

```
armyverse/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Dashboard/           # Analytics dashboard components
│   │   ├── Trending/            # Trending content components
│   │   └── ...                  # Other UI components
│   ├── pages/                   # Page components
│   │   ├── Home.tsx            # Landing page
│   │   ├── Stats.tsx           # Analytics page
│   │   ├── AIPlaylist.tsx      # AI playlist creation
│   │   ├── CreatePlaylist.tsx  # Manual playlist creation
│   │   ├── PlaylistHub.tsx     # Playlist management
│   │   └── BTSBlog.tsx         # Blog page
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   └── App.tsx                 # Main app component
├── backend/                      # Backend source code
│   ├── models/                  # MongoDB models
│   │   ├── Playlist.js         # Playlist schema
│   │   └── Track.js            # Track schema
│   ├── routes/                  # API routes
│   │   ├── spotify.js          # Spotify API integration
│   │   ├── playlist.js         # Playlist management
│   │   ├── simple-playlist.js  # Basic playlist operations
│   │   ├── streamingPlaylist.js # Streaming playlist features
│   │   └── youtube.js          # YouTube integration
│   ├── seed-bts-tracks.js      # Database seeding script
│   └── server.js               # Express server
├── public/                      # Static assets
└── package.json                # Project dependencies
```

## 🎵 API Endpoints

### Spotify Integration
- `GET /api/spotify/auth` - Spotify authentication
- `GET /api/spotify/profile` - Get user profile
- `GET /api/spotify/playlists` - Get user playlists
- `POST /api/spotify/create-playlist` - Create new playlist

### Playlist Management
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist

### Analytics & Trending
- `GET /api/trending` - Get trending content
- `GET /api/stats` - Get analytics data
- `GET /api/tracks` - Get track information

## 🔧 Configuration

### Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add redirect URI: `http://localhost:3000/callback`
4. Copy Client ID and Client Secret to your `.env` file

### Google AI Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add the key to your `.env` file

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `armyverse`
3. Update the `MONGODB_URI` in your `.env` file

## 🎨 Customization

### Styling
The project uses Tailwind CSS with custom configurations. You can modify:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Global styles
- Component-specific styles in individual components

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Create corresponding API routes in `backend/routes/`
4. Update navigation in `src/App.tsx`

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm run start
# Deploy to your preferred hosting service (Heroku, Vercel, etc.)
```

### Environment Variables
Make sure to set all required environment variables in your production environment:
- `MONGODB_URI`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `GOOGLE_AI_API_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **BTS** for the incredible music that inspires this project
- **ARMY** community for the continuous support
- **Spotify** for their comprehensive API
- **Google AI** for the generative AI capabilities
- **React** and **Node.js** communities for the amazing tools

## 📞 Support

If you have any questions or need help with the project:

- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Join our community discussions

---

**Made with 💜 for ARMY by the ArmyVerse Team**

*"We are bulletproof"* - BTS 