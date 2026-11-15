# ChainProof — Blockchain-Based Certificate Verification System

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-green)
![Hardhat](https://img.shields.io/badge/Hardhat-2.29-yellow)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-emerald)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

> **ChainProof** is a production-grade, decentralized credential verification platform developed for college hackathons. It anchors cryptographic **SHA-256 digests** of authentic academic documents to an Ethereum smart contract while keeping **100% of student personal information (PII) off the blockchain**.

---

## 1. Key Engineering Highlights

- **Pure Cryptographic Ground Truth**: File authenticity is determined by mathematical SHA-256 byte matching against authorized on-chain signatures—not probabilistic AI or centralized databases.
- **Strict Access Control**: Anyone can submit an issuer application, but **only administrator-approved college wallets** can execute `registerCertificate()`.
- **Zero On-Chain PII**: Student names, GPAs, and dates of birth are NEVER written to the blockchain, adhering strictly to FERPA and GDPR standards.
- **Magic Byte Validation**: Uploads are strictly verified for `%PDF-` header signatures (`0x25 0x50 0x44 0x46`) directly in memory buffers.
- **University Certificate Generator**: Interactive generator with white-and-gold printable academic template, client-side PDF-1.4 generation, one-click tampered copy simulation, and in-place blockchain verification sandbox.
- **Black & Emerald Glassmorphism**: Designed with a dark interface (`#080B0A`), emerald accents (`#22C55E`), translucent panels, fine borders, and responsive layouts.
- **Printable Receipts**: Generates printable cryptographic receipts with block height, transaction hashes, and verification IDs.

---

## 2. Project Structure

```
ChainProof/
├── blockchain/                      # Hardhat EVM environment
│   ├── contracts/
│   │   └── CertificateRegistry.sol  # Core Solidity smart contract
│   ├── test/
│   │   └── CertificateRegistry.test.js  # 21 unit tests (100% passing)
│   ├── scripts/
│   │   ├── deploy.js               # Contract deployer & artifact generator
│   │   └── test-e2e.js             # 14-step automated E2E lifecycle test
│   └── hardhat.config.js           # Hardhat CJS configuration
├── backend/                         # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── blockchain/             # Ethers.js contract connector
│   │   ├── config/                 # Environment configuration
│   │   ├── database/               # SQLite database & demo seeding
│   │   ├── middleware/             # JWT auth & in-memory Multer upload
│   │   ├── routes/                 # Auth, Admin, Issuer, Verify, Health
│   │   └── utils/                  # SHA-256 byte hasher & PDF validator
│   └── test/
│       └── api.test.ts             # Backend automated test suite
├── frontend/                        # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/             # Navbar, Footer, StatusBadge, Modals
│   │   ├── context/                # AuthContext (JWT management)
│   │   ├── pages/                  # Landing, Verify, Issuer, Admin, Receipt
│   │   └── services/               # API client
│   └── tailwind.config.js          # Black + Emerald green design tokens
├── sample-certificates/             # Pre-generated sample PDFs for demo testing
│   ├── Maya_Chen_CS_Degree_GENUINE.pdf
│   ├── Maya_Chen_CS_Degree_TAMPERED.pdf
│   └── Alex_Rivera_Cyber_UNREGISTERED.pdf
├── docs/                            # In-depth technical architecture
│   ├── ARCHITECTURE.md
│   ├── SECURITY_MODEL.md
│   └── API_SPECIFICATION.md
└── package.json                     # Root orchestrator scripts
```

---

## 3. Quickstart Guide (Kali Linux / Ubuntu)

### Prerequisites
- **Node.js**: v20+ or v24+ (`node -v`)
- **npm**: v10+ or v12+ (`npm -v`)

### Step 1: Start the Local Blockchain Node
Open a terminal in the project root:
```bash
npm run blockchain:node
```
*Starts local Hardhat JSON-RPC node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.*

### Step 2: Deploy the Smart Contract
In a second terminal:
```bash
npm run blockchain:deploy
```
*Deploys `CertificateRegistry.sol`, authorizes the demo issuer (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`), and updates `deployed-contract.json`.*

### Step 3: Start the Backend API
In a third terminal:
```bash
npm run backend:dev
```
*Starts the Express API at `http://localhost:5000` and initializes the SQLite database.*

### Step 4: Start the Frontend UI
In a fourth terminal:
```bash
npm run frontend:dev
```
*Starts the Vite dev server at `http://localhost:5173`.*

Open your browser to: **`http://localhost:5173`**

---

## 4. Pre-Seeded Demo Credentials

For hackathon presentation, the database comes pre-seeded with ready-to-test accounts:

| Role | Email | Password | Linked Wallet | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@chainproof.local` | `AdminPass123!` | `0xf39Fd6...` | Approves/revokes issuers, views audit log |
| **Active College** | `issuer@apex.edu` | `IssuerPass123!` | `0x709979...` | Registers degree certificates on-chain |
| **Pending College**| `registrar@coastal.edu` | `PendingPass123!` | `0x3C44Cd...` | Test admin approval queue |

*Note: One-click autofill buttons are available on the login page.*

---

## 5. End-to-End Demo Walkthrough

### Test Case A: Verify a Genuine Certificate
1. Go to `http://localhost:5173/login` and log in as **Apex University** (`issuer@apex.edu`).
2. In the Issuer Dashboard, upload `sample-certificates/Maya_Chen_CS_Degree_GENUINE.pdf`.
3. Notice the live cryptographic SHA-256 preview:
   `0xb47c74d6e4e59bd4d4743a7768a8994ca798c8d9d4269b15af83b1c87d49e9a0`
4. Enter Student Name: `Maya Chen`, Title: `B.S. in Computer Science`, Reference: `CERT-APEX-2026-001`.
5. Click **Review & Register on Blockchain** -> **Confirm & Sign On-Chain**.
6. The transaction is mined, recording the hash to `CertificateRegistry.sol`.
7. Go to `http://localhost:5173/verify` and upload `Maya_Chen_CS_Degree_GENUINE.pdf`.
8. Status reports: **`VERIFIED`** (Exact byte match, active authorized issuer).
9. Click **Generate Official Receipt** to view and print the cryptographic proof.

### Test Case B: Tampered Certificate Detection
1. On the public verification page (`http://localhost:5173/verify`), upload `sample-certificates/Maya_Chen_CS_Degree_TAMPERED.pdf`.
2. Notice the calculated hash is completely different:
   `0x2410ba95b0b8e5433a38d120219cc91e62ca69538ae98048eaaa327e1a038b32`
3. Status reports: **`NOT REGISTERED`** (Altering even 1 character alters the SHA-256 digest).

### Test Case C: Admin Approval of a New College
1. Log in as System Admin (`admin@chainproof.local` / `AdminPass123!`).
2. Go to the Admin Dashboard: notice **Coastal Technical Institute** in the **Issuer Approval Queue**.
3. Click **Authorize On-Chain**. The admin wallet executes `authorizeIssuer()` on the smart contract.
4. Coastal Technical Institute is now authorized both in the database and on the blockchain!

### Test Case D: Revoking a Certificate
1. In the Issuer Dashboard, find an active certificate in the history table.
2. Click **Revoke** and enter a reason (e.g., "Grade appeal correction").
3. The college wallet signs `revokeCertificate()` on-chain.
4. Verify the document again on `/verify`: status now reports **`REGISTRATION REVOKED`**.

### Test Case E: Certificate Generator & Tamper Detection Sandbox
1. Navigate to **`http://localhost:5173/generate`** (or click **Generate Certificate** in the navbar).
2. Enter your custom student name, institution, degree, and achievement, or click **Fill Sample Data**.
3. Click **Generate Certificate**:
   - Renders a white-and-gold A4 landscape academic certificate template labeled `DEMO SAMPLE — NOT AN OFFICIAL QUALIFICATION`.
   - Generates an authentic PDF-1.4 document with exact `%PDF-` magic bytes.
   - Computes live SHA-256 hash in memory.
4. Click **Download PDF** to save the authentic certificate.
5. Click **Create Tampered Copy**:
   - Generates an altered copy with modified student name (e.g. `[TAMPERED] Mallory Vance`).
   - Labeled `TAMPERED DEMO COPY — MODIFIED FOR VERIFICATION TESTING ONLY`.
   - Computes completely different SHA-256 hash demonstrating the cryptographic avalanche effect.
   - Click **Download Tampered PDF**.
6. **Verification Integration**:
   - Click **Verify Genuine Copy** in the in-page sandbox: returns `NOT REGISTERED` if not yet anchored on-chain.
   - If signed in as `issuer@apex.edu`, click **Anchor Original on Smart Contract (1-Click)** to register it.
   - Re-run **Verify Genuine Copy**: status updates to **`VERIFIED`**.
   - Click **Verify Tampered Copy**: status reports **`HASH MISMATCH / FILE MODIFIED`** (detects forgery against registered reference ID!).

---

## 6. Automated Test Results

Run all test suites across the entire stack:
```bash
npm run test:all
```

### 1. Smart Contract Test Suite (`blockchain/test/CertificateRegistry.test.js`)
- Deployment & Initial State: **2/2 passed**
- Issuer Authorization & Access Control: **7/7 passed**
- Certificate Registration & Duplicate Prevention: **4/4 passed**
- On-Chain Queries & Verification: **3/3 passed**
- Certificate Revocation & Permissions: **5/5 passed**
- **Total: 21 passing (0 failed)**

### 2. Backend Automated Tests (`backend/test/api.test.ts`)
- PDF Magic Byte Verification (`%PDF-`): **3/3 passed**
- SHA-256 Hashing & Normalization: **3/3 passed**
- Database Initialization & Demo Seeds: **1/1 passed**
- **Total: 7 passing (0 failed)**

### 3. Full End-to-End Hardhat Workflow Test (`blockchain/scripts/test-e2e.js`)
- Contract Deployment & Initialization: **1/1 passed**
- On-Chain Issuer Authorization: **1/1 passed**
- PDF Magic Byte & Avalanche Effect Hashing: **2/2 passed**
- Transaction Mining & Duplicate Rejection: **2/2 passed**
- Verification Outcomes (Verified, Not Registered, File Modified, Revoked, Issuer Revoked): **8/8 passed**
- **Total: 14 passing (0 failed)**

### 4. Live Full-Stack System Integration Suite (`scripts/test-live-integration.js`)
- Health & Database State: **1/1 passed**
- Admin Auth & On-Chain Approval: **2/2 passed**
- College Login & SHA-256 Preview: **2/2 passed**
- On-Chain Registration & Duplicate 409: **2/2 passed**
- Multi-Scenario Public Verification: **3/3 passed**
- Security Access Control & 403 Rejection: **1/1 passed**
- Smart Contract Revocations (Cert & Issuer): **2/2 passed**
- Audit Trail Logging: **1/1 passed**
- **Total: 14 passing (0 failed)**

### 5. Certificate Generator & Tamper Test Suite (`scripts/test-certificate-generator.js`)
- Valid PDF-1.4 Generation (%PDF magic bytes): **1/1 passed**
- Tampered Copy Generation & Avalanche Effect: **1/1 passed**
- Unregistered Document Verification (NOT_REGISTERED): **1/1 passed**
- Authorized College On-Chain Registration: **1/1 passed**
- Public Verification of Genuine Copy (VERIFIED): **1/1 passed**
- Public Verification of Tampered Copy (FILE_MODIFIED): **1/1 passed**
- **Total: 6 passing (0 failed)**

**Grand Total Across All Suites: 62 automated checks passing (0 failed).**

---

## 7. Kali Linux Multi-Terminal Run Guide

> **Note on Exact Working Directory Path**:
> The exact absolute path on this machine contains spaces (including a trailing space after `PROJECT` and a space after `MY_KALI_PROJECTS`):
> `"/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "`
> Always use double quotes when navigating to this directory in bash terminals.

To run the complete platform locally on Kali Linux, open 4 terminal tabs:

```bash
# Optional: Set convenience variable in your shell
export CHAINPROOF_DIR="/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "
```

### Terminal 1 — Blockchain Node (JSON-RPC)
```bash
cd "/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "
npm run blockchain:node
```
- **Port**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- *Keeps local EVM state in memory with 20 pre-funded test accounts.*

### Terminal 2 — Deploy Contract
```bash
cd "/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "
npm run blockchain:deploy
```
- Deploys `CertificateRegistry.sol` to localhost network.
- Automatically updates `backend/deployed-contract.json` with the deployed address.
- Authorizes demo issuer (`Apex State University`) on-chain.

### Terminal 3 — Backend API Server
```bash
cd "/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "
npm run backend:dev
```
- **Port**: `http://localhost:5000`
- Connects to SQLite database (`backend/chainproof.db`).
- Interacts with smart contract on `http://127.0.0.1:8545`.

### Terminal 4 — Frontend Vite Dev Server
```bash
cd "/home/vishal/MY_KALI_PROJECTS /ide/ChainProof PROJECT "
npm run frontend:dev
```
- **Port**: `http://localhost:5173`
- Proxies `/api` calls directly to backend port `5000`.

---

## 8. Persistence & Recovery Details

- **Database Persistence**: SQLite is configured in **WAL (Write-Ahead Logging) mode**. All registered certificates, issuer application records, user accounts, and security audit logs are stored on disk in `backend/chainproof.db` and persist across backend restarts and system shutdowns.
- **Blockchain Volatility Note**: The local Hardhat development node (`npx hardhat node`) runs an in-memory blockchain. If the Hardhat node terminal is stopped or the computer powers off, re-run `npm run blockchain:node` followed by `npm run blockchain:deploy` to redeploy the contract and re-synchronize contract state.
- **Environment Variables**: Managed via `.env` and `.env.example` templates. All secret keys, private keys, and sensitive database files are strictly excluded from source control via `.gitignore`.

