import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, ShieldCheck, CheckCircle2, User, LogOut, Menu, X, Database, Terminal } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chainConnected, setChainConnected] = useState<boolean | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  useEffect(() => {
    async function checkChain() {
      try {
        const res = await api.getHealth();
        setChainConnected(res.blockchain?.connected ?? false);
        setCurrentBlock(res.blockchain?.currentBlock ?? null);
      } catch (err) {
        setChainConnected(false);
      }
    }
    checkChain();
    const interval = setInterval(checkChain, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[#080B0A]/85 backdrop-blur-md border-b border-emerald-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/60 transition-all duration-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  ChainProof
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-normal hidden sm:block">
                Blockchain Certificate Registry
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/verify"
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/verify")
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Verify Certificate
            </Link>
            <Link
              to="/generate"
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/generate")
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              Generate Certificate
            </Link>
            <Link
              to="/how-it-works"
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive("/how-it-works")
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              How It Works
            </Link>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive("/admin")
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                Admin Dashboard
              </Link>
            )}

            {user?.role === "issuer" && (
              <Link
                to="/issuer"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive("/issuer")
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                Issuer Portal
              </Link>
            )}
          </div>

          {/* Right Action Section & Blockchain Node Pill */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Chain Node Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  chainConnected === true
                    ? "bg-emerald-500 shadow-[0_0_8px_#22c55e]"
                    : chainConnected === false
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="font-mono text-[11px]">
                {chainConnected === true
                  ? `Hardhat #31337${currentBlock ? ` • blk #${currentBlock}` : ""}`
                  : "Node Offline"}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131A16] border border-emerald-500/20 text-xs text-neutral-200 hover:border-emerald-500/40 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[120px] truncate">
                    {user.institutionName || user.email}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/register-issuer"
                  className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Apply as Issuer
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-[#101512] border-b border-emerald-500/20 space-y-2">
          <Link
            to="/verify"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
          >
            Verify Certificate
          </Link>
          <Link
            to="/generate"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
          >
            Generate Certificate
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
          >
            How It Works
          </Link>

          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
            >
              Admin Dashboard
            </Link>
          )}

          {user?.role === "issuer" && (
            <Link
              to="/issuer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm rounded-lg text-neutral-300 hover:bg-neutral-800"
            >
              Issuer Portal
            </Link>
          )}

          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded bg-emerald-600 text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register-issuer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded bg-neutral-800 text-neutral-300"
                >
                  Apply
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
