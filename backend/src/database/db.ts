import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";

export const db = new Database(config.databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase(): void {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'issuer')),
      institution_name TEXT,
      wallet_address TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'rejected', 'revoked')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issuer_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution_name TEXT NOT NULL,
      accreditation_number TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'revoked')),
      rejection_reason TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificate_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_hash TEXT UNIQUE NOT NULL,
      certificate_ref TEXT NOT NULL,
      student_name TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      issuer_id INTEGER NOT NULL REFERENCES users(id),
      issuer_wallet TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      tx_hash TEXT,
      block_number INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'revoked')),
      registered_at TEXT NOT NULL,
      revoked_at TEXT,
      revocation_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS verification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_hash TEXT NOT NULL,
      outcome TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      client_ip TEXT,
      user_agent TEXT,
      details_json TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL,
      details_json TEXT
    );
  `);

  seedDefaultData();
}

function seedDefaultData(): void {
  const adminEmail = "admin@chainproof.local";
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);

  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const adminPassHash = bcrypt.hashSync("AdminPass123!", salt);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, role, institution_name, wallet_address, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin
    const adminRes = insertUser.run(
      adminEmail,
      adminPassHash,
      "admin",
      "ChainProof System Administration",
      config.adminWalletAddress,
      "active",
      now,
      now
    );

    // 2. Demo Authorized Issuer (Apex State University)
    const issuerPassHash = bcrypt.hashSync("IssuerPass123!", salt);
    const issuerRes = insertUser.run(
      "issuer@apex.edu",
      issuerPassHash,
      "issuer",
      "Apex State University",
      config.demoIssuerWalletAddress,
      "active",
      now,
      now
    );

    db.prepare(`
      INSERT INTO issuer_applications (user_id, institution_name, accreditation_number, contact_email, wallet_address, status, reviewed_by, reviewed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issuerRes.lastInsertRowid,
      "Apex State University",
      "ACCRED-APEX-2024-88",
      "issuer@apex.edu",
      config.demoIssuerWalletAddress,
      "approved",
      adminRes.lastInsertRowid,
      now,
      now
    );

    // 3. Demo Pending Issuer (Coastal Technical Institute) for immediate demo review
    const pendingPassHash = bcrypt.hashSync("PendingPass123!", salt);
    const pendingWallet = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const pendingRes = insertUser.run(
      "registrar@coastal.edu",
      pendingPassHash,
      "issuer",
      "Coastal Technical Institute",
      pendingWallet,
      "pending",
      now,
      now
    );

    db.prepare(`
      INSERT INTO issuer_applications (user_id, institution_name, accreditation_number, contact_email, wallet_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      pendingRes.lastInsertRowid,
      "Coastal Technical Institute",
      "EDU-ACCRED-CTI-9102",
      "registrar@coastal.edu",
      pendingWallet,
      "pending",
      now
    );

    // Initial audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, ip_address, timestamp, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminRes.lastInsertRowid,
      "SYSTEM_BOOTSTRAP",
      "system",
      "1",
      "127.0.0.1",
      now,
      JSON.stringify({ note: "Initial system bootstrap with default demo accounts" })
    );

    console.log("✓ Default demo accounts seeded successfully:");
    console.log("  - Admin: admin@chainproof.local (Pass: AdminPass123!)");
    console.log("  - Active Issuer: issuer@apex.edu (Pass: IssuerPass123!)");
    console.log("  - Pending Issuer: registrar@coastal.edu (Pass: PendingPass123!)");
  }
}

export function logAudit(
  userId: number | null,
  action: string,
  targetType: string,
  targetId: string,
  ipAddress: string = "127.0.0.1",
  details: Record<string, any> = {}
): void {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, ip_address, timestamp, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, action, targetType, targetId, ipAddress, new Date().toISOString(), JSON.stringify(details));
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
