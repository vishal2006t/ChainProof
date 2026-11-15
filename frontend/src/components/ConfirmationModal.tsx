import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "success" | "primary";
  requireReason?: boolean;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  requireReason = false,
  reasonPlaceholder = "Enter explanation or regulatory reason...",
  loading = false,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(requireReason ? reason : undefined);
    setReason("");
  };

  const variantStyles = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    primary: "bg-neutral-800 hover:bg-neutral-700 text-white",
  }[confirmVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#101512] border border-emerald-500/25 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {requireReason && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Reason / Justification <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full text-xs rounded-lg glass-input p-2.5 resize-none"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${variantStyles} ${
              loading ? "opacity-50 cursor-wait" : ""
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
