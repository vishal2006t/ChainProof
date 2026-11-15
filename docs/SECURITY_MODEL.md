# ChainProof Security & Threat Model

## 1. Core Threat Model

### Threat 1: Credential Forgery & PDF Modification
- **Vector**: A student modifies a legitimate PDF using editing software (e.g., changing a "C" grade to an "A", or modifying the recipient name).
- **Defense**: SHA-256 cryptographic hashing demonstrates the *avalanche effect*. Altering even a single bit or character in the PDF creates a completely distinct 256-bit digest. When the employer uploads the altered document, the backend hashes the file and queries the smart contract. The hash does not exist in the contract registry, returning `NOT_REGISTERED`.

### Threat 2: Malicious Entity Posing as a University
- **Vector**: An attacker creates an account and attempts to register certificates for high-profile institutions.
- **Defense**: 
  1. Signup does not grant issuing rights. All issuer registrations default to `pending`.
  2. The smart contract enforces `onlyAuthorizedIssuer`. The contract owner must sign an `authorizeIssuer(walletAddress, name)` transaction.
  3. Attempting to call `registerCertificate` from an unauthorized address immediately reverts with custom error `IssuerNotAuthorized()`.

### Threat 3: Student Privacy Violations (FERPA / GDPR)
- **Vector**: Naive blockchain implementations store student names, grades, and birthdates permanently on public distributed ledgers.
- **Defense**: 
  1. Zero PII is stored on-chain.
  2. Only the 32-byte cryptographic hash (`bytes32 certHash`), the issuer wallet address (`address issuer`), and an opaque public reference ID (`string certificateRef`) are stored in the smart contract or emitted in events.
  3. The PDF is stored off-chain by the student and institution. Verification occurs by rehashing the file in-memory.

### Threat 4: Institution Loses Accreditation or Issues Fraudulent Diplomas
- **Vector**: An authorized institution has its accreditation revoked by state regulators.
- **Defense**: 
  1. The administrator calls `revokeIssuer(issuerWallet, reason)` on the smart contract.
  2. The contract sets `issuers[issuerWallet].isAuthorized = false`.
  3. When an employer queries a certificate previously issued by this entity, the verification endpoint reads `isIssuerCurrentlyAuthorized` from the contract and flags the credential as `ISSUER_REVOKED`.

---

## 2. Cryptographic Validation Pipeline

1. **File Ingestion**: Uploaded via multipart form-data directly into memory buffer (RAM). No temporary files left uncleaned on disk.
2. **Signature Check**: Buffer bytes `[0..3]` must match `%PDF` (`0x25 0x50 0x44 0x46`). Spoofed `.pdf` filenames with executable or text payloads are rejected with HTTP 400.
3. **Digest Calculation**: `crypto.createHash('sha256').update(buffer).digest('hex')` generates a 64-character hex string, formatted as `0x${hex}` for EVM `bytes32`.
4. **On-Chain Query**: `CertificateRegistry.getCertificate(bytes32)` queries Ethereum state via JSON-RPC.
5. **Outcome Determination**:
   - `VERIFIED`: Hash exists, status is Active (1), and issuing college wallet is active.
   - `NOT_REGISTERED`: Hash does not exist in contract storage.
   - `FILE_MODIFIED`: Hash does not match expected reference hash.
   - `REGISTRATION_REVOKED`: Status is Revoked (2).
   - `ISSUER_REVOKED`: College authorization was revoked post-issuance.
   - `VERIFICATION_ERROR`: RPC or node unreachable.
