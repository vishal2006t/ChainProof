import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { db } from "../database/db.js";

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: "admin" | "issuer";
  institution_name: string | null;
  wallet_address: string | null;
  status: "active" | "pending" | "rejected" | "revoked";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Authentication token missing or invalid format." });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: number; email: string; role: string };
    const user = db.prepare("SELECT id, email, role, institution_name, wallet_address, status FROM users WHERE id = ?").get(decoded.id) as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: "User account no longer exists." });
      return;
    }

    if (user.status === "revoked") {
      res.status(403).json({ success: false, error: "Your account access has been revoked by an administrator." });
      return;
    }

    if (user.status === "rejected") {
      res.status(403).json({ success: false, error: "Your issuer application was rejected." });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Session expired or invalid token. Please log in again." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Access denied. Administrator privileges required." });
      return;
    }
    next();
  });
}

export function requireIssuer(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "issuer") {
      res.status(403).json({ success: false, error: "Access denied. Educational Issuer credentials required." });
      return;
    }
    if (req.user?.status !== "active") {
      res.status(403).json({ success: false, error: "Your institution account is pending administrator authorization." });
      return;
    }
    next();
  });
}
