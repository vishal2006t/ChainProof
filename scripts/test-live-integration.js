const fs = require("fs");
const path = require("path");
const assert = require("assert");

async function main() {
  console.log("==================================================================");
  console.log("   ChainProof: Complete Live End-to-End System Integration Test   ");
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

  // --- Step 1: System Health & Connectivity Check ---
  let healthData;
  await check("1. System Health Check (/api/health)", async () => {
    const res = await fetch(`${API_BASE}/health`);
    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    healthData = await res.json();
    assert.strictEqual(healthData.status, "healthy");
    assert.strictEqual(healthData.database.status, "healthy");
    assert.strictEqual(healthData.blockchain.connected, true);
    assert.strictEqual(healthData.blockchain.contractVerified, true);
    assert.strictEqual(healthData.blockchain.contractAddress.startsWith("0x"), true);
  });

  // --- Step 2: Administrator Login ---
  let adminToken = "";
  await check("2. Administrator Authentication (/api/auth/login)", async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@chainproof.local",
        password: "AdminPass123!",
      }),
    });
    assert.strictEqual(res.status, 200, "Admin login failed");
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "admin");
    assert(data.token, "JWT token must be returned");
    adminToken = data.token;
  });

  const runId = Date.now().toString(36);

  // --- Step 3: Admin Review & On-Chain Approval of College Applicant ---
  let testApplicantId = 0;
  await check("3. Admin Review & On-Chain Issuer Authorization (/api/admin/issuers/:id/approve)", async () => {
    // 3a. Register a new test applicant institution
    const applicantEmail = `applicant_${runId}@polytechnic.edu`;
    const { ethers } = require(path.join(__dirname, "../backend/node_modules/ethers"));
    const applicantWallet = ethers.Wallet.createRandom().address;
    const applyRes = await fetch(`${API_BASE}/auth/register-issuer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: applicantEmail,
        password: "ApplicantPass123!",
        institutionName: `Polytechnic Institute ${runId}`,
        accreditationNumber: `ACCRED-${runId}`,
        walletAddress: applicantWallet,
      }),
    });
    assert.strictEqual(applyRes.status, 201, "Applicant registration failed");

    // 3b. Admin finds applicant in list
    const listRes = await fetch(`${API_BASE}/admin/issuers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const applicant = listData.issuers.find((i) => i.email === applicantEmail);
    assert(applicant, "Applicant should be present in queue");
    testApplicantId = applicant.id;

    // 3c. Admin approves on-chain
    const approveRes = await fetch(`${API_BASE}/admin/issuers/${testApplicantId}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(approveRes.status, 200, "Approval failed");
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.success, true);
    assert(approveData.txHash, "On-chain authorization transaction hash required");
  });

  // --- Step 4: Approved Issuer Login ---
  let issuerToken = "";
  await check("4. Authorized College Sign In (/api/auth/login)", async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "issuer@apex.edu",
        password: "IssuerPass123!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.role, "issuer");
    assert.strictEqual(data.user.status, "active");
    issuerToken = data.token;
  });

  // --- Step 5: PDF File Upload & Cryptographic SHA-256 Preview ---
  const testCertRef = `CERT-APEX-TEST-${runId}`;
  const testPdfContent = `%PDF-1.4\n% ChainProof Automated Test Run ${runId}\nMaya Chen - Bachelor of Science in Computer Science\nRef: ${testCertRef}\n%%EOF`;
  const genuineBlob = new Blob([Buffer.from(testPdfContent)], { type: "application/pdf" });
  const tamperedBlob = new Blob([Buffer.from(testPdfContent + " [TAMPERED_BYTE]")], { type: "application/pdf" });
  const unregBlob = new Blob([Buffer.from(`%PDF-1.4\n% Unregistered Document ${runId}\nAlex Rivera\n%%EOF`)], { type: "application/pdf" });

  await check("5. In-Memory Cryptographic SHA-256 Preview (/api/certificates/preview-hash)", async () => {
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, `${testCertRef}.pdf`);

    const res = await fetch(`${API_BASE}/certificates/preview-hash`, {
      method: "POST",
      headers: { Authorization: `Bearer ${issuerToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.isValidPdf, true);
    assert.strictEqual(data.data.bytes32.startsWith("0x"), true);
  });

  // --- Step 6: Certificate Registration on Blockchain ---
  let registeredCertHash = "";
  let registeredCertId = 0;
  await check("6. Anchor Certificate Hash on Blockchain (/api/certificates/register)", async () => {
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, `${testCertRef}.pdf`);
    formData.append("studentName", "Maya Chen");
    formData.append("certificateType", "Bachelor of Science in Computer Science");
    formData.append("certificateRef", testCertRef);

    const res = await fetch(`${API_BASE}/certificates/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${issuerToken}` },
      body: formData,
    });

    assert.strictEqual(res.status, 201, "Registration should succeed with 201 Created");
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(data.data.txHash, "On-chain transaction hash required");
    registeredCertHash = data.data.certHash;
    registeredCertId = data.data.id;
    assert(registeredCertHash.startsWith("0x"), "Valid bytes32 hash expected");
  });

  // --- Step 7: Duplicate Registration Rejection ---
  await check("7. Duplicate Registration Rejected with 409 Conflict", async () => {
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, "Maya_Chen_CS_Degree_GENUINE.pdf");
    formData.append("studentName", "Maya Chen");
    formData.append("certificateType", "Bachelor of Science in Computer Science");
    formData.append("certificateRef", "CERT-DUP-ATTEMPT");

    const res = await fetch(`${API_BASE}/certificates/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${issuerToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 409, "Duplicate must return 409 Conflict");
  });

  // --- Step 8: Public Verification: Genuine Unmodified File ---
  await check("8. Verification Scenario A: Genuine Unmodified File -> VERIFIED", async () => {
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, "Maya_Chen_CS_Degree_GENUINE.pdf");

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "VERIFIED");
    assert.strictEqual(data.data.onChainRecord.found, true);
    assert.strictEqual(data.data.onChainRecord.institutionName, "Apex State University");
    assert.strictEqual(data.data.onChainRecord.isIssuerCurrentlyAuthorized, true);
  });

  // --- Step 9: Public Verification: Tampered File Detection ---
  await check("9. Verification Scenario B: Tampered Modified File -> NOT_REGISTERED", async () => {
    const alteredBlob = new Blob([Buffer.from(testPdfContent + " [MODIFIED_1_BYTE_TAMPER]")], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("certificateFile", alteredBlob, "Tampered_Degree.pdf");

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "NOT_REGISTERED");
    assert.strictEqual(data.data.onChainRecord.found, false);
  });

  // --- Step 10: Public Verification: Unregistered File ---
  await check("10. Verification Scenario C: Unregistered Document -> NOT_REGISTERED", async () => {
    const unregPdfPath = path.join(__dirname, "../sample-certificates/Alex_Rivera_Cyber_UNREGISTERED.pdf");
    const unregBlob = new Blob([fs.readFileSync(unregPdfPath)], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("certificateFile", unregBlob, "Alex_Rivera_Cyber_UNREGISTERED.pdf");

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.data.outcome, "NOT_REGISTERED");
    assert.strictEqual(data.data.onChainRecord.found, false);
  });

  // --- Step 11: Unauthorized Issuer Rejection ---
  await check("11. Unauthorized User Blocked from Registering (403 Forbidden)", async () => {
    // Attempt registration with Admin token (not an issuer) or bad token
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, "Maya_Chen_CS_Degree_GENUINE.pdf");
    formData.append("studentName", "Hacker");
    formData.append("certificateType", "PhD");
    formData.append("certificateRef", "FAKE-001");

    const res = await fetch(`${API_BASE}/certificates/register`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });
    assert.strictEqual(res.status, 403, "Non-issuer must be rejected with 403");
  });

  // --- Step 12: Certificate Revocation Workflow ---
  await check("12. Verification Scenario D: Certificate Revocation -> REGISTRATION_REVOKED", async () => {
    // Revoke registered certificate
    const revokeRes = await fetch(`${API_BASE}/certificates/${registeredCertId}/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${issuerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Academic transcript correction" }),
    });
    assert.strictEqual(revokeRes.status, 200, "Revocation failed");

    // Verify again with genuine file
    const formData = new FormData();
    formData.append("certificateFile", genuineBlob, "Maya_Chen_CS_Degree_GENUINE.pdf");
    const verifyRes = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.data.outcome, "REGISTRATION_REVOKED");
    assert.strictEqual(verifyData.data.onChainRecord.revocationReason, "Academic transcript correction");
  });

  // --- Step 13: Issuer Revocation Workflow ---
  await check("13. Verification Scenario E: Issuer Revocation -> ISSUER_REVOKED", async () => {
    // Admin revokes test applicant
    const revokeIssuerRes = await fetch(`${API_BASE}/admin/issuers/${testApplicantId}/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: "Accreditation expired" }),
    });
    assert.strictEqual(revokeIssuerRes.status, 200);

    const listRes = await fetch(`${API_BASE}/admin/issuers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    const revoked = listData.issuers.find((i) => i.id === testApplicantId);
    assert.strictEqual(revoked.status, "revoked");
  });

  // --- Step 14: Security Audit Trail Verification ---
  await check("14. Security Audit Trail Logs All Sensitive Actions (/api/admin/audit-logs)", async () => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.logs.length >= 4, "Audit logs must capture registrations and approvals");
  });

  console.log("==================================================================");
  console.log(`Integration Test Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Integration test script crashed:", err);
  process.exit(1);
});
