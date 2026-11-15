import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, Upload, FileCheck, CheckCircle2, 
  AlertTriangle, XCircle, ShieldAlert, Copy, Check, 
  RefreshCw, ArrowRight, Printer, FileText, Hash, Award 
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [verifyMode, setVerifyMode] = useState<"file" | "hash">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hashInput, setHashInput] = useState<string>("");
  const [expectedHash, setExpectedHash] = useState<string>("");
  const [expectedRef, setExpectedRef] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // If URL has ?hash=..., verify immediately
  useEffect(() => {
    const queryHash = searchParams.get("hash");
    if (queryHash) {
      setHashInput(queryHash);
      setVerifyMode("hash");
      executeVerification(undefined, queryHash);
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setVerificationResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Only authentic PDF documents (.pdf) can be verified.");
        return;
      }
      setSelectedFile(file);
      setError(null);
      setVerificationResult(null);
    }
  };

  const executeVerification = async (fileToVerify?: File, hashToVerify?: string) => {
    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      let res;
      if (fileToVerify) {
        res = await api.verifyCertificateFile(fileToVerify, expectedHash || undefined, expectedRef || undefined);
      } else if (hashToVerify) {
        res = await api.verifyCertificateHash(hashToVerify, expectedHash || undefined);
      } else {
        throw new Error("Please select a file or provide a SHA-256 hash.");
      }

      setVerificationResult(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to complete certificate verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyMode === "file") {
      if (!selectedFile) {
        setError("Please choose a PDF certificate file to verify.");
        return;
      }
      executeVerification(selectedFile);
    } else {
      if (!hashInput.trim()) {
        setError("Please enter a SHA-256 hash digest.");
        return;
      }
      executeVerification(undefined, hashInput.trim());
    }
  };

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewReceipt = () => {
    if (!verificationResult) return;
    sessionStorage.setItem("last_verification_receipt", JSON.stringify(verificationResult));
    navigate("/receipt");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Independent Verifier Portal</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Verify Certificate Authenticity</h1>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto">
          Upload any digital certificate to compute its cryptographic hash and check its status against the Ethereum smart contract registry.
        </p>
      </div>

      {/* Certificate Generator Demo Callout */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-[#D4AF37]/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div>
            <p className="font-semibold text-white">Need demo certificates to test?</p>
            <p className="text-neutral-400 text-[11px]">Generate genuine white-and-gold academic certificates or simulation tampered copies.</p>
          </div>
        </div>
        <Link
          to="/generate"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors font-medium inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <span>Open Certificate Generator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Verification Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => { setVerifyMode("file"); setError(null); }}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              verifyMode === "file"
                ? "bg-emerald-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Upload Certificate PDF
          </button>
          <button
            type="button"
            onClick={() => { setVerifyMode("hash"); setError(null); }}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
              verifyMode === "hash"
                ? "bg-emerald-600 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Query by SHA-256 Hash
          </button>
        </div>
      </div>

      {/* Verification Input Card */}
      <div className="glass-panel p-6 sm:p-8 border-emerald-500/20 shadow-2xl">
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {verifyMode === "file" ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-emerald-500/25 hover:border-emerald-500/50 rounded-xl p-8 text-center bg-[#0B0F0D]/70 transition-colors"
            >
              <input
                type="file"
                id="verify-file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="verify-file" className="cursor-pointer block space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs text-neutral-300">
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-emerald-400">{selectedFile.name}</div>
                      <div className="text-[11px] text-neutral-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for verification</div>
                    </div>
                  ) : (
                    <span>Drag and drop certificate PDF here, or click to browse</span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500">
                  Calculates exact SHA-256 digest in memory • Checked against smart contract
                </p>
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Certificate SHA-256 Hash Digest (64 hex characters or 0x...)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  placeholder="0x9a8f4c... or a1b2c3d4..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input font-mono"
                />
              </div>
            </div>
          )}

          {/* Optional Test for Tamper Mismatch */}
          <div className="pt-2 border-t border-neutral-800/80">
            <details className="text-xs text-neutral-400">
              <summary className="cursor-pointer font-medium hover:text-emerald-400 transition-colors">
                Advanced Test: Compare against expected Certificate ID or SHA-256 Hash
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Expected Certificate ID (checks on-chain registry for tamper modification):
                  </label>
                  <input
                    type="text"
                    value={expectedRef}
                    onChange={(e) => setExpectedRef(e.target.value)}
                    placeholder="e.g. CERT-APEX-2026-001 or CERT-DEMO-2026-..."
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono text-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Expected SHA-256 Hash (direct byte integrity check):
                  </label>
                  <input
                    type="text"
                    value={expectedHash}
                    onChange={(e) => setExpectedHash(e.target.value)}
                    placeholder="Optional: Enter 64-hex SHA-256 hash..."
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono text-neutral-300"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  If provided, ChainProof will report HASH MISMATCH / FILE MODIFIED if the uploaded document does not match the registered baseline.
                </p>
              </div>
            </details>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 ${
              loading ? "opacity-60 cursor-wait" : ""
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Ethereum Smart Contract...</span>
              </>
            ) : (
              <>
                <span>Perform Cryptographic Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="glass-panel p-6 sm:p-8 border-emerald-500/25 space-y-6 shadow-2xl animate-in fade-in duration-300">
          {/* Outcome Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={verificationResult.outcome} size="lg" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                {verificationResult.outcomeTitle}
              </h3>
            </div>

            <button
              onClick={viewReceipt}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/30 text-emerald-400 text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Official Receipt</span>
            </button>
          </div>

          {/* Explanation Text */}
          <div className="p-4 rounded-xl bg-[#0B0F0D] border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
            {verificationResult.explanation}
          </div>

          {/* Cryptographic Details Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">File & Hash Details</div>
              {verificationResult.fileDetails?.fileName && (
                <div className="flex justify-between text-neutral-300">
                  <span className="text-neutral-500">File Name:</span>
                  <span className="font-medium truncate max-w-[180px]">{verificationResult.fileDetails.fileName}</span>
                </div>
              )}
              <div className="space-y-1 pt-1">
                <span className="text-neutral-500 text-[11px] block">Calculated SHA-256 Digest:</span>
                <div className="p-2 rounded bg-black border border-neutral-800 font-mono text-[11px] text-emerald-400 break-all flex items-center justify-between gap-2">
                  <span>{verificationResult.fileDetails?.bytes32}</span>
                  <button
                    onClick={() => copyHash(verificationResult.fileDetails?.bytes32)}
                    className="p-1 text-neutral-500 hover:text-emerald-400 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Blockchain Record</div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Smart Contract:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[180px]">
                  {verificationResult.onChainRecord?.contractAddress}
                </span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Registered Institution:</span>
                <span className="font-medium text-white">
                  {verificationResult.onChainRecord?.institutionName || "—"}
                </span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Signing Wallet Address:</span>
                <span className="font-mono text-neutral-400 truncate max-w-[180px]">
                  {verificationResult.onChainRecord?.issuerAddress || "—"}
                </span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Issuer Status on Contract:</span>
                <span>
                  {verificationResult.onChainRecord?.isIssuerCurrentlyAuthorized ? (
                    <span className="text-emerald-400 font-semibold">Authorized</span>
                  ) : verificationResult.onChainRecord?.found ? (
                    <span className="text-rose-400 font-semibold">Revoked / Inactive</span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              {verificationResult.onChainRecord?.registeredAt && (
                <div className="flex justify-between text-neutral-300">
                  <span className="text-neutral-500">Anchored Timestamp:</span>
                  <span>{new Date(verificationResult.onChainRecord.registeredAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
