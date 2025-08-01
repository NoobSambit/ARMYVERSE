# ArmyVerse Backend API

Backend server for the ArmyVerse BTS Fan Dashboard application.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- YouTube Data API key
- Spotify Web API credentials

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### YouTube Routes
- `GET /youtube/trending` - Get trending BTS videos
- `GET /youtube/search` - Search for BTS videos
- `GET /youtube/video/:id` - Get video details

### Spotify Routes
- `GET /spotify/trending` - Get trending BTS tracks
- `GET /spotify/search` - Search for BTS tracks
- `POST /spotify/playlist/create` - Create Spotify playlist
- `GET /spotify/artist/:id` - Get artist details

### Playlist Routes
- `POST /playlist/generate` - Generate AI playlist
- `GET /playlist/:id` - Get playlist details
- `PUT /playlist/:id` - Update playlist
- `DELETE /playlist/:id` - Delete playlist

## 🛠️ Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── Playlist.js   # Playlist model
│   └── Track.js      # Track model
├── routes/           # API route handlers
│   ├── youtube.js    # YouTube API routes
│   ├── spotify.js    # Spotify API routes
│   └── playlist.js   # Playlist management routes
├── middleware/       # Custom middleware
├── server.js         # Main server file
├── package.json      # Dependencies and scripts
└── .env.example      # Environment variables template
```

## 🔑 Required API Keys

### YouTube Data API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API key)
5. Add the key to your `.env` file

### Spotify Web API
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Create a new app
3. Get Client ID and Client Secret
4. Set redirect URI to `http://localhost:3000/callback`
5. Add credentials to your `.env` file

## 💜 Features Coming Soon

- [x] Basic server setup with Express
- [x] Route structure for YouTube, Spotify, and Playlist APIs
- [x] MongoDB models for data storage
- [x] Security middleware (CORS, Helmet, Rate Limiting)
- [ ] YouTube API integration
- [ ] Spotify API integration
- [ ] AI playlist generation
- [ ] User authentication
- [ ] Real-time features with Socket.io
- [ ] Caching with Redis
- [ ] API documentation with Swagger

## 🧪 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Environment Variables
See `.env.example` for all required environment variables.

## 📝 License

This project is licensed under the MIT License.

## 💜 Made with Love for ARMY

Built by ARMY, for ARMY. This API serves the global BTS fan community with love and purple hearts! 💜