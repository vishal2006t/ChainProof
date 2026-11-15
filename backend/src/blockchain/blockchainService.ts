import { ethers } from "ethers";
import { config } from "../config/index.js";

// Minimal ABI fallback if deployed-contract.json was not yet copied
const fallbackAbi = [
  "function owner() view returns (address)",
  "function totalCertificatesRegistered() view returns (uint256)",
  "function totalCertificatesRevoked() view returns (uint256)",
  "function totalAuthorizedIssuers() view returns (uint256)",
  "function authorizeIssuer(address issuer, string institutionName)",
  "function revokeIssuer(address issuer, string reason)",
  "function isIssuerAuthorized(address issuer) view returns (bool)",
  "function getIssuer(address issuer) view returns (bool isAuthorized, string institutionName, uint256 authorizedAt, uint256 revokedAt)",
  "function registerCertificate(bytes32 certHash, string certificateRef)",
  "function revokeCertificate(bytes32 certHash, string reason)",
  "function isCertificateRegistered(bytes32 certHash) view returns (bool)",
  "function getCertificate(bytes32 certHash) view returns (bytes32 hash, address issuer, string certificateRef, uint8 status, uint256 registeredAt, uint256 revokedAt, string revocationReason, bool isIssuerCurrentlyAuthorized, string institutionName)",
  "event CertificateRegistered(bytes32 indexed certHash, address indexed issuer, string certificateRef, uint256 registeredAt)",
  "event CertificateRevoked(bytes32 indexed certHash, address indexed revokedBy, string reason, uint256 revokedAt)",
  "event IssuerAuthorized(address indexed issuer, string institutionName, uint256 timestamp)",
  "event IssuerRevoked(address indexed issuer, string reason, uint256 timestamp)"
];

export interface OnChainCertificateResult {
  found: boolean;
  certHash?: string;
  issuer?: string;
  certificateRef?: string;
  status?: number; // 0: None, 1: Active, 2: Revoked
  statusLabel?: "Active" | "Revoked" | "None";
  registeredAt?: number;
  revokedAt?: number;
  revocationReason?: string;
  isIssuerCurrentlyAuthorized?: boolean;
  institutionName?: string;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private abi: any[];
  public contractAddress: string;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contractAddress = config.contractAddress;
    this.abi = config.contractAbi && config.contractAbi.length > 0 ? config.contractAbi : fallbackAbi;
  }

  /**
   * Helper to get a read-only contract instance
   */
  public getReadOnlyContract(): ethers.Contract {
    return new ethers.Contract(this.contractAddress, this.abi, this.provider);
  }

  /**
   * Helper to get a write-capable contract instance with a signer
   */
  public getSignerContract(privateKey: string): ethers.Contract {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    return new ethers.Contract(this.contractAddress, this.abi, wallet);
  }

  /**
   * Test RPC connection and contract availability
   */
  public async checkHealth(): Promise<{ connected: boolean; blockNumber?: number; contractVerified?: boolean; error?: string }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const code = await this.provider.getCode(this.contractAddress);
      const contractVerified = code !== "0x" && code !== "0x0";
      return {
        connected: true,
        blockNumber,
        contractVerified,
      };
    } catch (err: any) {
      return {
        connected: false,
        error: err.message || "Failed to connect to Ethereum RPC",
      };
    }
  }

  /**
   * Query certificate record directly from smart contract
   */
  public async queryCertificate(certHash: string): Promise<OnChainCertificateResult> {
    try {
      const contract = this.getReadOnlyContract();
      const res = await contract.getCertificate(certHash);

      const statusNum = Number(res[3]);
      const statusLabel = statusNum === 1 ? "Active" : statusNum === 2 ? "Revoked" : "None";

      return {
        found: true,
        certHash: res[0],
        issuer: res[1],
        certificateRef: res[2],
        status: statusNum,
        statusLabel: statusLabel,
        registeredAt: Number(res[4]),
        revokedAt: Number(res[5]),
        revocationReason: res[6],
        isIssuerCurrentlyAuthorized: Boolean(res[7]),
        institutionName: res[8],
      };
    } catch (err: any) {
      // Check if custom error CertificateNotFound
      const errMsg = String(err.message || "");
      if (
        errMsg.includes("CertificateNotFound") ||
        errMsg.includes("0x123") || // contract custom error
        errMsg.includes("revert") ||
        errMsg.includes("CALL_EXCEPTION")
      ) {
        return { found: false };
      }
      throw err;
    }
  }

  /**
   * Query issuer authorization details from smart contract
   */
  public async getIssuerInfo(issuerAddress: string): Promise<{ isAuthorized: boolean; institutionName: string; authorizedAt: number; revokedAt: number }> {
    const contract = this.getReadOnlyContract();
    const res = await contract.getIssuer(issuerAddress);
    return {
      isAuthorized: Boolean(res[0]),
      institutionName: res[1],
      authorizedAt: Number(res[2]),
      revokedAt: Number(res[3]),
    };
  }

  /**
   * Get overall on-chain metrics
   */
  public async getMetrics(): Promise<{ totalRegistered: number; totalRevoked: number; totalIssuers: number }> {
    try {
      const contract = this.getReadOnlyContract();
      const [totalReg, totalRev, totalIss] = await Promise.all([
        contract.totalCertificatesRegistered(),
        contract.totalCertificatesRevoked(),
        contract.totalAuthorizedIssuers(),
      ]);
      return {
        totalRegistered: Number(totalReg),
        totalRevoked: Number(totalRev),
        totalIssuers: Number(totalIss),
      };
    } catch (err) {
      return { totalRegistered: 0, totalRevoked: 0, totalIssuers: 0 };
    }
  }

  /**
  /**
   * Helper to get a write-capable contract instance with a signer and latest pending nonce
   */
  public async getSignerWithNonce(privateKey: string): Promise<{ contract: ethers.Contract; nonce: number }> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const hexCount = await this.provider.send("eth_getTransactionCount", [wallet.address, "pending"]);
    const nonce = parseInt(hexCount, 16);
    const contract = new ethers.Contract(this.contractAddress, this.abi, wallet);
    return { contract, nonce };
  }

  /**
   * Authorize an issuer on-chain (Admin signed transaction)
   */
  public async authorizeIssuerOnChain(
    issuerAddress: string,
    institutionName: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    const { contract, nonce } = await this.getSignerWithNonce(config.adminPrivateKey);
    const tx = await contract.authorizeIssuer(issuerAddress, institutionName, { nonce });
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Revoke an issuer on-chain (Admin signed transaction)
   */
  public async revokeIssuerOnChain(
    issuerAddress: string,
    reason: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    const { contract, nonce } = await this.getSignerWithNonce(config.adminPrivateKey);
    const tx = await contract.revokeIssuer(issuerAddress, reason, { nonce });
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Register a certificate hash on-chain
   */
  public async registerCertificateOnChain(
    certHash: string,
    certificateRef: string,
    issuerPrivateKey: string = config.demoIssuerPrivateKey
  ): Promise<{ txHash: string; blockNumber: number; registeredAt: number }> {
    const { contract, nonce } = await this.getSignerWithNonce(issuerPrivateKey);
    const tx = await contract.registerCertificate(certHash, certificateRef, { nonce });
    const receipt = await tx.wait();
    
    // Retrieve timestamp of mined block
    const block = await this.provider.getBlock(receipt.blockNumber);
    const registeredAt = block ? block.timestamp : Math.floor(Date.now() / 1000);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      registeredAt,
    };
  }

  /**
   * Revoke a certificate on-chain
   */
  public async revokeCertificateOnChain(
    certHash: string,
    reason: string,
    signerPrivateKey: string = config.demoIssuerPrivateKey
  ): Promise<{ txHash: string; blockNumber: number; revokedAt: number }> {
    const { contract, nonce } = await this.getSignerWithNonce(signerPrivateKey);
    const tx = await contract.revokeCertificate(certHash, reason, { nonce });
    const receipt = await tx.wait();

    const block = await this.provider.getBlock(receipt.blockNumber);
    const revokedAt = block ? block.timestamp : Math.floor(Date.now() / 1000);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      revokedAt,
    };
  }
}

export const blockchainService = new BlockchainService();
