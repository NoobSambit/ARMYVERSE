import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from './config/database.js';

// Load environment variables FIRST
dotenv.config();

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check for optional API keys and warn if missing
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not found. AI playlist generation will be disabled.');
  }

  console.log('🔧 Environment variables loaded successfully');
  console.log('🗄️  MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');
  console.log('🎵 Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Configured' : 'Missing');
  console.log('🤖 Gemini API Key:', process.env.GEMINI_API_KEY ? 'Configured' : 'Missing');

  // Connect to MongoDB
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB, falling back to in-memory storage');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('❌ Error:', err);
    res.status(status).json({ message });
  });

  // Setup Vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 ARMYverse server running on port ${port}`);
    log(`🎵 Spotify integration: ${process.env.SPOTIFY_CLIENT_ID ? 'Ready' : 'Not configured'}`);
    log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
    log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Ready' : 'Not configured'}`);
  });
})();