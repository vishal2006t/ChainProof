import crypto from "crypto";

export interface FileHashResult {
  sha256Hex: string;
  bytes32: string;
  sizeBytes: number;
  isValidPdf: boolean;
  mimeType: string;
}

/**
 * Validates that the buffer starts with the canonical PDF magic bytes: "%PDF" (0x25, 0x50, 0x44, 0x46)
 */
export function validatePdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }
  // %PDF in ASCII is 0x25, 0x50, 0x44, 0x46
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

/**
 * Computes cryptographically secure SHA-256 hash directly from file bytes.
 * Validates PDF signature against spoofed extensions.
 */
export function hashFileBuffer(buffer: Buffer): FileHashResult {
  const isValidPdf = validatePdfMagicBytes(buffer);
  
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const bytes32 = "0x" + hash;

  return {
    sha256Hex: hash,
    bytes32: bytes32,
    sizeBytes: buffer.length,
    isValidPdf: isValidPdf,
    mimeType: isValidPdf ? "application/pdf" : "application/octet-stream",
  };
}

/**
 * Normalizes an external SHA-256 hash string (with or without 0x prefix) into a valid bytes32 string.
 */
export function normalizeHashToBytes32(hashInput: string): string {
  const clean = hashInput.trim().toLowerCase();
  if (clean.startsWith("0x")) {
    if (clean.length === 66 && /^[0-9a-f]{64}$/.test(clean.substring(2))) {
      return clean;
    }
  } else {
    if (clean.length === 64 && /^[0-9a-f]{64}$/.test(clean)) {
      return "0x" + clean;
    }
  }
  throw new Error("Invalid SHA-256 hash format. Expected a 64-character hexadecimal string.");
}
