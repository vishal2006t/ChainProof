import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Users, Clock, FileCheck, CheckCircle2, 
  XCircle, AlertTriangle, ShieldAlert, Activity, RefreshCw, 
  ExternalLink, Search 
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmationModal } from "../components/ConfirmationModal";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [issuers, setIssuers] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "issuers" | "registrations" | "audit">("queue");

  // Modal State for Sensitive Actions
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | "revoke";
    targetId: number | null;
    institutionName: string;
    loading: boolean;
  }>({
    isOpen: false,
    type: "approve",
    targetId: null,
    institutionName: "",
    loading: false,
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string; txHash?: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, issuersRes, regRes, logsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminIssuers(),
        api.getAdminRegistrations(),
        api.getAdminAuditLogs(),
      ]);

      setStats(statsRes.data);
      setIssuers(issuersRes.issuers || []);
      setRegistrations(regRes.registrations || []);
      setAuditLogs(logsRes.logs || []);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Failed to load admin data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openActionModal = (type: "approve" | "reject" | "revoke", targetId: number, institutionName: string) => {
    setModalConfig({
      isOpen: true,
      type,
      targetId,
      institutionName,
      loading: false,
    });
  };

  const handleModalConfirm = async (reason?: string) => {
    if (!modalConfig.targetId) return;

    setModalConfig((prev) => ({ ...prev, loading: true }));
    try {
      if (modalConfig.type === "approve") {
        const res = await api.approveIssuer(modalConfig.targetId);
        setNotification({
          type: "success",
          message: `Issuer approved and authorized on-chain!`,
          txHash: res.txHash,
        });
      } else if (modalConfig.type === "reject") {
        await api.rejectIssuer(modalConfig.targetId, reason || "Accreditation rejected");
        setNotification({
          type: "success",
          message: `Issuer application has been rejected.`,
        });
      } else if (modalConfig.type === "revoke") {
        const res = await api.revokeIssuer(modalConfig.targetId, reason || "Administrative revocation");
        setNotification({
          type: "success",
          message: `Issuer issuance rights revoked on-chain!`,
          txHash: res.txHash,
        });
      }
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
      await loadData();
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Action failed." });
      setModalConfig((prev) => ({ ...prev, loading: false }));
    }
  };

  const pendingIssuers = issuers.filter((i) => i.status === "pending" || i.application_status === "pending");
  const approvedIssuers = issuers.filter((i) => i.status === "active" || i.status === "revoked");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">System Administration</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Authorize college issuer accounts, review on-chain state, and inspect audit logs
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-emerald-500/30 text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          <span>Refresh Data</span>
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
                On-Chain Tx: <span className="text-emerald-400">{notification.txHash}</span>
              </div>
            )}
          </div>
          <button onClick={() => setNotification(null)} className="text-neutral-400 hover:text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Authorized Issuers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalIssuers ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">
            On-Chain: {stats?.onChain?.totalIssuers ?? "0"}
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats?.pendingApplications ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Requires Admin Review</div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Registered Certificates</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalRegistrations ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1 font-mono">
            Revoked: {stats?.totalRevocations ?? "0"}
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Verification Volume</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.totalVerifications ?? "0"}</div>
          <div className="text-[10px] text-neutral-500 mt-1">Independent Checks</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 text-xs">
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === "queue"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Issuer Approval Queue ({pendingIssuers.length})
        </button>
        <button
          onClick={() => setActiveTab("issuers")}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === "issuers"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Authorized Issuers ({approvedIssuers.length})
        </button>
        <button
          onClick={() => setActiveTab("registrations")}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === "registrations"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Registered Certificates ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === "audit"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Security Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Approval Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {pendingIssuers.length === 0 ? (
            <div className="glass-panel p-10 text-center text-xs text-neutral-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <span>No pending issuer applications. All requests have been reviewed.</span>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-300">
                  <thead className="bg-[#0B0F0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Institution Name</th>
                      <th className="py-3 px-4">Accreditation ID</th>
                      <th className="py-3 px-4">Official Email</th>
                      <th className="py-3 px-4">Signing Wallet</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                    {pendingIssuers.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-medium text-white">{item.institution_name}</td>
                        <td className="py-3.5 px-4 text-neutral-400">{item.accreditation_number || "—"}</td>
                        <td className="py-3.5 px-4 text-neutral-300">{item.email}</td>
                        <td className="py-3.5 px-4 text-emerald-400 truncate max-w-[140px]">{item.wallet_address}</td>
                        <td className="py-3.5 px-4 text-neutral-500 font-sans text-xs">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-sans space-x-2">
                          <button
                            onClick={() => openActionModal("approve", item.id, item.institution_name)}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
                          >
                            Authorize On-Chain
                          </button>
                          <button
                            onClick={() => openActionModal("reject", item.id, item.institution_name)}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Authorized Issuers */}
      {activeTab === "issuers" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0B0F0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Wallet Address</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {approvedIssuers.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-medium text-white">{item.institution_name}</td>
                    <td className="py-3.5 px-4 text-neutral-400 truncate max-w-[160px]">{item.wallet_address}</td>
                    <td className="py-3.5 px-4 text-neutral-400 font-sans">{item.email}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      {item.status === "active" ? (
                        <button
                          onClick={() => openActionModal("revoke", item.id, item.institution_name)}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 text-xs font-semibold"
                        >
                          Revoke Rights
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-500">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Registrations */}
      {activeTab === "registrations" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0B0F0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Student (Local Record)</th>
                  <th className="py-3 px-4">Degree / Certification</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">SHA-256 On-Chain</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Block / Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 font-sans text-xs">
                      No certificates registered yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">{reg.certificate_ref}</td>
                      <td className="py-3.5 px-4 font-sans text-white">{reg.student_name}</td>
                      <td className="py-3.5 px-4 font-sans text-neutral-300">{reg.certificate_type}</td>
                      <td className="py-3.5 px-4 font-sans text-neutral-400">{reg.institution_name}</td>
                      <td className="py-3.5 px-4 text-neutral-500 truncate max-w-[120px]">{reg.cert_hash}</td>
                      <td className="py-3.5 px-4 font-sans">
                        <StatusBadge status={reg.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 truncate max-w-[100px]">
                        {reg.block_number ? `Blk #${reg.block_number}` : "Pending"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "audit" && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#0B0F0D] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{log.action}</td>
                    <td className="py-3 px-4 text-neutral-300 font-sans">{log.user_email || "System"}</td>
                    <td className="py-3 px-4 text-neutral-400">{log.target_type}:{log.target_id}</td>
                    <td className="py-3 px-4 text-neutral-500">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={
          modalConfig.type === "approve"
            ? `Authorize ${modalConfig.institutionName}?`
            : modalConfig.type === "reject"
            ? `Reject ${modalConfig.institutionName}?`
            : `Revoke ${modalConfig.institutionName}?`
        }
        description={
          modalConfig.type === "approve"
            ? "This will execute an on-chain transaction calling authorizeIssuer() in the CertificateRegistry smart contract and grant this college rights to register certificates."
            : modalConfig.type === "reject"
            ? "This application will be marked as rejected. The institution will not be permitted to register certificates."
            : "This will call revokeIssuer() on-chain. Future certificate registrations will be rejected by the smart contract."
        }
        confirmLabel={
          modalConfig.type === "approve"
            ? "Sign Blockchain Authorization"
            : modalConfig.type === "reject"
            ? "Confirm Rejection"
            : "Revoke On-Chain"
        }
        confirmVariant={modalConfig.type === "approve" ? "success" : "danger"}
        requireReason={modalConfig.type !== "approve"}
        reasonPlaceholder={
          modalConfig.type === "reject"
            ? "Specify why accreditation could not be validated..."
            : "Reason for revocation (e.g., loss of educational license)..."
        }
        loading={modalConfig.loading}
        onConfirm={handleModalConfirm}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
