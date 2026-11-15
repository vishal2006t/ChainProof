import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load deployed contract artifact if it exists
let contractAddress = process.env.CONTRACT_ADDRESS || "";
let contractAbi: any[] = [];

const deployedContractPath = path.resolve(__dirname, "../../deployed-contract.json");
if (fs.existsSync(deployedContractPath)) {
  try {
    const rawData = fs.readFileSync(deployedContractPath, "utf-8");
    const parsed = JSON.parse(rawData);
    if (!contractAddress && parsed.contractAddress) {
      contractAddress = parsed.contractAddress;
    }
    if (parsed.abi) {
      contractAbi = parsed.abi;
    }
  } catch (err) {
    console.warn("Could not load deployed-contract.json:", err);
  }
}

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  jwtSecret: process.env.JWT_SECRET || "chainproof_dev_jwt_secret_do_not_use_in_prod_8923489234",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  contractAddress: contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  contractAbi: contractAbi,
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, "../../chainproof.db"),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  
  // Standard development keys from Hardhat local node (Never use real funds!)
  adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  adminWalletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  
  demoIssuerPrivateKey: process.env.DEMO_ISSUER_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  demoIssuerWalletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
};
