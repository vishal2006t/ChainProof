import multer from "multer";
import { config } from "../config/index.js";

// Store files in memory buffer for immediate cryptographic hashing without disk footprint
const storage = multer.memoryStorage();

export const uploadCertificate = multer({
  storage: storage,
  limits: {
    fileSize: config.maxUploadSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Basic pre-check on original filename and reported mimetype
    const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");
    const isPdfMime = file.mimetype === "application/pdf" || file.mimetype === "application/octet-stream";

    if (isPdfExt || isPdfMime) {
      cb(null, true);
    } else {
      cb(new Error("Only standard PDF documents (.pdf) are supported."));
    }
  },
});
