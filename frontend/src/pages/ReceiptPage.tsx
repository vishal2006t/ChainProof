import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Printer, ArrowLeft, CheckCircle2, Lock, Cpu } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";

export const ReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<any | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("last_verification_receipt");
    if (raw) {
      try {
        setReceipt(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to parse receipt:", err);
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!receipt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Verification Receipt Found</h2>
        <p className="text-xs text-neutral-400">
          Please perform a certificate verification check first to generate a printable cryptographic receipt.
        </p>
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Verification</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      {/* Top Actions (Hidden in print) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-neutral-800">
        <Link
          to="/verify"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verifier</span>
        </Link>
        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="glass-panel p-8 sm:p-12 border-emerald-500/30 space-y-8 bg-[#0D120F]">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-lg font-bold text-white tracking-tight">ChainProof Verification Certificate</div>
              <p className="text-xs text-neutral-400">Ethereum Smart Contract Cryptographic Receipt</p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-neutral-400">
            <div>Receipt ID: <span className="text-emerald-400 font-semibold">{receipt.verificationId}</span></div>
            <div className="text-[11px] text-neutral-500">{new Date(receipt.verifiedAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="p-4 rounded-xl bg-[#090D0B] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Verification Result</div>
            <div className="text-base font-bold text-white mt-0.5">{receipt.outcomeTitle}</div>
          </div>
          <StatusBadge status={receipt.outcome} size="md" />
        </div>

        {/* Key Cryptographic Details */}
        <div className="space-y-4 text-xs">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase font-semibold tracking-wider block mb-1">
              Cryptographic SHA-256 Digest
            </span>
            <div className="p-3 rounded-lg bg-black border border-neutral-800 font-mono text-[11px] text-emerald-400 break-all">
              {receipt.fileDetails?.bytes32}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 space-y-1">
              <span className="text-[11px] text-neutral-500">Issuing Institution:</span>
              <div className="text-white font-medium">{receipt.onChainRecord?.institutionName || "—"}</div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 space-y-1">
              <span className="text-[11px] text-neutral-500">Certificate Reference ID:</span>
              <div className="font-mono text-emerald-400">{receipt.onChainRecord?.certificateRef || "—"}</div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 space-y-1">
              <span className="text-[11px] text-neutral-500">Authorized College Wallet:</span>
              <div className="font-mono text-neutral-300 truncate">{receipt.onChainRecord?.issuerAddress || "—"}</div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 space-y-1">
              <span className="text-[11px] text-neutral-500">Smart Contract Registry:</span>
              <div className="font-mono text-neutral-400 truncate">{receipt.onChainRecord?.contractAddress}</div>
            </div>
          </div>
        </div>

        {/* Security & Audit Statement */}
        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed space-y-2">
          <div className="font-semibold text-neutral-200">Cryptographic Verification Guarantee:</div>
          <p>
            This receipt confirms that the uploaded document bytes produce an exact SHA-256 digest matching an active record on the ChainProof Ethereum smart contract. 
            Because this hash was signed by an administrator-approved college wallet, document tampering or post-issuance modification is mathematically ruled out.
          </p>
          <div className="flex items-center gap-4 text-neutral-500 text-[10px] pt-1">
            <span>Network: Ethereum EVM (Local Devnet #31337)</span>
            <span>•</span>
            <span>Zero Student PII Exposed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
