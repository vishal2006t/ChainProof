// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CertificateRegistry
 * @dev On-chain registry for cryptographic certificate verification.
 * Only authorized issuers can register cryptographic certificate hashes.
 * Stores minimal metadata (hash, issuer, opaque reference, status, timestamp).
 * Zero personal identifiable information (PII) is stored on-chain.
 */
contract CertificateRegistry {
    // --- Custom Errors (Gas-efficient) ---
    error UnauthorizedCaller();
    error NotContractOwner();
    error ZeroAddressNotAllowed();
    error ZeroHashNotAllowed();
    error EmptyInstitutionName();
    error IssuerAlreadyAuthorized();
    error IssuerNotAuthorized();
    error CertificateAlreadyRegistered();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();
    error CannotRevokeCertificate();

    // --- Enums & Structs ---
    enum CertificateStatus {
        None,     // 0: Not registered
        Active,   // 1: Valid active certificate
        Revoked   // 2: Revoked by issuer or admin
    }

    struct IssuerInfo {
        bool isAuthorized;
        string institutionName;
        uint256 authorizedAt;
        uint256 revokedAt;
    }

    struct CertificateRecord {
        bytes32 certHash;             // SHA-256 hash of the certificate PDF
        address issuer;               // Wallet address of the registering institution
        string certificateRef;        // Opaque reference / ID (e.g., "CERT-2026-904")
        CertificateStatus status;     // Active or Revoked
        uint256 registeredAt;         // Unix timestamp of registration
        uint256 revokedAt;            // Unix timestamp of revocation (0 if active)
        string revocationReason;      // Reason for revocation if applicable
    }

    // --- State Variables ---
    address public owner;
    
    // Mapping from issuer wallet address to IssuerInfo
    mapping(address => IssuerInfo) public issuers;
    
    // Mapping from certificate SHA-256 hash to CertificateRecord
    mapping(bytes32 => CertificateRecord) private _certificates;

    // Track total counts for metrics
    uint256 public totalCertificatesRegistered;
    uint256 public totalCertificatesRevoked;
    uint256 public totalAuthorizedIssuers;

    // --- Events ---
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event IssuerAuthorized(address indexed issuer, string institutionName, uint256 timestamp);
    event IssuerRevoked(address indexed issuer, string reason, uint256 timestamp);
    event CertificateRegistered(
        bytes32 indexed certHash,
        address indexed issuer,
        string certificateRef,
        uint256 registeredAt
    );
    event CertificateRevoked(
        bytes32 indexed certHash,
        address indexed revokedBy,
        string reason,
        uint256 revokedAt
    );

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotContractOwner();
        _;
    }

    modifier onlyAuthorizedIssuer() {
        if (!issuers[msg.sender].isAuthorized) revert IssuerNotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ==========================================
    //            ADMIN FUNCTIONS
    // ==========================================

    /**
     * @notice Authorize an educational institution / college issuer wallet.
     * @param issuer Wallet address of the institution
     * @param institutionName Name of the institution
     */
    function authorizeIssuer(address issuer, string calldata institutionName) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddressNotAllowed();
        if (bytes(institutionName).length == 0) revert EmptyInstitutionName();
        if (issuers[issuer].isAuthorized) revert IssuerAlreadyAuthorized();

        issuers[issuer] = IssuerInfo({
            isAuthorized: true,
            institutionName: institutionName,
            authorizedAt: block.timestamp,
            revokedAt: 0
        });

        totalAuthorizedIssuers++;
        emit IssuerAuthorized(issuer, institutionName, block.timestamp);
    }

    /**
     * @notice Revoke future issuance rights of an issuer.
     * @dev Does not automatically invalidate past certificates unless individually revoked.
     * @param issuer Wallet address to revoke
     * @param reason Reason for revocation
     */
    function revokeIssuer(address issuer, string calldata reason) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddressNotAllowed();
        if (!issuers[issuer].isAuthorized) revert IssuerNotAuthorized();

        issuers[issuer].isAuthorized = false;
        issuers[issuer].revokedAt = block.timestamp;
        
        if (totalAuthorizedIssuers > 0) {
            totalAuthorizedIssuers--;
        }

        emit IssuerRevoked(issuer, reason, block.timestamp);
    }

    /**
     * @notice Transfer ownership of the contract.
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressNotAllowed();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ==========================================
    //           ISSUER FUNCTIONS
    // ==========================================

    /**
     * @notice Register a certificate SHA-256 hash on-chain.
     * @param certHash SHA-256 hash of the certificate file (bytes32)
     * @param certificateRef Opaque reference identifier (no PII)
     */
    function registerCertificate(bytes32 certHash, string calldata certificateRef) external onlyAuthorizedIssuer {
        if (certHash == bytes32(0)) revert ZeroHashNotAllowed();
        if (_certificates[certHash].status != CertificateStatus.None) {
            revert CertificateAlreadyRegistered();
        }

        _certificates[certHash] = CertificateRecord({
            certHash: certHash,
            issuer: msg.sender,
            certificateRef: certificateRef,
            status: CertificateStatus.Active,
            registeredAt: block.timestamp,
            revokedAt: 0,
            revocationReason: ""
        });

        totalCertificatesRegistered++;

        emit CertificateRegistered(certHash, msg.sender, certificateRef, block.timestamp);
    }

    /**
     * @notice Revoke a previously registered certificate.
     * Can only be called by the original issuer or the contract owner.
     * @param certHash SHA-256 hash of the certificate to revoke
     * @param reason Revocation reason
     */
    function revokeCertificate(bytes32 certHash, string calldata reason) external {
        CertificateRecord storage cert = _certificates[certHash];
        if (cert.status == CertificateStatus.None) revert CertificateNotFound();
        if (cert.status == CertificateStatus.Revoked) revert CertificateAlreadyRevoked();

        // Only the original issuer or the contract owner can revoke
        if (msg.sender != cert.issuer && msg.sender != owner) {
            revert CannotRevokeCertificate();
        }

        cert.status = CertificateStatus.Revoked;
        cert.revokedAt = block.timestamp;
        cert.revocationReason = reason;

        totalCertificatesRevoked++;

        emit CertificateRevoked(certHash, msg.sender, reason, block.timestamp);
    }

    // ==========================================
    //            PUBLIC / QUERY VIEWS
    // ==========================================

    /**
     * @notice Check if an issuer address is currently authorized.
     */
    function isIssuerAuthorized(address issuer) external view returns (bool) {
        return issuers[issuer].isAuthorized;
    }

    /**
     * @notice Retrieve issuer details.
     */
    function getIssuer(address issuer) external view returns (
        bool isAuthorized,
        string memory institutionName,
        uint256 authorizedAt,
        uint256 revokedAt
    ) {
        IssuerInfo memory info = issuers[issuer];
        return (info.isAuthorized, info.institutionName, info.authorizedAt, info.revokedAt);
    }

    /**
     * @notice Quick boolean check whether a certificate hash is registered and active.
     */
    function isCertificateRegistered(bytes32 certHash) external view returns (bool) {
        return _certificates[certHash].status == CertificateStatus.Active;
    }

    /**
     * @notice Retrieve the full verification record for a certificate hash.
     * @param certHash SHA-256 hash of certificate
     */
    function getCertificate(bytes32 certHash) external view returns (
        bytes32 hash,
        address issuer,
        string memory certificateRef,
        CertificateStatus status,
        uint256 registeredAt,
        uint256 revokedAt,
        string memory revocationReason,
        bool isIssuerCurrentlyAuthorized,
        string memory institutionName
    ) {
        CertificateRecord memory cert = _certificates[certHash];
        if (cert.status == CertificateStatus.None) {
            revert CertificateNotFound();
        }

        IssuerInfo memory issuerInfo = issuers[cert.issuer];

        return (
            cert.certHash,
            cert.issuer,
            cert.certificateRef,
            cert.status,
            cert.registeredAt,
            cert.revokedAt,
            cert.revocationReason,
            issuerInfo.isAuthorized,
            issuerInfo.institutionName
        );
    }
}
