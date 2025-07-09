import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables FIRST, before any other imports that might use them
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
  // Validate required environment variables
  const requiredEnvVars = ['MONGO_URI', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
  }

  console.log('Environment variables loaded successfully');
  console.log('MongoDB URI:', process.env.MONGO_URI ? 'Configured' : 'Missing');
  console.log('Spotify Client ID:', process.env.SPOTIFY_CLIENT_ID ? 'Configured' : 'Missing');
  console.log('YouTube API Key:', process.env.YOUTUBE_API_KEY ? 'Configured' : 'Missing');
  console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Configured' : 'Missing');

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Error:', err);
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
    log(`🗄️  MongoDB: ${process.env.MONGO_URI ? 'Connected' : 'Not configured'}`);
  });
})();