import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Building, Key, Mail, Hash, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "../services/api";

export const RegisterIssuerPage: React.FC = () => {
  const navigate = useNavigate();

  const [institutionName, setInstitutionName] = useState("");
  const [accreditationNumber, setAccreditationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.registerIssuer({
        institutionName,
        accreditationNumber,
        email,
        password,
        walletAddress,
      });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit issuer application.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoWallet = () => {
    // Fill sample Hardhat account #2
    setWalletAddress("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 items-center justify-center mb-3">
            <Building className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Issuer Application</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            Apply to register certificates on the ChainProof smart contract registry
          </p>
        </div>

        <div className="glass-panel p-8 border-emerald-500/20 shadow-2xl">
          {/* Security Rule Notice */}
          <div className="mb-6 p-3.5 rounded-lg bg-neutral-900 border border-emerald-500/25 flex items-start gap-3 text-neutral-300 text-xs leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Trust Model Notice:</span> Application submissions start in a <span className="text-amber-400 font-semibold">Pending</span> state. 
              Only after administrator review and on-chain authorization can this wallet register certificate hashes.
            </div>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Application Received</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Your application for <span className="text-white font-medium">{institutionName}</span> has been logged. An administrator will review your institutional credentials and link your wallet address on the blockchain.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all inline-flex items-center gap-2"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  University / College Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Stanford University or Coastal Institute"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Accreditation / Government License Code <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={accreditationNumber}
                    onChange={(e) => setAccreditationNumber(e.target.value)}
                    placeholder="e.g. EDU-ACCRED-2024-998"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Authorized Signer Email (.edu preferred) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="registrar@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Account Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Institution Signing Wallet Address (0x...) <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemoWallet}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Use Demo Dev Account #2
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
                  className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  This public address will be authorized on the Ethereum smart contract. Never enter private keys.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 ${
                  loading ? "opacity-60 cursor-wait" : ""
                }`}
              >
                <span>{loading ? "Submitting Application..." : "Submit Application for Review"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-neutral-400">
          Already an authorized issuer?{" "}
          <Link to="/login" className="text-emerald-400 font-medium hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
