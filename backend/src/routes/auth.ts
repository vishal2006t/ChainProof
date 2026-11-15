import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ethers } from "ethers";
import { db, logAudit } from "../database/db.js";
import { config } from "../config/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerIssuerSchema = z.object({
  email: z.string().email("Invalid institutional email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  institutionName: z.string().min(2, "Institution name is required"),
  accreditationNumber: z.string().min(3, "Accreditation reference is required"),
  walletAddress: z.string().refine((val) => ethers.isAddress(val), {
    message: "Invalid Ethereum wallet address format (0x...)",
  }),
});

/**
 * POST /api/auth/login
 */
router.post("/login", (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation failed" });
    return;
  }

  const { email, password } = parseResult.data;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;

  if (!user) {
    res.status(401).json({ success: false, error: "Invalid email or password." });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ success: false, error: "Invalid email or password." });
    return;
  }

  if (user.status === "pending") {
    res.status(403).json({
      success: false,
      error: "Your institution registration is currently pending administrator verification.",
      status: "pending",
    });
    return;
  }

  if (user.status === "rejected") {
    res.status(403).json({
      success: false,
      error: "Your institution application was rejected by the platform administrator.",
      status: "rejected",
    });
    return;
  }

  if (user.status === "revoked") {
    res.status(403).json({
      success: false,
      error: "Your issuer access has been revoked by an administrator.",
      status: "revoked",
    });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

  logAudit(user.id, "USER_LOGIN", "users", String(user.id), req.ip || "127.0.0.1", {
    role: user.role,
    institution: user.institution_name,
  });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionName: user.institution_name,
      walletAddress: user.wallet_address,
      status: user.status,
    },
  });
});

/**
 * POST /api/auth/register-issuer
 * Educational institutions can apply for an issuer account (starts as PENDING).
 */
router.post("/register-issuer", (req: Request, res: Response) => {
  const parseResult = registerIssuerSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation failed" });
    return;
  }

  const { email, password, institutionName, accreditationNumber, walletAddress } = parseResult.data;

  // Check uniqueness of email
  const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existingEmail) {
    res.status(409).json({ success: false, error: "An account with this email address already exists." });
    return;
  }

  // Check uniqueness of wallet address
  const existingWallet = db.prepare("SELECT id FROM users WHERE LOWER(wallet_address) = LOWER(?)").get(walletAddress);
  if (existingWallet) {
    res.status(409).json({ success: false, error: "This wallet address is already linked to another institution account." });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, institution_name, wallet_address, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userRes = insertUser.run(
    email.toLowerCase(),
    passwordHash,
    "issuer",
    institutionName,
    walletAddress,
    "pending",
    now,
    now
  );

  const userId = userRes.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO issuer_applications (user_id, institution_name, accreditation_number, contact_email, wallet_address, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    institutionName,
    accreditationNumber,
    email.toLowerCase(),
    walletAddress,
    "pending",
    now
  );

  logAudit(userId, "ISSUER_APPLICATION_SUBMITTED", "issuer_applications", String(userId), req.ip || "127.0.0.1", {
    institutionName,
    walletAddress,
    accreditationNumber,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted successfully. An administrator will review your institutional credentials.",
    status: "pending",
  });
});

/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      institutionName: req.user!.institution_name,
      walletAddress: req.user!.wallet_address,
      status: req.user!.status,
    },
  });
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", requireAuth, (req: Request, res: Response) => {
  logAudit(req.user!.id, "USER_LOGOUT", "users", String(req.user!.id), req.ip || "127.0.0.1");
  res.json({ success: true, message: "Logged out successfully." });
});

export default router;
