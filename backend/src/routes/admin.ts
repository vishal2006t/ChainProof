import { Router, Request, Response } from "express";
import { z } from "zod";
import { db, logAudit } from "../database/db.js";
import { requireAdmin } from "../middleware/auth.js";
import { blockchainService } from "../blockchain/blockchainService.js";

const router = Router();
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
    const totalIssuers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'issuer' AND status = 'active'").get() as any;
    const pendingApplications = db.prepare("SELECT COUNT(*) as count FROM issuer_applications WHERE status = 'pending'").get() as any;
    const totalRegistrations = db.prepare("SELECT COUNT(*) as count FROM certificate_registrations").get() as any;
    const totalRevocations = db.prepare("SELECT COUNT(*) as count FROM certificate_registrations WHERE status = 'revoked'").get() as any;
    const totalVerifications = db.prepare("SELECT COUNT(*) as count FROM verification_logs").get() as any;

    const outcomes = db.prepare(`
      SELECT outcome, COUNT(*) as count 
      FROM verification_logs 
      GROUP BY outcome
    `).all();

    // Query live contract metrics
    const chainMetrics = await blockchainService.getMetrics();

    res.json({
      success: true,
      data: {
        totalIssuers: totalIssuers.count,
        pendingApplications: pendingApplications.count,
        totalRegistrations: totalRegistrations.count,
        totalRevocations: totalRevocations.count,
        totalVerifications: totalVerifications.count,
        totalUsers: totalUsers.count,
        onChain: chainMetrics,
        verificationOutcomes: outcomes,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to load dashboard statistics." });
  }
});

/**
 * GET /api/admin/issuers
 */
router.get("/issuers", (_req: Request, res: Response) => {
  try {
    const issuers = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.institution_name,
        u.wallet_address,
        u.status,
        u.created_at,
        app.id as application_id,
        app.accreditation_number,
        app.rejection_reason,
        app.status as application_status
      FROM users u
      LEFT JOIN issuer_applications app ON u.id = app.user_id
      WHERE u.role = 'issuer'
      ORDER BY u.created_at DESC
    `).all();

    res.json({ success: true, issuers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve issuer list." });
  }
});

/**
 * POST /api/admin/issuers/:id/approve
 * Approves an issuer and triggers on-chain authorization transaction!
 */
router.post("/issuers/:id/approve", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.id), 10);
  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'issuer'").get(userId) as any;

  if (!user) {
    res.status(404).json({ success: false, error: "Issuer account not found." });
    return;
  }

  if (user.status === "active") {
    res.status(400).json({ success: false, error: "Issuer is already approved and active." });
    return;
  }

  try {
    let txHash = "";
    let blockNumber = 0;

    // Execute on-chain authorization if wallet is present
    if (user.wallet_address) {
      try {
        const onChainRes = await blockchainService.authorizeIssuerOnChain(
          user.wallet_address,
          user.institution_name || "Authorized College"
        );
        txHash = onChainRes.txHash;
        blockNumber = onChainRes.blockNumber;
      } catch (chainErr: any) {
        // If already authorized on chain, continue
        const errMsg = String(chainErr.message || "");
        if (!errMsg.includes("IssuerAlreadyAuthorized")) {
          throw new Error(`Blockchain authorization failed: ${errMsg}`);
        }
      }
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE users SET status = 'active', updated_at = ? WHERE id = ?").run(now, userId);
    db.prepare(`
      UPDATE issuer_applications 
      SET status = 'approved', reviewed_by = ?, reviewed_at = ? 
      WHERE user_id = ?
    `).run(req.user!.id, now, userId);

    logAudit(req.user!.id, "ISSUER_APPROVED", "users", String(userId), req.ip || "127.0.0.1", {
      walletAddress: user.wallet_address,
      institutionName: user.institution_name,
      txHash,
      blockNumber,
    });

    res.json({
      success: true,
      message: `Issuer '${user.institution_name}' has been authorized both in database and on-chain.`,
      txHash,
      blockNumber,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to approve issuer." });
  }
});

/**
 * POST /api/admin/issuers/:id/reject
 */
router.post("/issuers/:id/reject", (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.id), 10);
  const { reason } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'issuer'").get(userId) as any;
  if (!user) {
    res.status(404).json({ success: false, error: "Issuer not found." });
    return;
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE users SET status = 'rejected', updated_at = ? WHERE id = ?").run(now, userId);
  db.prepare(`
    UPDATE issuer_applications 
    SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = ? 
    WHERE user_id = ?
  `).run(reason || "Institutional accreditation could not be validated.", req.user!.id, now, userId);

  logAudit(req.user!.id, "ISSUER_REJECTED", "users", String(userId), req.ip || "127.0.0.1", {
    reason,
  });

  res.json({ success: true, message: "Issuer application rejected." });
});

/**
 * POST /api/admin/issuers/:id/revoke
 * Revokes future issuance rights in database and smart contract!
 */
router.post("/issuers/:id/revoke", async (req: Request, res: Response) => {
  const userId = parseInt(String(req.params.id), 10);
  const { reason } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'issuer'").get(userId) as any;
  if (!user) {
    res.status(404).json({ success: false, error: "Issuer not found." });
    return;
  }

  try {
    let txHash = "";
    let blockNumber = 0;

    // Trigger on-chain revocation if active
    if (user.wallet_address) {
      try {
        const onChainRes = await blockchainService.revokeIssuerOnChain(
          user.wallet_address,
          reason || "Administrative revocation"
        );
        txHash = onChainRes.txHash;
        blockNumber = onChainRes.blockNumber;
      } catch (chainErr: any) {
        console.warn("On-chain revocation note:", chainErr.message);
      }
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE users SET status = 'revoked', updated_at = ? WHERE id = ?").run(now, userId);
    db.prepare(`
      UPDATE issuer_applications 
      SET status = 'revoked', rejection_reason = ?, reviewed_by = ?, reviewed_at = ? 
      WHERE user_id = ?
    `).run(reason || "Revoked by admin", req.user!.id, now, userId);

    logAudit(req.user!.id, "ISSUER_REVOKED", "users", String(userId), req.ip || "127.0.0.1", {
      reason,
      txHash,
      blockNumber,
    });

    res.json({
      success: true,
      message: `Issuer '${user.institution_name}' has been revoked. Future registrations are disabled.`,
      txHash,
      blockNumber,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to revoke issuer." });
  }
});

/**
 * GET /api/admin/registrations
 */
router.get("/registrations", (_req: Request, res: Response) => {
  try {
    const registrations = db.prepare(`
      SELECT * FROM certificate_registrations
      ORDER BY registered_at DESC
      LIMIT 100
    `).all();

    res.json({ success: true, registrations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to load registrations." });
  }
});

/**
 * GET /api/admin/audit-logs
 */
router.get("/audit-logs", (_req: Request, res: Response) => {
  try {
    const logs = db.prepare(`
      SELECT 
        a.*,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
      LIMIT 100
    `).all();

    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to retrieve audit trail." });
  }
});

export default router;
