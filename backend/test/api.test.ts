import assert from "assert";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { validatePdfMagicBytes, hashFileBuffer, normalizeHashToBytes32 } from "../src/utils/fileHash.js";
import { db, initDatabase } from "../src/database/db.js";

async function runTests() {
  console.log("==================================================");
  console.log("   Running ChainProof Backend Automated Tests");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✔ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ ${name}:`, err.message);
      failed++;
    }
  }

  // --- Test 1: PDF Magic Byte Detection ---
  test("Should identify valid PDF magic bytes (%PDF)", () => {
    const validPdfBuffer = Buffer.from("%PDF-1.4 sample certificate content\n%%EOF");
    assert.strictEqual(validatePdfMagicBytes(validPdfBuffer), true);
  });

  test("Should reject non-PDF files disguised with .pdf extension", () => {
    const spoofedBuffer = Buffer.from("<html><title>Not a PDF</title></html>");
    assert.strictEqual(validatePdfMagicBytes(spoofedBuffer), false);
  });

  test("Should reject empty or truncated buffers", () => {
    const empty = Buffer.alloc(0);
    assert.strictEqual(validatePdfMagicBytes(empty), false);
    const short = Buffer.from("%PD");
    assert.strictEqual(validatePdfMagicBytes(short), false);
  });

  // --- Test 2: SHA-256 Hashing ---
  test("Should compute deterministic SHA-256 hash and bytes32 formatting", () => {
    const content = Buffer.from("%PDF-1.4 Valid Certificate Body For Testing");
    const result = hashFileBuffer(content);
    
    const expectedHex = crypto.createHash("sha256").update(content).digest("hex");
    assert.strictEqual(result.sha256Hex, expectedHex);
    assert.strictEqual(result.bytes32, "0x" + expectedHex);
    assert.strictEqual(result.isValidPdf, true);
    assert.strictEqual(result.sizeBytes, content.length);
  });

  test("Should normalize 64-character hash strings with or without 0x prefix", () => {
    const hex = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    assert.strictEqual(normalizeHashToBytes32(hex), "0x" + hex);
    assert.strictEqual(normalizeHashToBytes32("0x" + hex), "0x" + hex);
  });

  test("Should reject invalid hash formats", () => {
    assert.throws(() => normalizeHashToBytes32("invalid-short-hash"));
    assert.throws(() => normalizeHashToBytes32("0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"));
  });

  // --- Test 3: Database & Demo Seeds ---
  test("Should verify database initialization and default accounts", () => {
    initDatabase();
    
    const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@chainproof.local") as any;
    assert(admin, "Admin account should be seeded");
    assert.strictEqual(admin.role, "admin");
    assert.strictEqual(admin.status, "active");
    assert(bcrypt.compareSync("AdminPass123!", admin.password_hash), "Admin password must verify");

    const issuer = db.prepare("SELECT * FROM users WHERE email = ?").get("issuer@apex.edu") as any;
    assert(issuer, "Demo issuer account should be seeded");
    assert.strictEqual(issuer.role, "issuer");
    assert.strictEqual(issuer.status, "active");
    assert(bcrypt.compareSync("IssuerPass123!", issuer.password_hash), "Issuer password must verify");

    const pending = db.prepare("SELECT * FROM users WHERE email = ?").get("registrar@coastal.edu") as any;
    assert(pending, "Pending issuer application should be seeded for admin review");
    assert.strictEqual(pending.status, "pending");
  });

  console.log("==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
