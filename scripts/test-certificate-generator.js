const fs = require("fs");
const path = require("path");
const assert = require("assert");
const crypto = require("crypto");

async function runGeneratorTests() {
  console.log("==================================================================");
  console.log("   ChainProof: Certificate Generator & Tamper Verification Test  ");
  console.log("==================================================================");

  const API_BASE = "http://localhost:5000/api";
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Pure Node version of PDF-1.4 builder identical to frontend pdfGenerator.ts
  function buildCertificatePdf({
    studentName = "Maya Chen",
    institutionName = "Apex State University",
    courseName = "Bachelor of Science in Computer Science",
    certificateId = "CERT-DEMO-2026-001",
    issueDate = "2026-10-21",
    achievement = "For outstanding academic performance and successfully fulfilling all graduation requirements.",
    isTampered = false,
  }) {
    const sanitize = (val) => String(val || "").replace(/[()\\]/g, "").replace(/[\r\n]+/g, " ").trim();

    const student = sanitize(studentName);
    const institution = sanitize(institutionName);
    const course = sanitize(courseName);
    const certId = sanitize(certificateId);
    const date = sanitize(issueDate);
    const achieve = sanitize(achievement);

    const bannerText = isTampered
      ? "TAMPERED DEMO COPY - MODIFIED FOR TESTING - NOT AN OFFICIAL QUALIFICATION"
      : "DEMO SAMPLE - NOT AN OFFICIAL QUALIFICATION - CHAINPROOF VERIFICATION DEMO";

    const streamLines = [
      "q",
      "0.78 0.62 0.22 RG",
      "4 w",
      "20 20 802 555 re S",
      "0.85 0.70 0.30 RG",
      "1.5 w",
      "28 28 786 539 re S",
      "Q",
      "BT",
      "/F2 10 Tf",
      "210 538 Td",
      `(${bannerText}) Tj`,
      "ET",
      "BT",
      "/F2 20 Tf",
      "240 480 Td",
      `(${institution}) Tj`,
      "ET",
      "BT",
      "/F2 26 Tf",
      "215 435 Td",
      "(CERTIFICATE OF ACHIEVEMENT) Tj",
      "ET",
      "BT",
      "/F3 13 Tf",
      "310 395 Td",
      "(THIS IS PROUDLY CONFERRED UPON) Tj",
      "ET",
      "BT",
      "/F2 24 Tf",
      "240 355 Td",
      `(${student}) Tj`,
      "ET",
      "BT",
      "/F1 12 Tf",
      "120 315 Td",
      `(${achieve}) Tj`,
      "ET",
      "BT",
      "/F2 16 Tf",
      "240 280 Td",
      `(${course}) Tj`,
      "ET",
      "BT",
      "/F1 11 Tf",
      "60 170 Td",
      `(Certificate Reference: ${certId}) Tj`,
      "0 -20 Td",
      `(Issue Date: ${date}) Tj`,
      "ET",
    ];

    const streamContent = streamLines.join("\n");
    const streamLength = Buffer.byteLength(streamContent, "utf-8");

    let out = "%PDF-1.4\n";
    const offsets = [];

    function addObj(str) {
      offsets.push(Buffer.byteLength(out, "utf-8"));
      out += str + "\n";
    }

    addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
    addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
    addObj(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj"
    );
    addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
    addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
    addObj("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");
    addObj("7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj");

    const startxref = Buffer.byteLength(out, "utf-8");
    out += "xref\n0 8\n";
    out += "0000000000 65535 f \n";
    for (let i = 0; i < offsets.length; i++) {
      out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    out += "trailer\n<< /Size 8 /Root 1 0 R >>\n";
    out += "startxref\n" + startxref + "\n%%EOF\n";

    return Buffer.from(out, "utf-8");
  }

  const runId = Date.now().toString(36);
  const testCertRef = `CERT-GEN-TEST-${runId}`;
  let genuineBuffer, tamperedBuffer;
  let genuineHash, tamperedHash;

  // 1. PDF Structure & Cryptographic Generation
  await check("1. Generate Valid PDF-1.4 Certificate with Authentic Magic Bytes", async () => {
    genuineBuffer = buildCertificatePdf({
      studentName: "Maya Chen",
      institutionName: "Apex State University",
      courseName: "Bachelor of Science in Computer Science",
      certificateId: testCertRef,
      isTampered: false,
    });

    assert.strictEqual(genuineBuffer.subarray(0, 4).toString(), "%PDF", "Must begin with %PDF magic bytes");
    genuineHash = "0x" + crypto.createHash("sha256").update(genuineBuffer).digest("hex");
    assert.strictEqual(genuineHash.length, 66, "SHA-256 hash must be 66 characters (0x + 64 hex)");
  });

  // 2. Tampered Copy Generation & Avalanche Effect
  await check("2. Generate Tampered Copy with Single Altered Field & Distinct Hash", async () => {
    tamperedBuffer = buildCertificatePdf({
      studentName: "[TAMPERED] Mallory Vance (Unauthorized Alteration)",
      institutionName: "Apex State University",
      courseName: "Bachelor of Science in Computer Science",
      certificateId: testCertRef, // SAME certificate reference ID!
      isTampered: true,
    });

    tamperedHash = "0x" + crypto.createHash("sha256").update(tamperedBuffer).digest("hex");
    assert.notStrictEqual(genuineHash, tamperedHash, "Avalanche effect: hashes must differ");
    assert.strictEqual(tamperedBuffer.subarray(0, 4).toString(), "%PDF");
  });

  // 3. Unregistered State Verification
  await check("3. Unregistered Generated Certificate Reports NOT_REGISTERED", async () => {
    const formData = new FormData();
    const genuineBlob = new Blob([genuineBuffer], { type: "application/pdf" });
    formData.append("certificateFile", genuineBlob, `${testCertRef}.pdf`);

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "NOT_REGISTERED");
    assert.strictEqual(data.data.onChainRecord.found, false);
  });

  // 4. Authorized College Issuer Registers Genuine Certificate On-Chain
  let issuerToken = "";
  await check("4. Authorized College Issuer Authenticates & Registers Certificate On-Chain", async () => {
    // Login as Apex University
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "issuer@apex.edu", password: "IssuerPass123!" }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    issuerToken = loginData.token;

    // Register on blockchain
    const formData = new FormData();
    const genuineBlob = new Blob([genuineBuffer], { type: "application/pdf" });
    formData.append("certificateFile", genuineBlob, `${testCertRef}.pdf`);
    formData.append("studentName", "Maya Chen");
    formData.append("certificateType", "Bachelor of Science in Computer Science");
    formData.append("certificateRef", testCertRef);

    const regRes = await fetch(`${API_BASE}/certificates/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${issuerToken}` },
      body: formData,
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.strictEqual(regData.success, true);
    assert(regData.data.txHash, "On-chain transaction hash required");
    assert.strictEqual(regData.data.certHash, genuineHash);
  });

  // 5. Verify Genuine Certificate Reports VERIFIED
  await check("5. Public Verification of Genuine Certificate Reports VERIFIED", async () => {
    const formData = new FormData();
    const genuineBlob = new Blob([genuineBuffer], { type: "application/pdf" });
    formData.append("certificateFile", genuineBlob, `${testCertRef}.pdf`);

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "VERIFIED");
    assert.strictEqual(data.data.onChainRecord.found, true);
    assert.strictEqual(data.data.onChainRecord.certificateRef, testCertRef);
  });

  // 6. Verify Tampered Copy Reports FILE_MODIFIED (Hash Mismatch)
  await check("6. Public Verification of Tampered Copy Reports FILE_MODIFIED / Hash Mismatch", async () => {
    const formData = new FormData();
    const tamperedBlob = new Blob([tamperedBuffer], { type: "application/pdf" });
    formData.append("certificateFile", tamperedBlob, `${testCertRef}_TAMPERED.pdf`);
    // Provide expected certificate reference
    formData.append("expectedRef", testCertRef);

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "FILE_MODIFIED");
    assert.strictEqual(data.data.outcomeTitle, "File Modified / Hash Mismatch");
  });

  console.log("==================================================================");
  console.log(`Certificate Generator Test Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runGeneratorTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
