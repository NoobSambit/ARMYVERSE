# ARMYverse - BTS Music Analytics Platform (Spotify-Powered)

A comprehensive full-stack application for BTS fans to explore music analytics, create playlists, and discover new songs through AI recommendations - all powered by Spotify's official API.

## 🚀 Features

- **Real-time Spotify Analytics**: Track BTS music performance using live Spotify data
- **AI Playlist Generation**: Create personalized playlists using AI and export directly to Spotify
- **Manual Playlist Creation**: Curate your own BTS playlists and save them to Spotify
- **Interactive Charts**: Visualize streaming data with beautiful charts
- **Responsive Design**: Works perfectly on all devices
- **Modern UI**: Beautiful glassmorphism design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **Spotify Web API** for all music data
- **Helmet** for security
- **Rate Limiting** for API protection

### APIs
- **Spotify Web API** for music data and playlist management
- **Gemini AI** for playlist generation (optional)

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- Spotify API credentials
- Gemini API key (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/armyverse.git
cd armyverse
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
npm run install-server
```

### 3. Environment Setup

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (server/.env):**
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

### 4. Run the Application

**Development mode (both frontend and backend):**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

## 🔧 API Endpoints

### Stats
- `GET /api/stats/songs` - Get BTS songs from Spotify
- `GET /api/stats/albums` - Get BTS albums from Spotify
- `GET /api/stats/group` - Get BTS group overview
- `GET /api/stats/trending` - Get trending BTS songs

### Playlists
- `POST /api/playlist/create-spotify` - Create playlist and export to Spotify
- `GET /api/playlist/search-tracks` - Search BTS tracks on Spotify
- `GET /api/playlist/trending` - Get trending tracks

### AI Generation
- `POST /api/ai/generate` - Generate AI playlist and export to Spotify
- `GET /api/ai/suggestions` - Get AI suggestions

## 🎨 Design System

### Colors
- Primary: Purple (#8B5CF6)
- Secondary: Pink (#EC4899)
- Accent: Green (#10B981) for Spotify
- Background: Gradient from purple to indigo

### Typography
- Headings: Bold, gradient text
- Body: Clean, readable fonts
- Spacing: 8px system

### Components
- Glassmorphism cards
- Smooth animations
- Responsive grid layouts
- Loading states

## 🔐 Security Features

- Rate limiting on API endpoints
- Helmet.js for security headers
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 📱 Mobile Optimization

- Responsive design with mobile-first approach
- Touch-friendly interfaces
- Optimized images and loading
- Smooth mobile animations

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy dist folder
```

### Backend (Railway/Heroku)
```bash
cd server
npm start
```

## 🔮 Architecture

This application is fully powered by Spotify's API with no local database storage for songs or playlists. All data is fetched in real-time from Spotify, ensuring the most up-to-date information.

### Key Features:
- **Live Data**: All song and album data comes directly from Spotify
- **Playlist Export**: Playlists are created directly in users' Spotify accounts
- **Real-time Analytics**: Popularity scores and streaming estimates based on Spotify data
- **No Database Dependencies**: Simplified architecture with no MongoDB requirements

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

- Built with ❤️ for the ARMY community
- BTS for the amazing music
- Spotify for the comprehensive API
- Open source libraries and contributors

## 🔮 Future Features

- [ ] User authentication with Spotify OAuth
- [ ] Real playlist creation in user accounts
- [ ] Social features (follow users, share playlists)
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Concert and event tracking

## 📞 Support

For support, email support@armyverse.com or join our Discord community.

---

**Made with 💜 for ARMY by ARMY - Powered by Spotify**