import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert } from "lucide-react";

interface StatusBadgeProps {
  status: "VERIFIED" | "NOT_REGISTERED" | "FILE_MODIFIED" | "REGISTRATION_REVOKED" | "ISSUER_REVOKED" | "VERIFICATION_ERROR" | "active" | "pending" | "revoked" | "rejected" | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const norm = status.toUpperCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-4 py-2 text-sm font-bold gap-2",
  }[size];

  if (norm === "VERIFIED" || norm === "ACTIVE" || norm === "APPROVED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        {norm === "ACTIVE" ? "Active" : norm === "APPROVED" ? "Approved" : "Verified Authentic"}
      </span>
    );
  }

  if (norm === "NOT_REGISTERED" || norm === "NONE") {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
        <AlertTriangle className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        Not Registered
      </span>
    );
  }

  if (norm === "FILE_MODIFIED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        <ShieldAlert className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        Modified / Hash Mismatch
      </span>
    );
  }

  if (norm === "REGISTRATION_REVOKED" || norm === "REVOKED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        <XCircle className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        Revoked
      </span>
    );
  }

  if (norm === "ISSUER_REVOKED") {
    return (
      <span className={`inline-flex items-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 ${sizeClasses}`}>
        <ShieldAlert className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        Issuer Revoked
      </span>
    );
  }

  if (norm === "PENDING") {
    return (
      <span className={`inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 ${sizeClasses}`}>
        <Clock className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        Pending Review
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 ${sizeClasses}`}>
      {status}
    </span>
  );
};
