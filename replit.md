# ARMYverse - BTS Music Analytics & Playlist Platform

## Overview

ARMYverse is a full-stack web application designed for BTS fans to explore music analytics, create playlists, and generate AI-powered playlists. The platform combines a modern React frontend with an Express.js backend, utilizing PostgreSQL for data persistence and integrating with Spotify APIs for music data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router for client-side navigation
- **Animation**: Framer Motion for smooth UI transitions
- **UI Components**: Comprehensive set of Radix UI components via shadcn/ui

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Development Storage**: In-memory storage for development
- **API Design**: RESTful API with `/api` prefix
- **Session Management**: Built-in session handling with connect-pg-simple

### Development Environment
- **Hot Module Replacement**: Vite dev server integration
- **Code Quality**: TypeScript with strict configuration
- **Build Process**: Separate client and server builds
- **Environment**: Replit-optimized with development banners

## Key Components

### Client Components
- **SongCard**: Displays individual song information with Spotify integration
- **PlaylistCard**: Shows playlist summaries with metadata
- **StatChart**: Renders various chart types (bar, line, pie) using Recharts
- **LoadingSpinner**: Animated loading states
- **Navbar**: Navigation with active state management

### Server Components
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database storage
- **Route Registration**: Modular route handling system
- **Vite Integration**: Development server with HMR support
- **Error Handling**: Centralized error handling middleware

### Pages
- **Home**: Dashboard with trending music and statistics
- **StatsDashboard**: Comprehensive analytics with charts and filters
- **PlaylistCreator**: Manual playlist creation with search functionality
- **AIPlaylist**: AI-powered playlist generation
- **ViewPlaylist**: Individual playlist viewing

## Data Flow

### Frontend to Backend
1. React components make API calls via axios client
2. API client handles request/response interceptors
3. Error handling and loading states managed by React Query
4. Data flows through props to child components

### Backend Data Processing
1. Express middleware processes requests
2. Storage layer abstracts database operations
3. Routes handle business logic and API responses
4. Error middleware catches and formats errors

### Database Operations
1. Drizzle ORM manages database schema and migrations
2. PostgreSQL stores persistent data
3. In-memory storage used for development
4. Schema definitions shared between client and server

## External Dependencies

### Music Data Integration
- **Spotify API**: Primary source for music data and streaming
- **Neon Database**: Serverless PostgreSQL hosting
- **Database Provider**: @neondatabase/serverless for connection pooling

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation and transition library
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and developer experience
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing pipeline

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: ESBuild bundles Express server to `dist/index.js`
3. **Database Migration**: Drizzle handles schema migrations
4. **Static Assets**: Served from built client directory

### Production Configuration
- **Environment Variables**: DATABASE_URL required for PostgreSQL connection
- **Process Management**: Node.js process for server execution
- **Asset Serving**: Express serves static files in production
- **Error Handling**: Production-ready error responses

### Development Setup
- **Hot Reloading**: Vite dev server with HMR
- **Type Checking**: TypeScript compiler for development
- **Database**: Can use either PostgreSQL or in-memory storage
- **API Proxy**: Vite proxies API requests during development

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```