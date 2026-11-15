import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/issuer");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md">
        {/* Header Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign in to ChainProof</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Access administrative controls or your college certificate registry
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 border-emerald-500/20 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@chainproof.local or issuer@college.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg glass-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 ${
                loading ? "opacity-60 cursor-wait" : ""
              }`}
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins for Hackathon Evaluators */}
          <div className="mt-6 pt-5 border-t border-neutral-800">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-2.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>One-Click Demo Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@chainproof.local", "AdminPass123!")}
                className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 text-neutral-300 hover:text-emerald-400 transition-colors text-left"
              >
                <div className="font-semibold">System Admin</div>
                <div className="text-[10px] text-neutral-500 font-mono">admin@chainproof.local</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("issuer@apex.edu", "IssuerPass123!")}
                className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 text-neutral-300 hover:text-emerald-400 transition-colors text-left"
              >
                <div className="font-semibold">Apex University</div>
                <div className="text-[10px] text-neutral-500 font-mono">issuer@apex.edu</div>
              </button>
            </div>
          </div>
        </div>

        {/* Link to Issuer Signup */}
        <div className="text-center mt-6 text-xs text-neutral-400">
          Educational institution without an authorized account?{" "}
          <Link to="/register-issuer" className="text-emerald-400 font-medium hover:underline">
            Submit an Issuer Application
          </Link>
        </div>
      </div>
    </div>
  );
};
