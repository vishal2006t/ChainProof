import { Router, Request, Response } from "express";
import { z } from "zod";
import { db, logAudit } from "../database/db.js";
import { requireIssuer } from "../middleware/auth.js";
import { uploadCertificate } from "../middleware/upload.js";
import { hashFileBuffer } from "../utils/fileHash.js";
import { blockchainService } from "../blockchain/blockchainService.js";
import { config } from "../config/index.js";

const router = Router();
router.use(requireIssuer);

const registerMetadataSchema = z.object({
  studentName: z.string().min(2, "Student name is required"),
  certificateType: z.string().min(2, "Certificate type / degree name is required"),
  certificateRef: z.string().min(2, "Certificate reference is required"),
});

/**
 * GET /api/issuer/status
 * Returns issuer status from DB and live on-chain check
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let onChainStatus: any = null;

    if (user.wallet_address) {
      try {
        onChainStatus = await blockchainService.getIssuerInfo(user.wallet_address);
      } catch (err: any) {
        console.warn("Could not query issuer on-chain status:", err.message);
      }
    }

    const regCount = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked
      FROM certificate_registrations
      WHERE issuer_id = ?
    `).get(user.id) as any;

    res.json({
      success: true,
      issuer: {
        id: user.id,
        email: user.email,
        institutionName: user.institution_name,
        walletAddress: user.wallet_address,
        status: user.status,
      },
      onChain: onChainStatus,
      statistics: {
        totalRegistered: regCount?.total || 0,
        activeCertificates: regCount?.active || 0,
        revokedCertificates: regCount?.revoked || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch issuer status." });
  }
});

/**
 * POST /api/certificates/preview-hash
 * Calculates cryptographic SHA-256 hash without registering, allowing review before submitting
 */
router.post("/preview-hash", uploadCertificate.single("certificateFile"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No certificate file provided." });
    return;
  }

  try {
    const hashRes = hashFileBuffer(req.file.buffer);

    if (!hashRes.isValidPdf) {
      res.status(400).json({
        success: false,
        error: "File failed PDF signature verification. The file does not start with standard %PDF magic bytes.",
      });
      return;
    }

    // Check DB for duplicates
    const existingDb = db.prepare("SELECT * FROM certificate_registrations WHERE cert_hash = ?").get(hashRes.bytes32) as any;

    // Check on-chain for duplicates
    let existingChain: any = null;
    try {
      existingChain = await blockchainService.queryCertificate(hashRes.bytes32);
    } catch (err) {
      // Ignore if offline
    }

    const alreadyRegistered = Boolean(existingDb || existingChain?.found);

    res.json({
      success: true,
      data: {
        fileName: req.file.originalname,
        fileSizeBytes: hashRes.sizeBytes,
        sha256Hex: hashRes.sha256Hex,
        bytes32: hashRes.bytes32,
        isValidPdf: hashRes.isValidPdf,
        alreadyRegistered,
        existingRecord: existingDb
          ? {
              institution: existingDb.institution_name,
              registeredAt: existingDb.registered_at,
              status: existingDb.status,
              certificateRef: existingDb.certificate_ref,
            }
          : existingChain?.found
          ? {
              institution: existingChain.institutionName,
              registeredAt: existingChain.registeredAt,
              status: existingChain.statusLabel,
              certificateRef: existingChain.certificateRef,
            }
          : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to process certificate file." });
  }
});

/**
 * POST /api/certificates/register
 * Validates PDF, computes SHA-256 hash, and signs on-chain transaction
 */
router.post("/register", uploadCertificate.single("certificateFile"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "Please upload a certificate PDF document." });
    return;
  }

  const parseResult = registerMetadataSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ success: false, error: parseResult.error.issues[0]?.message || "Validation failed" });
    return;
  }

  const { studentName, certificateType, certificateRef } = parseResult.data;
  const user = req.user!;

  try {
    // 1. Validate magic bytes and hash file
    const hashRes = hashFileBuffer(req.file.buffer);
    if (!hashRes.isValidPdf) {
      res.status(400).json({
        success: false,
        error: "Security validation error: File does not match authentic PDF magic byte header (%PDF-).",
      });
      return;
    }

    // 2. Prevent duplicate active registrations
    const existing = db.prepare("SELECT id, status FROM certificate_registrations WHERE cert_hash = ?").get(hashRes.bytes32) as any;
    if (existing && existing.status === "active") {
      res.status(409).json({
        success: false,
        error: "This certificate hash is already registered in the system.",
      });
      return;
    }

    // 3. Register on-chain
    // In local demo environment, the backend signs using the demo issuer private key
    // In production with external wallet, the frontend would submit a signed transaction or pass a signed payload
    let txHash = "";
    let blockNumber = 0;
    let registeredAtTimestamp = Math.floor(Date.now() / 1000);

    try {
      const chainRes = await blockchainService.registerCertificateOnChain(
        hashRes.bytes32,
        certificateRef,
        config.demoIssuerPrivateKey
      );
      txHash = chainRes.txHash;
      blockNumber = chainRes.blockNumber;
      registeredAtTimestamp = chainRes.registeredAt;
    } catch (chainErr: any) {
      const msg = String(chainErr.message || "");
      const data = String(chainErr.data || "");
      if (msg.includes("CertificateAlreadyRegistered") || msg.includes("0x272e768a") || data.includes("0x272e768a")) {
        res.status(409).json({ success: false, error: "This certificate hash is already permanently registered on-chain." });
        return;
      }
      if (msg.includes("IssuerNotAuthorized") || msg.includes("0x1e36f642") || data.includes("0x1e36f642")) {
        res.status(403).json({ success: false, error: "Smart contract rejected registration: Issuer wallet is not authorized on-chain." });
        return;
      }
      throw new Error(`Blockchain transaction error: ${msg}`);
    }

    // 4. Save metadata in SQLite
    const nowIso = new Date(registeredAtTimestamp * 1000).toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO certificate_registrations (
        cert_hash, certificate_ref, student_name, certificate_type,
        issuer_id, issuer_wallet, institution_name, tx_hash,
        block_number, status, registered_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    const result = insertStmt.run(
      hashRes.bytes32,
      certificateRef,
      studentName,
      certificateType,
      user.id,
      user.wallet_address || config.demoIssuerWalletAddress,
      user.institution_name || "Apex State University",
      txHash,
      blockNumber,
      nowIso
    );

    logAudit(user.id, "CERTIFICATE_REGISTERED", "certificate_registrations", String(result.lastInsertRowid), req.ip || "127.0.0.1", {
      certHash: hashRes.bytes32,
      certificateRef,
      txHash,
      blockNumber,
    });

    res.status(201).json({
      success: true,
      message: "Certificate registered successfully and anchored on blockchain.",
      data: {
        id: result.lastInsertRowid,
        certHash: hashRes.bytes32,
        sha256Hex: hashRes.sha256Hex,
        certificateRef,
        studentName,
        certificateType,
        institutionName: user.institution_name,
        txHash,
        blockNumber,
        registeredAt: nowIso,
        status: "active",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to register certificate." });
  }
});

/**
 * GET /api/certificates/registrations
 * View certificates issued by the logged-in institution
 */
router.get("/registrations", (req: Request, res: Response) => {
  try {
    const list = db.prepare(`
      SELECT * FROM certificate_registrations
      WHERE issuer_id = ?
      ORDER BY registered_at DESC
    `).all(req.user!.id);

    res.json({ success: true, registrations: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve certificates." });
  }
});

/**
 * POST /api/certificates/:id/revoke
 * Issuer revokes a previously issued certificate
 */
router.post("/:id/revoke", async (req: Request, res: Response) => {
  const regId = parseInt(String(req.params.id), 10);
  const { reason } = req.body;

  const cert = db.prepare("SELECT * FROM certificate_registrations WHERE id = ? AND issuer_id = ?").get(
    regId,
    req.user!.id
  ) as any;

  if (!cert) {
    res.status(404).json({ success: false, error: "Certificate record not found." });
    return;
  }

  if (cert.status === "revoked") {
    res.status(400).json({ success: false, error: "This certificate is already revoked." });
    return;
  }

  try {
    let txHash = "";
    let blockNumber = 0;

    // Revoke on-chain
    try {
      const chainRes = await blockchainService.revokeCertificateOnChain(
        cert.cert_hash,
        reason || "Revoked by issuer",
        config.demoIssuerPrivateKey
      );
      txHash = chainRes.txHash;
      blockNumber = chainRes.blockNumber;
    } catch (chainErr: any) {
      console.error("On-chain revocation error:", chainErr.message);
      res.status(500).json({ success: false, error: `On-chain certificate revocation failed: ${chainErr.message}` });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE certificate_registrations
      SET status = 'revoked', revoked_at = ?, revocation_reason = ?
      WHERE id = ?
    `).run(now, reason || "Revoked by issuer", regId);

    logAudit(req.user!.id, "CERTIFICATE_REVOKED", "certificate_registrations", String(regId), req.ip || "127.0.0.1", {
      certHash: cert.cert_hash,
      reason,
      txHash,
      blockNumber,
    });

    res.json({
      success: true,
      message: "Certificate has been marked as revoked both in local records and on-chain.",
      txHash,
      blockNumber,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to revoke certificate." });
  }
});

export default router;
