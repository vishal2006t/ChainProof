# ChainProof REST API & Smart Contract Specification

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Request Body**:
  ```json
  { "email": "admin@chainproof.local", "password": "AdminPass123!" }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "admin@chainproof.local",
      "role": "admin",
      "institutionName": "ChainProof System Administration",
      "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "status": "active"
    }
  }
  ```

### `POST /api/auth/register-issuer`
- **Request Body**:
  ```json
  {
    "institutionName": "Coastal Technical Institute",
    "accreditationNumber": "EDU-ACCRED-CTI-9102",
    "email": "registrar@coastal.edu",
    "password": "Password123!",
    "walletAddress": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Application submitted successfully. An administrator will review your institutional credentials.",
    "status": "pending"
  }
  ```

---

## 2. Certificate Registration & Verification Endpoints

### `POST /api/certificates/preview-hash`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `multipart/form-data` with `certificateFile` (PDF)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "fileName": "degree.pdf",
      "fileSizeBytes": 15420,
      "sha256Hex": "b47c74d6e4e59bd4d4743a7768a8994ca798c8d9d4269b15af83b1c87d49e9a0",
      "bytes32": "0xb47c74d6e4e59bd4d4743a7768a8994ca798c8d9d4269b15af83b1c87d49e9a0",
      "isValidPdf": true,
      "alreadyRegistered": false
    }
  }
  ```

### `POST /api/certificates/register`
- **Headers**: `Authorization: Bearer <token>` (Issuer role required)
- **Body**: `multipart/form-data`
  - `certificateFile`: PDF file
  - `studentName`: "Maya Chen"
  - `certificateType`: "Bachelor of Science in Computer Science"
  - `certificateRef`: "CERT-APEX-2026-001"
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "message": "Certificate registered successfully and anchored on blockchain.",
    "data": {
      "id": 1,
      "certHash": "0xb47c74...",
      "certificateRef": "CERT-APEX-2026-001",
      "txHash": "0x54328c9d4...",
      "blockNumber": 3,
      "registeredAt": "2026-10-21T07:08:36.000Z",
      "status": "active"
    }
  }
  ```

### `POST /api/verify` (Public)
- **Body**: `multipart/form-data` with `certificateFile` (or JSON `{ "certHash": "0x..." }`)
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "verificationId": "CP-M8A2-89B",
      "verifiedAt": "2026-10-21T07:15:00.000Z",
      "outcome": "VERIFIED",
      "outcomeTitle": "Certificate Authenticated",
      "explanation": "Cryptographic integrity confirmed: The uploaded document's SHA-256 hash matches an active record registered by an authorized institution.",
      "fileDetails": {
        "fileName": "Maya_Chen_CS_Degree_GENUINE.pdf",
        "bytes32": "0xb47c74d6e4e59bd4d4743a7768a8994ca798c8d9d4269b15af83b1c87d49e9a0"
      },
      "onChainRecord": {
        "found": true,
        "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "issuerAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "institutionName": "Apex State University",
        "certificateRef": "CERT-APEX-2026-001",
        "statusLabel": "Active",
        "isIssuerCurrentlyAuthorized": true
      }
    }
  }
  ```
