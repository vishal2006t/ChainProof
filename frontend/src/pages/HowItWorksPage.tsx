import React from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, Lock, Cpu, Database, CheckCircle2, 
  AlertTriangle, ArrowRight, Layers, FileCheck, ShieldAlert 
} from "lucide-react";

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <Layers className="w-3.5 h-3.5" />
          <span>System Architecture & Threat Modeling</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How ChainProof Solves Credential Fraud
        </h1>
        <p className="text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Combining deterministic SHA-256 cryptography with Ethereum smart contract access control to guarantee authenticity while protecting student privacy.
        </p>
      </div>

      {/* The Fundamental Problem & The ChainProof Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-rose-500/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">The Traditional Credential Flaw</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            PDF certificates and printed diplomas can be photoshopped or recreated in minutes. Traditional manual verification requires phone calls, emails to registrar offices, or third-party background check agencies taking weeks and charging exorbitant fees.
          </p>
        </div>

        <div className="glass-panel p-6 border-emerald-500/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">The ChainProof Architecture</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Rather than relying on visual design or centralized databases, universities cryptographically sign the SHA-256 hash of the generated PDF onto an Ethereum smart contract. Verification takes under 1 second without revealing any student PII on-chain.
          </p>
        </div>
      </div>

      {/* Three Distinct User Roles Flow */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Role-Based Cryptographic Lifecycle</h2>

        <div className="space-y-4">
          <div className="glass-panel p-6 border-emerald-500/20 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Administrator Authorizes College Wallet</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                To prevent malicious actors from registering fake certificates, anyone can sign up, but only vetted universities can issue. 
                The platform admin validates government accreditation and submits an on-chain transaction calling <span className="font-mono text-emerald-400">authorizeIssuer(walletAddress, name)</span>.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 border-emerald-500/20 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">College Registers Certificate SHA-256 Digest</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The university uploads the official student PDF. The backend checks magic bytes (%PDF-) and hashes the file buffer using Node.js crypto. 
                The college wallet executes <span className="font-mono text-emerald-400">registerCertificate(bytes32 certHash, string certRef)</span>. The smart contract validates that <span className="font-mono text-emerald-400">msg.sender</span> is authorized and records the timestamp.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 border-emerald-500/20 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Employer / Verifier Checks Ground Truth</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                The employer uploads the candidate's PDF. The backend computes the hash and queries the smart contract via <span className="font-mono text-emerald-400">getCertificate(certHash)</span>. 
                If the hash exists, is active, and the issuing institution is authorized, it reports VERIFIED. If the candidate altered even a single character in the PDF, the hash completely diverges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Modeling Scenarios */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Threat Model & Defense Matrix</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0F1411] border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Attack: Candidate alters GPA or student name in PDF</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200">Defense:</strong> SHA-256 has the avalanche effect. Modifying 1 byte changes the entire 256-bit hash. 
              The verifier computes the altered hash, which does not exist on-chain, immediately returning <span className="text-amber-400 font-mono">NOT_REGISTERED</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1411] border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Attack: Malicious entity tries to register fake degrees</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200">Defense:</strong> The smart contract enforces <span className="font-mono text-emerald-400">onlyAuthorizedIssuer</span>. 
              Any unregistered address attempting to call <span className="font-mono text-emerald-400">registerCertificate</span> is immediately reverted with custom error <span className="font-mono text-rose-400">IssuerNotAuthorized()</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1411] border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Attack: College loses accreditation after issuing degree</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200">Defense:</strong> The platform administrator calls <span className="font-mono text-emerald-400">revokeIssuer(collegeAddress)</span>. 
              The smart contract flags the issuer as unauthorized, causing future verification queries to report <span className="text-purple-400 font-mono">ISSUER_REVOKED</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1411] border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="w-4 h-4" />
              <span>Privacy Violation: Storing sensitive student data on public ledger</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              <strong className="text-neutral-200">Defense:</strong> Absolute zero PII on-chain. Only the 32-byte cryptographic hash, the college's public wallet address, and an opaque reference string are stored in smart contract storage or events.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/verify"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg"
        >
          <span>Try Public Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
