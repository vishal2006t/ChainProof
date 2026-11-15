import React from "react";
import { User, ShieldCheck, Key, Database, Cpu, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-xs text-neutral-400">Please sign in to view account configuration.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security Profile</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Review institutional identity and cryptographic signing configuration
        </p>
      </div>

      {/* Account Info Panel */}
      <div className="glass-panel p-6 sm:p-8 border-emerald-500/20 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-bold text-white">{user.institutionName || user.email}</div>
            <div className="text-xs text-neutral-400 capitalize">{user.role} Account</div>
          </div>
          <div className="ml-auto">
            <StatusBadge status={user.status} size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
            <span className="text-[11px] text-neutral-500">Official Contact Email:</span>
            <div className="text-white font-medium">{user.email}</div>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
            <span className="text-[11px] text-neutral-500">Platform Role:</span>
            <div className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
              {user.role}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1 sm:col-span-2">
            <span className="text-[11px] text-neutral-500">Connected Authorized Signing Wallet Address:</span>
            <div className="font-mono text-emerald-400 break-all">
              {user.walletAddress || "No wallet linked"}
            </div>
          </div>
        </div>

        {/* Security Notice on Private Keys */}
        <div className="p-4 rounded-xl bg-[#090D0B] border border-emerald-500/25 flex items-start gap-3 text-xs text-neutral-300 leading-relaxed">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Private Key Security Policy:</span> Private keys are never stored in browser memory, cookies, or localStorage. 
            For local hackathon testing, the backend communicates with the configured local node signing account; in production, transactions are signed via user-approved Web3 wallets (e.g. MetaMask/Hardware Wallet).
          </div>
        </div>
      </div>

      {/* Network Configuration */}
      <div className="glass-panel p-6 border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Blockchain Network Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">Network</span>
            <span className="text-neutral-200">Hardhat Localhost</span>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">Chain ID</span>
            <span className="text-emerald-400">31337</span>
          </div>
          <div className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800">
            <span className="text-[10px] text-neutral-500 block">Solidity Target</span>
            <span className="text-neutral-200">0.8.24 (Paris)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
