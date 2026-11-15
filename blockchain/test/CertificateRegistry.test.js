const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry Smart Contract", function () {
  let CertificateRegistry;
  let registry;
  let owner, issuer1, issuer2, unauthorizedUser, verifier;

  // Helper sample hashes (bytes32 format)
  const sampleHash1 = ethers.keccak256(ethers.toUtf8Bytes("Sample Certificate 1 - CS Degree"));
  const sampleHash2 = ethers.keccak256(ethers.toUtf8Bytes("Sample Certificate 2 - Cyber Security"));
  const zeroHash = ethers.ZeroHash;

  beforeEach(async function () {
    [owner, issuer1, issuer2, unauthorizedUser, verifier] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment & Initial State", function () {
    it("Should set the deployer as the owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should initialize counts to zero", async function () {
      expect(await registry.totalCertificatesRegistered()).to.equal(0);
      expect(await registry.totalCertificatesRevoked()).to.equal(0);
      expect(await registry.totalAuthorizedIssuers()).to.equal(0);
    });
  });

  describe("Issuer Authorization Management", function () {
    it("Should allow the owner to authorize an issuer", async function () {
      await expect(registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute of Technology"))
        .to.emit(registry, "IssuerAuthorized")
        .withArgs(issuer1.address, "Apex Institute of Technology", (await ethers.provider.getBlock("latest")).timestamp + 1);

      expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.true;
      expect(await registry.totalAuthorizedIssuers()).to.equal(1);

      const info = await registry.getIssuer(issuer1.address);
      expect(info.isAuthorized).to.be.true;
      expect(info.institutionName).to.equal("Apex Institute of Technology");
    });

    it("Should reject non-owner attempting to authorize an issuer", async function () {
      await expect(
        registry.connect(unauthorizedUser).authorizeIssuer(issuer2.address, "Malicious University")
      ).to.be.revertedWithCustomError(registry, "NotContractOwner");
    });

    it("Should reject authorizing the zero address", async function () {
      await expect(
        registry.connect(owner).authorizeIssuer(ethers.ZeroAddress, "Ghost College")
      ).to.be.revertedWithCustomError(registry, "ZeroAddressNotAllowed");
    });

    it("Should reject authorizing an empty institution name", async function () {
      await expect(
        registry.connect(owner).authorizeIssuer(issuer1.address, "")
      ).to.be.revertedWithCustomError(registry, "EmptyInstitutionName");
    });

    it("Should reject re-authorizing an already authorized issuer", async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute");
      await expect(
        registry.connect(owner).authorizeIssuer(issuer1.address, "Duplicate College")
      ).to.be.revertedWithCustomError(registry, "IssuerAlreadyAuthorized");
    });

    it("Should allow the owner to revoke an authorized issuer", async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute");
      expect(await registry.totalAuthorizedIssuers()).to.equal(1);

      await expect(registry.connect(owner).revokeIssuer(issuer1.address, "Accreditation expired"))
        .to.emit(registry, "IssuerRevoked");

      expect(await registry.isIssuerAuthorized(issuer1.address)).to.be.false;
      expect(await registry.totalAuthorizedIssuers()).to.equal(0);
    });

    it("Should reject non-owner attempting to revoke an issuer", async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute");
      await expect(
        registry.connect(unauthorizedUser).revokeIssuer(issuer1.address, "Unauthorized action")
      ).to.be.revertedWithCustomError(registry, "NotContractOwner");
    });
  });

  describe("Certificate Registration", function () {
    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute of Technology");
    });

    it("Should allow an authorized issuer to register a certificate", async function () {
      const certRef = "CERT-2026-CS-001";
      await expect(registry.connect(issuer1).registerCertificate(sampleHash1, certRef))
        .to.emit(registry, "CertificateRegistered")
        .withArgs(sampleHash1, issuer1.address, certRef, (await ethers.provider.getBlock("latest")).timestamp + 1);

      expect(await registry.isCertificateRegistered(sampleHash1)).to.be.true;
      expect(await registry.totalCertificatesRegistered()).to.equal(1);
    });

    it("Should reject an unauthorized user attempting to register a certificate", async function () {
      await expect(
        registry.connect(unauthorizedUser).registerCertificate(sampleHash1, "CERT-FAKE-001")
      ).to.be.revertedWithCustomError(registry, "IssuerNotAuthorized");
    });

    it("Should reject registering a zero hash", async function () {
      await expect(
        registry.connect(issuer1).registerCertificate(zeroHash, "CERT-ZERO-001")
      ).to.be.revertedWithCustomError(registry, "ZeroHashNotAllowed");
    });

    it("Should reject registering a duplicate certificate hash", async function () {
      await registry.connect(issuer1).registerCertificate(sampleHash1, "CERT-2026-CS-001");
      await expect(
        registry.connect(issuer1).registerCertificate(sampleHash1, "CERT-2026-CS-001-DUP")
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyRegistered");
    });
  });

  describe("Certificate Query & Verification", function () {
    const certRef = "CERT-2026-CYBER-002";

    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute of Technology");
      await registry.connect(issuer1).registerCertificate(sampleHash2, certRef);
    });

    it("Should return correct certificate metadata for a registered hash", async function () {
      const cert = await registry.getCertificate(sampleHash2);
      expect(cert.hash).to.equal(sampleHash2);
      expect(cert.issuer).to.equal(issuer1.address);
      expect(cert.certificateRef).to.equal(certRef);
      expect(cert.status).to.equal(1); // Active
      expect(cert.isIssuerCurrentlyAuthorized).to.be.true;
      expect(cert.institutionName).to.equal("Apex Institute of Technology");
      expect(cert.registeredAt).to.be.gt(0);
      expect(cert.revokedAt).to.equal(0);
    });

    it("Should revert getCertificate for an unregistered hash", async function () {
      const unregHash = ethers.keccak256(ethers.toUtf8Bytes("Unregistered Document"));
      await expect(registry.getCertificate(unregHash)).to.be.revertedWithCustomError(
        registry,
        "CertificateNotFound"
      );
    });

    it("Should show isIssuerCurrentlyAuthorized as false if the issuer is subsequently revoked", async function () {
      await registry.connect(owner).revokeIssuer(issuer1.address, "Regulatory audit failure");
      const cert = await registry.getCertificate(sampleHash2);
      expect(cert.status).to.equal(1); // Certificate record itself is intact
      expect(cert.isIssuerCurrentlyAuthorized).to.be.false; // Issuer status is now false!
    });
  });

  describe("Certificate Revocation", function () {
    const certRef = "CERT-REVOKE-TEST";

    beforeEach(async function () {
      await registry.connect(owner).authorizeIssuer(issuer1.address, "Apex Institute of Technology");
      await registry.connect(issuer1).registerCertificate(sampleHash1, certRef);
    });

    it("Should allow the issuing institution to revoke its certificate", async function () {
      await expect(
        registry.connect(issuer1).revokeCertificate(sampleHash1, "Administrative error in student grade")
      )
        .to.emit(registry, "CertificateRevoked")
        .withArgs(sampleHash1, issuer1.address, "Administrative error in student grade", (await ethers.provider.getBlock("latest")).timestamp + 1);

      expect(await registry.isCertificateRegistered(sampleHash1)).to.be.false;
      expect(await registry.totalCertificatesRevoked()).to.equal(1);

      const cert = await registry.getCertificate(sampleHash1);
      expect(cert.status).to.equal(2); // Revoked
      expect(cert.revocationReason).to.equal("Administrative error in student grade");
      expect(cert.revokedAt).to.be.gt(0);
    });

    it("Should allow the contract owner/admin to revoke any certificate", async function () {
      await expect(
        registry.connect(owner).revokeCertificate(sampleHash1, "Legal court order")
      ).to.emit(registry, "CertificateRevoked");

      const cert = await registry.getCertificate(sampleHash1);
      expect(cert.status).to.equal(2); // Revoked
      expect(cert.revocationReason).to.equal("Legal court order");
    });

    it("Should reject an unauthorized third party attempting to revoke a certificate", async function () {
      await expect(
        registry.connect(unauthorizedUser).revokeCertificate(sampleHash1, "Malicious attempt")
      ).to.be.revertedWithCustomError(registry, "CannotRevokeCertificate");
    });

    it("Should reject revoking an already revoked certificate", async function () {
      await registry.connect(issuer1).revokeCertificate(sampleHash1, "First revocation");
      await expect(
        registry.connect(issuer1).revokeCertificate(sampleHash1, "Second revocation attempt")
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked");
    });

    it("Should reject revoking a non-existent certificate", async function () {
      const nonExistent = ethers.keccak256(ethers.toUtf8Bytes("Does not exist"));
      await expect(
        registry.connect(issuer1).revokeCertificate(nonExistent, "Reason")
      ).to.be.revertedWithCustomError(registry, "CertificateNotFound");
    });
  });
});
