# ChainProof Architecture & Technical Specification

ChainProof is a decentralized, tamper-evident certificate verification system that anchors SHA-256 cryptographic hashes of digital credentials to an Ethereum smart contract.

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Frontend (React 18 + Vite + Tailwind CSS)"]
        UI_Verify["Public Verification Portal\n(/verify)"]
        UI_Issuer["College Issuer Dashboard\n(/issuer)"]
        UI_Admin["Admin Authorization Panel\n(/admin)"]
        UI_Receipt["Cryptographic Receipt Viewer\n(/receipt)"]
    end

    subgraph Backend ["Backend API (Node.js + Express + TypeScript)"]
        AuthMid["JWT Auth & Role Guard\n(Admin / Issuer / Public)"]
        FileHash["Magic Bytes (%PDF-) Validator &\nSHA-256 Hashing Engine"]
        SQLiteDB[("Local SQLite Database\n(Users, Registrations, Audit Trail)")]
        ChainService["Blockchain RPC Service\n(Ethers.js v6)"]
    end

    subgraph Blockchain ["Ethereum Blockchain (Hardhat EVM #31337)"]
        Contract["CertificateRegistry.sol\n- authorizeIssuer()\n- registerCertificate()\n- revokeCertificate()\n- getCertificate()"]
        Events["On-Chain Events\n- IssuerAuthorized\n- CertificateRegistered\n- CertificateRevoked"]
    end

    UI_Verify -->|Uploads PDF / Enters Hash| FileHash
    UI_Issuer -->|Submits Degree PDF| FileHash
    UI_Admin -->|Approves Pending College| AuthMid

    FileHash -->|Computes bytes32 Digest| ChainService
    ChainService -->|Executes Smart Contract Calls| Contract
    Contract -->|Emits Audit Events| Events

    AuthMid -->|Persists Non-Sensitive Metadata| SQLiteDB
    ChainService -->|Reads Status & Timestamps| Contract
    ChainService -->|Returns Proof Receipt| UI_Receipt
```

---

## 2. Core Components

### A. Smart Contract (`CertificateRegistry.sol`)
- **Language**: Solidity `^0.8.24` (EVM target: Paris)
- **Framework**: Hardhat 2.29
- **Access Control**: Owner / Administrator and authorized college issuers.
- **Gas Optimization**: Uses custom Solidity errors (`UnauthorizedCaller()`, `ZeroAddressNotAllowed()`, `CertificateAlreadyRegistered()`, etc.) instead of verbose revert strings.
- **Privacy Design**: Absolutely zero Personally Identifiable Information (PII) is stored in contract state or event logs.

### B. Backend API (`backend/`)
- **Runtime**: Node.js v24 LTS + Express + TypeScript
- **Hashing Engine**: Uses `crypto.createHash('sha256')` directly against raw file buffers.
- **Security Check**: Enforces magic byte verification (`0x25 0x50 0x44 0x46` for `%PDF-`). Spoofed text files renamed to `.pdf` are rejected before hashing.
- **Database**: SQLite in Write-Ahead Logging (`WAL`) mode via `better-sqlite3`. Stores user credentials (bcrypt hashed), issuer accreditation records, and offline registration references.

### C. Frontend Web Application (`frontend/`)
- **Framework**: React 18, Vite 5, TypeScript
- **Styling**: Tailwind CSS with customized black-and-emerald glassmorphism palette (`#080B0A` background, `#22C55E` accent, translucent panels, fine borders).
- **Icons**: Lucide React.
- **Print Layout**: Custom `@media print` styling for offline verification receipts.

---

## 3. Cryptographic State Machine

```mermaid
stateDiagram-v2
    [*] --> Unregistered: File uploaded
    Unregistered --> Active: College signs registerCertificate(hash, ref)
    Active --> Revoked: Issuer or Admin signs revokeCertificate(hash, reason)
    Active --> Verified: Public Verifier uploads matching PDF
    Active --> IssuerRevoked: College accreditation revoked on-chain
```
