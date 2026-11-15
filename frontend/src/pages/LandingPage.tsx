import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileCheck, Lock, Cpu, ArrowRight, CheckCircle2, AlertTriangle, Layers, Database, Sparkles } from "lucide-react";
import { api } from "../services/api";

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<{ totalRegistered: number; totalIssuers: number; connected: boolean; contractAddress: string }>({
    totalRegistered: 0,
    totalIssuers: 0,
    connected: false,
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const health = await api.getHealth();
        setStats({
          totalRegistered: health.blockchain?.metrics?.totalRegistered ?? (health.blockchain?.contractVerified ? 1 : 0),
          totalIssuers: health.blockchain?.metrics?.totalIssuers ?? 1,
          connected: health.blockchain?.connected ?? false,
          contractAddress: health.blockchain?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        });
      } catch (err) {
        // Fallback for offline display
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#080B0A] text-[#F3F4F6] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[350px] bg-emerald-700/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ethereum Smart Contract Verification Protocol</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
          Cryptographic Certificate Verification.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200">
            Zero Personal Data on Blockchain.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed">
          ChainProof anchors mathematical SHA-256 digests of genuine academic certificates to an immutable Solidity smart contract. 
          Employers verify digital documents directly against authorized university signatures.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/verify"
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 group"
          >
            <span>Verify Certificate Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold rounded-xl bg-[#131A16] hover:bg-[#18231C] text-neutral-200 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2"
          >
            <span>Issuer Portal</span>
          </Link>
          <Link
            to="/how-it-works"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            How It Works
          </Link>
        </div>

        {/* Live Network Banner Pill */}
        <div className="mt-12 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#101512]/90 border border-emerald-500/20 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${stats.connected ? "bg-emerald-400 shadow-[0_0_8px_#22c55e]" : "bg-rose-500"}`} />
            <span>Network: Hardhat (ChainID 31337)</span>
          </div>
          <span className="text-neutral-600">|</span>
          <div className="truncate max-w-[240px] sm:max-w-none text-neutral-400">
            Contract: <span className="text-emerald-400">{stats.contractAddress}</span>
          </div>
        </div>
      </section>

      {/* 3-Step Architecture Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">How ChainProof Works</h2>
          <p className="mt-2 text-sm text-neutral-400 max-w-xl mx-auto">
            A three-step deterministic protocol ensuring tamper resistance and data privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="glass-panel p-6 relative group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              01
            </div>
            <h3 className="text-base font-semibold text-white mb-2">College Calculates SHA-256</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              When issuing a certificate, the university uploads the PDF. The backend validates magic byte headers (%PDF-) and computes an exact SHA-256 cryptographic digest.
            </p>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 relative group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              02
            </div>
            <h3 className="text-base font-semibold text-white mb-2">On-Chain Anchoring</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The authorized issuer signs a transaction to the <span className="font-mono text-emerald-400">CertificateRegistry</span> smart contract, immutably storing the hash and block timestamp.
            </p>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 relative group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              03
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Independent Verification</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Any employer uploads the candidate's PDF. The system computes the hash and queries the smart contract live. If hashes match and the issuer was authorized, it reports VERIFIED.
            </p>
          </div>
        </div>
      </section>

      {/* Security Principles & Honest Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-panel p-8 sm:p-12 border-emerald-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Security Principles</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                Honest Verification Grounded in Cryptography, Not Hype.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                We believe in rigorous engineering over buzzwords. Here is how ChainProof protects integrity without making impossible claims:
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Zero Personal Data on Blockchain</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Student names, GPAs, and dates of birth are NEVER written to the blockchain. Only opaque hashes and issuer addresses exist on-chain.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Strict Issuer Vetting Required</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      A blockchain hash only proves that bytes match what was registered. It only has value if the registering wallet is proven to belong to an accredited institution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Deterministic SHA-256 Avalanche Effect</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Changing a single pixel, grade, or character completely changes the 256-bit hash digest, immediately flagging tampering.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code / Visual Box */}
            <div className="bg-[#0B0F0D] rounded-xl border border-emerald-500/25 p-5 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800 text-neutral-500">
                <span className="text-emerald-400">CertificateRegistry.sol</span>
                <span>EVM Paris • 0.8.24</span>
              </div>
              <pre className="text-neutral-300 leading-relaxed overflow-x-auto text-[11px]">
{`// Cryptographic Record Structure
struct CertificateRecord {
    bytes32 certHash;          // SHA-256 file digest
    address issuer;            // Authorized college wallet
    string certificateRef;     // Opaque reference ID
    CertificateStatus status;  // Active (1) or Revoked (2)
    uint256 registeredAt;      // Block timestamp
    uint256 revokedAt;         // Revocation timestamp
}

// Zero PII stored in contract storage or events
// Enforces: onlyAuthorizedIssuer modifier`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
