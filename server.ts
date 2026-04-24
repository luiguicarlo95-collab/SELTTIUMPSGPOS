import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { initDB } from "./server/config/db";
import apiRoutes from "./server/routes";
import { errorHandler } from "./server/middleware/errorHandler";

async function startServer() {
  // Initialize Database
  initDB();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });
  
  const PORT = 3000;
  const HOST = "0.0.0.0";

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Debug Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Middleware to emit data_changed on successful mutations
  app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
      if (['POST', 'PUT', 'DELETE'].includes(req.method) && (res.statusCode >= 200 && res.statusCode < 300)) {
        io.emit('data_changed');
      }
      return originalJson.call(this, body);
    };
    next();
  });

  // API Routes
  app.use("/api", apiRoutes);

  // Fallback for non-existent API routes to prevent HTML response
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Global Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  const startListening = () => {
    const server = httpServer.listen(PORT, HOST, () => {
      console.log(`Server running on:`);
      console.log(`  - Local:   http://localhost:${PORT}`);
      if (process.env.APP_URL) {
        console.log(`  - App URL: ${process.env.APP_URL}`);
      }
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please restart the dev server.`);
      } else {
        console.error('Server error:', e);
      }
    });
  };

  startListening();
}

startServer();
