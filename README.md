# ARMYverse - BTS Music Analytics Platform

A comprehensive full-stack MERN application for BTS fans to explore music analytics, create playlists, and discover new songs through AI recommendations.

## 🚀 Features

- **Real-time Analytics**: Track BTS music performance across YouTube and Spotify
- **AI Playlist Generation**: Create personalized playlists using AI based on mood and preferences
- **Manual Playlist Creation**: Curate your own BTS playlists
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
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Helmet** for security
- **Rate Limiting** for API protection

### APIs
- **YouTube Data API v3** for video statistics
- **Spotify Web API** for music data
- **Gemini AI** for playlist generation

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- YouTube Data API key
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
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/armyverse
YOUTUBE_API_KEY=your_youtube_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=development
```

### 4. Seed Database
```bash
cd server
node data/seedData.js
```

### 5. Run the Application

**Development mode (both frontend and backend):**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

**Or use concurrently:**
```bash
npm run dev:full
```

## 🔧 API Endpoints

### Stats
- `GET /api/stats/songs` - Get all song statistics
- `GET /api/stats/albums` - Get album statistics
- `GET /api/stats/group` - Get BTS group overview
- `GET /api/stats/trending` - Get trending songs

### Playlists
- `GET /api/playlist` - Get all playlists
- `GET /api/playlist/:id` - Get specific playlist
- `POST /api/playlist/manual` - Create manual playlist
- `PUT /api/playlist/:id` - Update playlist
- `DELETE /api/playlist/:id` - Delete playlist

### AI Generation
- `POST /api/ai/generate` - Generate AI playlist
- `GET /api/ai/suggestions` - Get AI suggestions

### Sync
- `POST /api/sync` - Sync all platform stats
- `POST /api/sync/youtube` - Sync YouTube stats only
- `POST /api/sync/spotify` - Sync Spotify stats only

## 📊 Database Schema

### Song Model
```javascript
{
  title: String,
  artist: String,
  album: ObjectId,
  stats: {
    spotify: { totalStreams, popularity, ... },
    youtube: { views, likes, comments, ... }
  },
  mood: String,
  genres: [String],
  isTitle: Boolean,
  // ... more fields
}
```

### Playlist Model
```javascript
{
  name: String,
  description: String,
  type: 'manual' | 'ai',
  songs: [ObjectId],
  aiPrompt: String,
  aiExplanation: String,
  // ... more fields
}
```

## 🎨 Design System

### Colors
- Primary: Purple (#8B5CF6)
- Secondary: Pink (#EC4899)
- Accent: Blue (#06B6D4)
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

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd server
npm test
```

## 📈 Performance Optimization

- Lazy loading for components
- Image optimization
- API response caching
- Efficient database queries
- Code splitting

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
- Open source libraries and contributors

## 🔮 Future Features

- [ ] Social features (follow users, share playlists)
- [ ] Real-time chat for ARMY community
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Music streaming integration
- [ ] Concert and event tracking
- [ ] Merchandise recommendations

## 📞 Support

For support, email support@armyverse.com or join our Discord community.

---

**Made with 💜 for ARMY by ARMY**