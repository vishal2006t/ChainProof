# ChainProof — Blockchain-Based Certificate Verification System

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-green)
![Hardhat](https://img.shields.io/badge/Hardhat-2.29-yellow)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-emerald)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

> **ChainProof** is a decentralized certificate verification platform that uses blockchain technology and SHA-256 cryptographic hashing to verify academic document authenticity while keeping student personal information off-chain.

---

## 1. Key Engineering Highlights

- **SHA-256 Verification:** Verifies document authenticity through cryptographic hash matching.
- **Blockchain Security:** Stores certificate hashes on an Ethereum smart contract.
- **Access Control:** Only administrator-approved college wallets can register certificates.
- **Privacy Protection:** Student personal information remains off-chain.
- **PDF Validation:** Validates uploaded PDF files using magic-byte signatures.
- **Certificate Generator:** Generates sample academic certificates and tampered copies for demonstration.
- **Modern UI:** Black and emerald-green glassmorphism design.
- **Verification Receipts:** Provides transaction details and cryptographic verification information.

---

## 2. Project Structure

```text
ChainProof/
├── blockchain/
│   ├── contracts/
│   ├── test/
│   └── scripts/
├── backend/
│   ├── src/
│   └── test/
├── frontend/
│   └── src/
├── sample-certificates/
├── docs/
├── scripts/
└── package.json
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Blockchain | Solidity, Hardhat, Ethers.js |
| Cryptography | SHA-256 |
| Database | SQLite |
| Development | Git, GitHub, Kali Linux, Windows |

---

## 4. Run Locally

### Prerequisites

- Node.js 20+
- npm 10+

Install dependencies in the project root and each subproject:

```bash
npm install
cd blockchain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

Return to the project root:

```bash
cd ..
```

### Start the Blockchain

```bash
npm run blockchain:node
```

### Deploy the Smart Contract

In another terminal:

```bash
npm run blockchain:deploy
```

### Start the Backend

```bash
npm run backend:dev
```

### Start the Frontend

```bash
npm run frontend:dev
```

Open:

```text
http://localhost:5173
```

---

## 5. Automated Testing

Run the available test suites using:

```bash
npm run test:all
```

The project includes smart contract, backend, integration, and certificate verification tests.

---

## 6. Security and Privacy

- Certificate verification uses SHA-256 hash matching.
- Student personal information is not stored on-chain.
- Smart contract functions enforce issuer authorization.
- Uploaded PDF files undergo format validation.
- Environment secrets and private keys must remain outside version control.

---

## 7. Project Purpose

ChainProof aims to make academic certificate verification more transparent, secure, and reliable by combining blockchain-based integrity records with cryptographic document verification.

**Note:** This project is a demonstration platform developed for educational and hackathon purposes. Use test accounts and a local blockchain for development.

---

## License

MIT License.
