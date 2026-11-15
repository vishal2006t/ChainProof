import { Router, Request, Response } from "express";
import crypto from "crypto";
import { uploadCertificate } from "../middleware/upload.js";
import { hashFileBuffer, normalizeHashToBytes32 } from "../utils/fileHash.js";
import { blockchainService } from "../blockchain/blockchainService.js";
import { db } from "../database/db.js";

const router = Router();

export type VerificationOutcome =
  | "VERIFIED"
  | "NOT_REGISTERED"
  | "FILE_MODIFIED"
  | "REGISTRATION_REVOKED"
  | "ISSUER_REVOKED"
  | "VERIFICATION_ERROR";

export interface VerificationReceipt {
  verificationId: string;
  verifiedAt: string;
  outcome: VerificationOutcome;
  outcomeTitle: string;
  explanation: string;
  fileDetails: {
    fileName?: string;
    fileSizeBytes?: number;
    sha256Hex: string;
    bytes32: string;
    isValidPdf: boolean;
  };
  onChainRecord: {
    found: boolean;
    contractAddress: string;
    issuerAddress?: string;
    institutionName?: string;
    certificateRef?: string;
    statusLabel?: string;
    registeredAt?: string;
    revokedAt?: string;
    revocationReason?: string;
    isIssuerCurrentlyAuthorized?: boolean;
    txHash?: string;
    blockNumber?: number;
  };
}

/**
 * POST /api/verify
 * Public endpoint: verifies uploaded certificate PDF or hash against smart contract
 */
router.post("/", uploadCertificate.single("certificateFile"), async (req: Request, res: Response) => {
  let certHashBytes32 = "";
  let sha256Hex = "";
  let fileName = "";
  let fileSizeBytes = 0;
  let isValidPdf = true;

  try {
    if (req.file) {
      const hashRes = hashFileBuffer(req.file.buffer);
      fileName = req.file.originalname;
      fileSizeBytes = hashRes.sizeBytes;
      isValidPdf = hashRes.isValidPdf;
      sha256Hex = hashRes.sha256Hex;
      certHashBytes32 = hashRes.bytes32;

      if (!isValidPdf) {
        res.status(400).json({
          success: false,
          error: "Invalid file format: Uploaded file lacks authentic PDF magic byte header (%PDF-).",
        });
        return;
      }
    } else if (req.body.certHash || req.body.hashInput) {
      const rawHash = req.body.certHash || req.body.hashInput;
      certHashBytes32 = normalizeHashToBytes32(rawHash);
      sha256Hex = certHashBytes32.replace(/^0x/, "");
      fileName = "Direct-Hash-Query";
    } else {
      res.status(400).json({
        success: false,
        error: "Please provide either a certificate PDF file or a SHA-256 hash.",
      });
      return;
    }

    const expectedHash = req.body.expectedHash ? req.body.expectedHash.trim().toLowerCase() : "";
    const expectedRef = req.body.expectedRef ? req.body.expectedRef.trim() : "";

    // 1. Query Smart Contract directly
    let chainResult;
    try {
      chainResult = await blockchainService.queryCertificate(certHashBytes32);
    } catch (err: any) {
      console.error("Blockchain query failed:", err.message);
      
      const receipt: VerificationReceipt = {
        verificationId: `RCP-ERR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        verifiedAt: new Date().toISOString(),
        outcome: "VERIFICATION_ERROR",
        outcomeTitle: "Verification Error",
        explanation: `Unable to complete query on the blockchain network: ${err.message || "Connection refused"}. Please verify local node status.`,
        fileDetails: { fileName, fileSizeBytes, sha256Hex, bytes32: certHashBytes32, isValidPdf },
        onChainRecord: { found: false, contractAddress: blockchainService.contractAddress },
      };

      res.status(502).json({ success: false, data: receipt });
      return;
    }

    // 2. Query supplementary database record (if available) for tx reference and audit
    const dbRecord = db.prepare("SELECT * FROM certificate_registrations WHERE cert_hash = ?").get(certHashBytes32) as any;

    // 3. Determine Outcome
    let outcome: VerificationOutcome = "VERIFIED";
    let outcomeTitle = "Certificate Authenticated & Verified";
    let explanation = "Exact byte match found on the blockchain. The certificate was registered by an authorized educational institution and remains in good standing.";

    // Check if user expected a specific hash but uploaded something else
    if (expectedHash && expectedHash !== sha256Hex && expectedHash !== certHashBytes32) {
      outcome = "FILE_MODIFIED";
      outcomeTitle = "File Modified / Hash Mismatch";
      explanation = "The uploaded file does not match the expected registered certificate hash. Even a 1-byte alteration changes the SHA-256 digest.";
    } else if (expectedRef) {
      const dbRecordByRef = db.prepare("SELECT * FROM certificate_registrations WHERE certificate_ref = ?").get(expectedRef) as any;
      if (dbRecordByRef && dbRecordByRef.cert_hash !== certHashBytes32) {
        outcome = "FILE_MODIFIED";
        outcomeTitle = "File Modified / Hash Mismatch";
        explanation = `The uploaded document presents Reference ID '${expectedRef}', which is registered in the official registry with hash ${dbRecordByRef.cert_hash}, but this file's SHA-256 hash (${certHashBytes32}) does not match! The document contents have been altered or tampered with.`;
      } else if (!chainResult.found) {
        outcome = "NOT_REGISTERED";
        outcomeTitle = "Not Registered On-Chain";
        explanation = "No matching certificate hash exists on the blockchain registry. The document may be unregistered, or its contents may have been altered since issuance. This does not automatically mean the file is fraudulent, but it cannot be verified via ChainProof.";
      }
    } else if (!chainResult.found) {
      outcome = "NOT_REGISTERED";
      outcomeTitle = "Not Registered On-Chain";
      explanation = "No matching certificate hash exists on the blockchain registry. The document may be unregistered, or its contents may have been altered since issuance. This does not automatically mean the file is fraudulent, but it cannot be verified via ChainProof.";
    } else if (chainResult.status === 2 || dbRecord?.status === "revoked") { // Revoked
      outcome = "REGISTRATION_REVOKED";
      outcomeTitle = "Certificate Revoked";
      const reason = chainResult.revocationReason || dbRecord?.revocation_reason || "Not specified";
      explanation = `This certificate was officially registered, but was subsequently REVOKED. Reason provided: "${reason}".`;
    } else if (chainResult.isIssuerCurrentlyAuthorized === false) {
      outcome = "ISSUER_REVOKED";
      outcomeTitle = "Issuer Authorization Revoked";
      explanation = "The certificate was previously registered on-chain, but the issuing institution's cryptographic authorization has since been REVOKED by administrators.";
    } else {
      outcome = "VERIFIED";
      outcomeTitle = "Certificate Authenticated";
      explanation = "Cryptographic integrity confirmed: The uploaded document's SHA-256 hash matches an active, untampered record registered by an authorized institution.";
    }

    const verificationId = `CP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const verifiedAt = new Date().toISOString();

    const receipt: VerificationReceipt = {
      verificationId,
      verifiedAt,
      outcome,
      outcomeTitle,
      explanation,
      fileDetails: {
        fileName,
        fileSizeBytes,
        sha256Hex,
        bytes32: certHashBytes32,
        isValidPdf,
      },
      onChainRecord: {
        found: chainResult.found,
        contractAddress: blockchainService.contractAddress,
        issuerAddress: chainResult.issuer || dbRecord?.issuer_wallet,
        institutionName: chainResult.institutionName || dbRecord?.institution_name || "Authorized Institution",
        certificateRef: chainResult.certificateRef || dbRecord?.certificate_ref,
        statusLabel: chainResult.statusLabel || (dbRecord?.status === "active" ? "Active" : "Revoked"),
        registeredAt: chainResult.registeredAt
          ? new Date(chainResult.registeredAt * 1000).toISOString()
          : dbRecord?.registered_at,
        revokedAt: chainResult.revokedAt && chainResult.revokedAt > 0
          ? new Date(chainResult.revokedAt * 1000).toISOString()
          : dbRecord?.revoked_at,
        revocationReason: chainResult.revocationReason || dbRecord?.revocation_reason,
        isIssuerCurrentlyAuthorized: chainResult.isIssuerCurrentlyAuthorized,
        txHash: dbRecord?.tx_hash,
        blockNumber: dbRecord?.block_number,
      },
    };

    // Log verification for platform analytics
    try {
      db.prepare(`
        INSERT INTO verification_logs (cert_hash, outcome, verified_at, client_ip, user_agent, details_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        certHashBytes32,
        outcome,
        verifiedAt,
        req.ip || "127.0.0.1",
        req.headers["user-agent"] || "unknown",
        JSON.stringify({ verificationId, fileName, expectedRef })
      );
    } catch (logErr) {
      console.warn("Failed to record verification log:", logErr);
    }

    res.json({
      success: true,
      data: receipt,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "An unexpected error occurred during certificate verification.",
    });
  }
});

/**
 * GET /api/verify/:hash
 * Direct query by hash string
 */
router.get("/:hash", async (req: Request, res: Response) => {
  try {
    const certHashBytes32 = normalizeHashToBytes32(String(req.params.hash));
    const chainResult = await blockchainService.queryCertificate(certHashBytes32);
    const dbRecord = db.prepare("SELECT * FROM certificate_registrations WHERE cert_hash = ?").get(certHashBytes32) as any;

    if (!chainResult.found) {
      res.status(404).json({
        success: false,
        outcome: "NOT_REGISTERED",
        message: "No certificate registration found on-chain for this hash.",
        hash: certHashBytes32,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        hash: certHashBytes32,
        onChain: chainResult,
        metadata: dbRecord
          ? {
              certificateRef: dbRecord.certificate_ref,
              institutionName: dbRecord.institution_name,
              txHash: dbRecord.tx_hash,
              blockNumber: dbRecord.block_number,
            }
          : null,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Invalid hash query." });
  }
});

export default router;
