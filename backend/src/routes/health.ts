import { Router, Request, Response } from "express";
import { blockchainService } from "../blockchain/blockchainService.js";
import { db } from "../database/db.js";
import { config } from "../config/index.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  let dbStatus = "healthy";
  try {
    db.prepare("SELECT 1").get();
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const chainHealth = await blockchainService.checkHealth();
  let metrics = { totalRegistered: 0, totalRevoked: 0, totalIssuers: 0 };
  if (chainHealth.connected) {
    try {
      metrics = await blockchainService.getMetrics();
    } catch {
      // ignore
    }
  }

  const isOverallHealthy = dbStatus === "healthy" && chainHealth.connected;

  res.status(isOverallHealthy ? 200 : 503).json({
    status: isOverallHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    service: "ChainProof Backend API",
    version: "1.0.0",
    database: {
      status: dbStatus,
      engine: "SQLite (WAL mode)",
    },
    blockchain: {
      connected: chainHealth.connected,
      network: "Hardhat Local (ChainID 31337)",
      rpcUrl: config.rpcUrl,
      contractAddress: blockchainService.contractAddress,
      contractVerified: chainHealth.contractVerified,
      currentBlock: chainHealth.blockNumber,
      metrics,
      error: chainHealth.error,
    },
  });
});

export default router;
