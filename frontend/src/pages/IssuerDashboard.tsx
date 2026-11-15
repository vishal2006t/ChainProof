import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Building, ShieldCheck, FileUp, CheckCircle2, 
  AlertTriangle, Copy, Check, Hash, RefreshCw, 
  ExternalLink, ArrowRight, XCircle, FileText 
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmationModal } from "../components/ConfirmationModal";

export const IssuerDashboard: React.FC = () => {
  const [issuerInfo, setIssuerInfo] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [studentName, setStudentName] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [certificateRef, setCertificateRef] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Revocation Modal State
  const [revokeModal, setRevokeModal] = useState<{
    isOpen: boolean;
    certId: number | null;
    ref: string;
    loading: boolean;
  }>({
    isOpen: false,
    certId: null,
    ref: "",
    loading: false,
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string; txHash?: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        api.getIssuerStatus(),
        api.getIssuerRegistrations(),
      ]);
      setIssuerInfo(statusRes);
      setRegistrations(listRes.registrations || []);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load issuer data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When a file is selected, compute SHA-256 preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setFormError("Only authentic PDF documents (.pdf) can be registered.");
      return;
    }

    setSelectedFile(file);
    setFormError(null);
    setPreviewLoading(true);

    try {
      const res = await api.previewCertificateHash(file);
      setPreviewData(res.data);
      if (res.data.alreadyRegistered) {
        setFormError("Warning: This certificate hash is already registered in the registry.");
      }
    } catch (err: any) {
      setFormError(err.message || "Could not generate file preview.");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFormError("Please select a PDF certificate to register.");
      return;
    }
    if (!studentName.trim() || !certificateType.trim() || !certificateRef.trim()) {
      setFormError("Please fill out all required certificate fields.");
      return;
    }
    setFormError(null);
    setShowReviewModal(true);
  };

  const handleRegisterOnChain = async () => {
    if (!selectedFile) return;

    setRegistering(true);
    try {
      const formData = new FormData();
      formData.append("certificateFile", selectedFile);
      formData.append("studentName", studentName);
      formData.append("certificateType", certificateType);
      formData.append("certificateRef", certificateRef);

      const res = await api.registerCertificate(formData);
      setNotification({
        type: "success",
        message: "Certificate registered and anchored on Ethereum blockchain!",
        txHash: res.data?.txHash,
      });

      // Reset form
      setSelectedFile(null);
      setStudentName("");
      setCertificateType("");
      setCertificateRef("");
      setPreviewData(null);
      setShowReviewModal(false);

      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to submit transaction." });
      setShowReviewModal(false);
    } finally {
      setRegistering(false);
    }
  };

  const handleRevokeConfirm = async (reason?: string) => {
    if (!revokeModal.certId) return;

    setRevokeModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await api.revokeCertificate(revokeModal.certId, reason || "Revoked by issuing college");
      setNotification({
        type: "success",
        message: `Certificate ${revokeModal.ref} has been revoked on-chain!`,
        txHash: res.txHash,
      });
      setRevokeModal((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to revoke certificate." });
      setRevokeModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 border-emerald-500/25 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              {issuerInfo?.issuer?.institutionName || "College Issuer Portal"}
            </h1>
            <StatusBadge status={issuerInfo?.issuer?.status || "active"} size="sm" />
          </div>
          <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-3">
            <span>Signing Address: <span className="font-mono text-emerald-400">{issuerInfo?.issuer?.walletAddress}</span></span>
            <span className="text-neutral-600">•</span>
            <span>
              On-Chain Status:{" "}
              {issuerInfo?.onChain?.isAuthorized ? (
                <span className="text-emerald-400 font-semibold">Active Authorized Signer</span>
              ) : (
                <span className="text-amber-400 font-semibold">Pending Authorization</span>
              )}
            </span>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="space-y-1">
            <div className="font-semibold">{notification.message}</div>
            {notification.txHash && (
              <div className="font-mono text-[11px] text-neutral-400 break-all">
                On-Chain Tx Hash: <span className="text-emerald-400">{notification.txHash}</span>
              </div>
            )}
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <div className="text-xs text-neutral-400 mb-1">Total Issued Certificates</div>
          <div className="text-2xl font-bold text-white">{issuerInfo?.statistics?.totalRegistered ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Lifetime registrations</div>
        </div>
        <div className="glass-panel p-5">
          <div className="text-xs text-neutral-400 mb-1">Active Credentials</div>
          <div className="text-2xl font-bold text-emerald-400">{issuerInfo?.statistics?.activeCertificates ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Verifiable on smart contract</div>
        </div>
        <div className="glass-panel p-5">
          <div className="text-xs text-neutral-400 mb-1">Revoked Credentials</div>
          <div className="text-2xl font-bold text-rose-400">{issuerInfo?.statistics?.revokedCertificates ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Marked invalid on-chain</div>
        </div>
      </div>

      {/* Registration Form & Live Hash Section */}
      <div className="glass-panel p-6 sm:p-8 border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <FileUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Register New Certificate</h2>
        </div>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          Upload an official degree or credential PDF. The SHA-256 byte hash will be computed in memory and anchored to the blockchain. 
          Student personal identifiable information (PII) is NOT recorded on-chain.
        </p>

        {formError && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* File Upload Box */}
          <div className="border-2 border-dashed border-emerald-500/25 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-[#0B0F0D]/60 transition-colors">
            <input
              type="file"
              id="cert-file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="cert-file" className="cursor-pointer block space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-xs text-neutral-300">
                {selectedFile ? (
                  <span className="font-semibold text-emerald-400">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <span>Click to select or drag and drop official certificate PDF</span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500">
                PDF magic bytes (%PDF-) strictly checked. Max 10MB.
              </p>
            </label>
          </div>

          {/* Cryptographic Hash Preview Card */}
          {previewLoading ? (
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Verifying magic bytes and computing SHA-256 hash...</span>
            </div>
          ) : previewData ? (
            <div className="p-4 rounded-xl bg-[#0E1410] border border-emerald-500/25 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                <span className="font-semibold text-emerald-400">Cryptographic SHA-256 Digest Preview:</span>
                <span className="text-emerald-500 font-sans font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid PDF Signature
                </span>
              </div>
              <div className="p-2.5 rounded bg-black/60 border border-neutral-800 text-[11px] text-neutral-200 break-all flex items-center justify-between gap-2">
                <span>{previewData.bytes32}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(previewData.bytes32)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 shrink-0"
                >
                  {copiedHash === previewData.bytes32 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : null}

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Student Full Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Maya Chen"
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Stored only in local database, NEVER on chain.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Degree / Credential Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={certificateType}
                onChange={(e) => setCertificateType(e.target.value)}
                placeholder="e.g. B.S. in Computer Science"
                className="w-full px-3 py-2 text-xs rounded-lg glass-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Certificate Reference ID <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={certificateRef}
                onChange={(e) => setCertificateRef(e.target.value)}
                placeholder="e.g. CERT-APEX-2026-904"
                className="w-full px-3 py-2 text-xs rounded-lg glass-input font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Opaque public reference identifier.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={previewLoading || !selectedFile}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2"
            >
              <span>Review & Register on Blockchain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Previously Registered Certificates Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight">Registered Certificates History</h3>
          <span className="text-xs text-neutral-400">{registrations.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#0B0F0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Ref ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Credential Type</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 font-sans text-xs">
                    No certificates registered yet. Fill out the form above to anchor your first certificate on-chain.
                  </td>
                </tr>
              ) : (
                registrations.map((cert) => (
                  <tr key={cert.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">{cert.certificate_ref}</td>
                    <td className="py-3.5 px-4 font-sans text-white">{cert.student_name}</td>
                    <td className="py-3.5 px-4 font-sans text-neutral-300">{cert.certificate_type}</td>
                    <td className="py-3.5 px-4 text-neutral-400 truncate max-w-[120px]">{cert.cert_hash}</td>
                    <td className="py-3.5 px-4 text-neutral-500 font-sans text-xs">
                      {new Date(cert.registered_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <StatusBadge status={cert.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans space-x-2">
                      <Link
                        to={`/verify?hash=${cert.cert_hash}`}
                        className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 text-xs font-medium inline-block"
                      >
                        Verify
                      </Link>
                      {cert.status === "active" && (
                        <button
                          onClick={() => setRevokeModal({ isOpen: true, certId: cert.id, ref: cert.certificate_ref, loading: false })}
                          className="px-2 py-1 rounded bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 text-xs font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal before Submitting On-Chain */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#101512] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">Review Blockchain Registration</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Certificate Reference:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{certificateRef}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Student Name:</span>
                  <span className="text-white font-medium">{studentName}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Credential Title:</span>
                  <span className="text-white">{certificateType}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>File Name:</span>
                  <span className="text-white">{selectedFile?.name}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 text-[11px] block mb-1">SHA-256 Hash Digest (To be recorded on-chain):</span>
                <div className="p-2.5 rounded bg-black border border-emerald-500/30 font-mono text-[11px] text-emerald-400 break-all">
                  {previewData?.bytes32}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-neutral-300 text-[11px] leading-relaxed">
                <span className="text-emerald-400 font-semibold">Privacy Confirmation:</span> Only the cryptographic hash above and your authorized wallet address will be committed to the Solidity contract. 
                Personal details remain secure in institutional records.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={registering}
                className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegisterOnChain}
                disabled={registering}
                className={`px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 ${
                  registering ? "opacity-60 cursor-wait" : ""
                }`}
              >
                {registering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Sign On-Chain</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      <ConfirmationModal
        isOpen={revokeModal.isOpen}
        title={`Revoke Certificate ${revokeModal.ref}?`}
        description="This will execute revokeCertificate() on the smart contract. The certificate status will permanently reflect 'Revoked' on the blockchain."
        confirmLabel="Revoke on Blockchain"
        confirmVariant="danger"
        requireReason={true}
        reasonPlaceholder="e.g. Student transcript adjustment, grade appeal correction, or administrative error..."
        loading={revokeModal.loading}
        onConfirm={handleRevokeConfirm}
        onClose={() => setRevokeModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
