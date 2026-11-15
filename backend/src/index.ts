import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { initDatabase } from "./database/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import issuerRoutes from "./routes/issuer.js";
import verifyRoutes from "./routes/verify.js";
import healthRoutes from "./routes/health.js";

const app = express();

// Initialize SQLite database schema and demo seeds
initDatabase();

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // Allow localhost Vite dev servers
      if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing with safe size bounds
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Rate limiting map for brute-force protection
const requestCounts = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now > entry.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      res.status(429).json({
        success: false,
        error: "Too many requests. Please wait a moment before trying again.",
      });
      return;
    }

    entry.count++;
    next();
  };
}

// Mount Routes with appropriate rate limiting
app.use("/api/auth", rateLimiter(30, 60 * 1000), authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", issuerRoutes);
app.use("/api/issuer", issuerRoutes);
app.use("/api/verify", rateLimiter(60, 60 * 1000), verifyRoutes);
app.use("/api/health", healthRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    project: "ChainProof",
    description: "Blockchain-Based Certificate Verification API",
    status: "online",
    documentation: "/api/health",
  });
});

// Centralized 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "API endpoint not found." });
});

// Centralized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal server error occurred.";
  res.status(status).json({
    success: false,
    error: message,
  });
});

const server = app.listen(config.port, () => {
  console.log("==================================================");
  console.log(`   ChainProof Backend API Server`);
  console.log(`   Running at: http://localhost:${config.port}`);
  console.log(`   Blockchain RPC: ${config.rpcUrl}`);
  console.log(`   Smart Contract: ${config.contractAddress}`);
  console.log("==================================================");
});

export { app, server };
