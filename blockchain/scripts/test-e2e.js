const { ethers } = require("hardhat");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

async function runE2ETests() {
  console.log("==================================================");
  console.log("   ChainProof: Complete End-to-End Workflow Test");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assertTest(condition, name, details = "") {
    if (condition) {
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // 1. Deploy Contract
  console.log("\n[1/5] Deploying CertificateRegistry Contract...");
  const [adminSigner, collegeSigner, studentSigner] = await ethers.getSigners();
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  console.log(`Contract deployed at: ${contractAddress}`);
  assertTest(contractAddress.startsWith("0x"), "Contract deployed with valid address");

  // 2. Authorize College Issuer
  console.log("\n[2/5] Admin Authorizing College Issuer...");
  const authTx = await registry.connect(adminSigner).authorizeIssuer(collegeSigner.address, "Apex State University");
  await authTx.wait();
  const isAuth = await registry.isIssuerAuthorized(collegeSigner.address);
  assertTest(isAuth === true, "College Issuer authorized on-chain");

  // 3. Load Sample PDF Certificates and compute SHA-256 digests
  console.log("\n[3/5] Cryptographic SHA-256 File Byte Hashing...");
  const genuinePath = path.join(__dirname, "../../sample-certificates/Maya_Chen_CS_Degree_GENUINE.pdf");
  const tamperedPath = path.join(__dirname, "../../sample-certificates/Maya_Chen_CS_Degree_TAMPERED.pdf");
  const unregisteredPath = path.join(__dirname, "../../sample-certificates/Alex_Rivera_Cyber_UNREGISTERED.pdf");

  const genuineBytes = fs.readFileSync(genuinePath);
  const tamperedBytes = fs.readFileSync(tamperedPath);
  const unregisteredBytes = fs.readFileSync(unregisteredPath);

  // Validate PDF magic bytes (%PDF)
  assertTest(
    genuineBytes[0] === 0x25 && genuineBytes[1] === 0x50 && genuineBytes[2] === 0x44 && genuineBytes[3] === 0x46,
    "Genuine file has authentic PDF magic bytes (%PDF-)"
  );

  const genuineHash = "0x" + crypto.createHash("sha256").update(genuineBytes).digest("hex");
  const tamperedHash = "0x" + crypto.createHash("sha256").update(tamperedBytes).digest("hex");
  const unregisteredHash = "0x" + crypto.createHash("sha256").update(unregisteredBytes).digest("hex");

  console.log(`Genuine SHA-256:     ${genuineHash}`);
  console.log(`Tampered SHA-256:    ${tamperedHash}`);
  console.log(`Unregistered SHA-256:${unregisteredHash}`);

  assertTest(genuineHash !== tamperedHash, "Altering certificate text completely changes SHA-256 digest (Avalanche Effect)");

  // 4. Register Genuine Certificate On-Chain
  console.log("\n[4/5] College Signing Registration Transaction on Blockchain...");
  const certRef = "CERT-APEX-2026-001";
  const regTx = await registry.connect(collegeSigner).registerCertificate(genuineHash, certRef);
  const regReceipt = await regTx.wait();
  console.log(`Registration Transaction Hash: ${regReceipt.hash}`);
  assertTest(regReceipt.status === 1, "Transaction successfully mined on Ethereum local chain");

  // Verify duplicate rejection
  let duplicateRejected = false;
  try {
    await registry.connect(collegeSigner).registerCertificate(genuineHash, "CERT-DUP");
  } catch (err) {
    duplicateRejected = true;
  }
  assertTest(duplicateRejected, "Duplicate certificate registration correctly rejected by smart contract");

  // 5. Verification Queries & Outcomes
  console.log("\n[5/5] Testing Verification Outcomes against Smart Contract...");

  // Outcome A: Genuine PDF -> VERIFIED
  const certRecord = await registry.getCertificate(genuineHash);
  const isVerified = certRecord.status === 1n && certRecord.isIssuerCurrentlyAuthorized === true;
  assertTest(isVerified, "Verification Outcome A: VERIFIED (Exact byte match, active authorized issuer)");
  assertTest(certRecord.certificateRef === certRef, "Reference ID matches: CERT-APEX-2026-001");
  assertTest(certRecord.institutionName === "Apex State University", "Institution name correctly returned");

  // Outcome B: Unregistered PDF -> NOT REGISTERED
  let notRegisteredCaught = false;
  try {
    await registry.getCertificate(unregisteredHash);
  } catch (err) {
    notRegisteredCaught = true;
  }
  assertTest(notRegisteredCaught, "Verification Outcome B: NOT REGISTERED (Hash not found in registry)");

  // Outcome C: Modified File / Hash Mismatch -> Different hash
  assertTest(tamperedHash !== genuineHash, "Verification Outcome C: FILE MODIFIED (Tampered file produces non-matching hash)");

  // Outcome D: Revoke Certificate -> REGISTRATION_REVOKED
  console.log("\nRevoking certificate for test...");
  const revokeCertTx = await registry.connect(collegeSigner).revokeCertificate(genuineHash, "Academic audit adjustment");
  await revokeCertTx.wait();
  const revokedRecord = await registry.getCertificate(genuineHash);
  assertTest(revokedRecord.status === 2n, "Verification Outcome D: REGISTRATION REVOKED (status = Revoked)");
  assertTest(revokedRecord.revocationReason === "Academic audit adjustment", "Revocation reason preserved on-chain");

  // Outcome E: Revoke Issuer -> ISSUER_REVOKED
  // Register another certificate first
  const anotherHash = "0x" + crypto.createHash("sha256").update(Buffer.from("%PDF-1.4 Another Genuine Degree")).digest("hex");
  await registry.connect(collegeSigner).registerCertificate(anotherHash, "CERT-2026-002");
  await registry.connect(adminSigner).revokeIssuer(collegeSigner.address, "Accreditation expired");
  const certUnderRevokedIssuer = await registry.getCertificate(anotherHash);
  assertTest(
    certUnderRevokedIssuer.isIssuerCurrentlyAuthorized === false,
    "Verification Outcome E: ISSUER REVOKED (isIssuerCurrentlyAuthorized = false)"
  );

  console.log("\n==================================================");
  console.log(`E2E Results: ${passed} passed, ${failed} failed.`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("E2E Test Run Failed:", err);
  process.exit(1);
});
