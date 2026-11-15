import React from "react";
import { ShieldCheck, Lock, Cpu, Github, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-emerald-500/15 bg-[#080B0A] text-neutral-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-base font-bold text-white tracking-tight">ChainProof</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
            Cryptographically proving certificate integrity and provenance through Ethereum smart contracts. 
            Zero student personal data (PII) is stored on-chain—only immutable SHA-256 digests registered by vetted institutions.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-500" /> SHA-256 Cryptography
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" /> EVM Smart Contracts
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">Workflows</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/verify" className="hover:text-emerald-400 transition-colors">Certificate Verification</a></li>
            <li><a href="/how-it-works" className="hover:text-emerald-400 transition-colors">How Verification Works</a></li>
            <li><a href="/register-issuer" className="hover:text-emerald-400 transition-colors">Institutional Accreditation</a></li>
            <li><a href="/login" className="hover:text-emerald-400 transition-colors">Authorized Issuer Sign In</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-3">Security & Principles</h4>
          <p className="text-xs text-neutral-500 leading-relaxed mb-3">
            A matching hash verifies byte-level fidelity against a registered file. It relies on cryptographic signature from an admin-authorized college address.
          </p>
          <div className="text-[11px] font-mono text-neutral-600 bg-neutral-900/80 p-2 rounded border border-neutral-800">
            ChainID: 31337 (Local Devnet)
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
        <p>© 2026 ChainProof Project. Built for college blockchain & cybersecurity education.</p>
        <p className="text-neutral-500">
          Pure Deterministic Hashing • No Fake AI Claims • Fully Audited Smart Contract
        </p>
      </div>
    </footer>
  );
};
