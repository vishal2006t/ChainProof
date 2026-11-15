import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  FileX,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { CertificateTemplate } from "../components/CertificateTemplate";
import {
  CertificateData,
  generateCertificatePdf,
  downloadPdf,
  generateDemoCertId,
  GeneratedPdfResult,
} from "../utils/pdfGenerator";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const GenerateCertificatePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [studentName, setStudentName] = useState("Maya Chen");
  const [institutionName, setInstitutionName] = useState("Apex State University");
  const [courseName, setCourseName] = useState("Bachelor of Science in Computer Science");
  const [certificateId, setCertificateId] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [achievement, setAchievement] = useState(
    "For outstanding academic performance and successfully fulfilling all graduation requirements with highest distinction."
  );

  // Generated State
  const [genuineCert, setGenuineCert] = useState<CertificateData | null>(null);
  const [genuinePdf, setGenuinePdf] = useState<GeneratedPdfResult | null>(null);

  // Tampered State
  const [tamperedCert, setTamperedCert] = useState<CertificateData | null>(null);
  const [tamperedPdf, setTamperedPdf] = useState<GeneratedPdfResult | null>(null);
  const [tamperMode, setTamperMode] = useState<"name" | "degree">("name");
  const [activeTab, setActiveTab] = useState<"genuine" | "tampered" | "compare">("genuine");

  // Interaction State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string; txHash?: string } | null>(null);

  // In-page Live Verification Test State
  const [verifyingGenuine, setVerifyingGenuine] = useState(false);
  const [genuineVerifyResult, setGenuineVerifyResult] = useState<any>(null);
  const [verifyingTampered, setVerifyingTampered] = useState(false);
  const [tamperedVerifyResult, setTamperedVerifyResult] = useState<any>(null);

  // Generate initial demo certificate on mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleFillSample = () => {
    setStudentName("Maya Chen");
    setInstitutionName("Apex State University");
    setCourseName("Bachelor of Science in Computer Science");
    setCertificateId(generateDemoCertId());
    setIssueDate(new Date().toISOString().split("T")[0]);
    setAchievement("For outstanding academic performance and successfully fulfilling all graduation requirements with highest distinction.");
    setNotification({
      type: "info",
      message: "Sample credentials populated. Click 'Generate Certificate' to build the PDF.",
    });
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setNotification(null);
    setGenuineVerifyResult(null);
    setTamperedVerifyResult(null);

    try {
      const finalId = certificateId.trim() || generateDemoCertId();
      if (!certificateId.trim()) {
        setCertificateId(finalId);
      }

      const certData: CertificateData = {
        studentName: studentName.trim() || "Student Name",
        institutionName: institutionName.trim() || "Apex State University",
        courseName: courseName.trim() || "Bachelor of Science in Computer Science",
        certificateId: finalId,
        issueDate: issueDate || new Date().toISOString().split("T")[0],
        achievement: achievement.trim() || "For fulfilling all requirements.",
        isTampered: false,
      };

      const pdf = await generateCertificatePdf(certData);
      setGenuineCert(certData);
      setGenuinePdf(pdf);

      // Reset tampered when regenerating genuine
      setTamperedCert(null);
      setTamperedPdf(null);
      setActiveTab("genuine");

      setNotification({
        type: "success",
        message: "Original demo certificate successfully generated! Authentic PDF-1.4 ready.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to generate certificate.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateTampered = async () => {
    if (!genuineCert) return;
    setIsGenerating(true);

    try {
      const tamperedStudent =
        tamperMode === "name"
          ? "[TAMPERED] Mallory Vance (Unauthorized Alteration)"
          : genuineCert.studentName;

      const tamperedCourse =
        tamperMode === "degree"
          ? "Doctor of Philosophy (Unearned Degree)"
          : genuineCert.courseName;

      const tamperedData: CertificateData = {
        ...genuineCert,
        studentName: tamperedStudent,
        courseName: tamperedCourse,
        isTampered: true,
        tamperedField: tamperMode === "name" ? "studentName" : "courseName",
        tamperedDetails: `Field '${tamperMode === "name" ? "Student Name" : "Course"}' altered to demonstrate cryptographic avalanche effect.`,
      };

      const pdf = await generateCertificatePdf(tamperedData);
      setTamperedCert(tamperedData);
      setTamperedPdf(pdf);
      setActiveTab("tampered");

      setNotification({
        type: "info",
        message: "Tampered copy generated! One field modified to demonstrate cryptographic hash alteration.",
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to create tampered certificate.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadGenuine = () => {
    if (!genuinePdf || !genuineCert) return;
    const filename = `${genuineCert.studentName.replace(/[^a-zA-Z0-9]/g, "_")}_Genuine_Certificate.pdf`;
    downloadPdf(genuinePdf.pdfBlob, filename);
  };

  const handleDownloadTampered = () => {
    if (!tamperedPdf || !tamperedCert) return;
    const filename = `${tamperedCert.studentName.replace(/[^a-zA-Z0-9]/g, "_")}_TAMPERED_DEMO.pdf`;
    downloadPdf(tamperedPdf.pdfBlob, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // 1-Click Register on Blockchain if logged in as issuer
  const handleRegisterOnChain = async () => {
    if (!genuinePdf || !genuineCert) return;
    if (!user || user.role !== "issuer") {
      setNotification({
        type: "error",
        message: "You must be signed in as an authorized College Issuer to register certificates on the blockchain.",
      });
      return;
    }

    setIsRegistering(true);
    setNotification(null);

    try {
      const file = new File([genuinePdf.pdfBlob], `${genuineCert.certificateId}.pdf`, { type: "application/pdf" });
      const formData = new FormData();
      formData.append("certificateFile", file);
      formData.append("studentName", genuineCert.studentName);
      formData.append("certificateType", genuineCert.courseName);
      formData.append("certificateRef", genuineCert.certificateId);

      const res = await api.registerCertificate(formData);
      setNotification({
        type: "success",
        message: `Certificate successfully anchored on-chain! Block mined.`,
        txHash: res.data?.txHash,
      });

      // Clear any previous verify result to prompt re-checking
      setGenuineVerifyResult(null);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Blockchain transaction failed.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Live in-place verification test for Genuine PDF
  const handleVerifyGenuineInPlace = async () => {
    if (!genuinePdf || !genuineCert) return;
    setVerifyingGenuine(true);
    try {
      const file = new File([genuinePdf.pdfBlob], "Genuine_Certificate.pdf", { type: "application/pdf" });
      const res = await api.verifyCertificateFile(file, undefined, genuineCert.certificateId);
      setGenuineVerifyResult(res.data);
    } catch (err: any) {
      setGenuineVerifyResult({
        outcome: "VERIFICATION_ERROR",
        outcomeTitle: "Query Error",
        explanation: err.message || "Failed to reach verification endpoint.",
      });
    } finally {
      setVerifyingGenuine(false);
    }
  };

  // Live in-place verification test for Tampered PDF
  const handleVerifyTamperedInPlace = async () => {
    if (!tamperedPdf || !tamperedCert || !genuineCert) return;
    setVerifyingTampered(true);
    try {
      const file = new File([tamperedPdf.pdfBlob], "Tampered_Certificate.pdf", { type: "application/pdf" });
      // Pass the genuine reference ID to trigger the registry lookup & tamper mismatch detection
      const res = await api.verifyCertificateFile(file, undefined, genuineCert.certificateId);
      setTamperedVerifyResult(res.data);
    } catch (err: any) {
      setTamperedVerifyResult({
        outcome: "VERIFICATION_ERROR",
        outcomeTitle: "Query Error",
        explanation: err.message || "Failed to reach verification endpoint.",
      });
    } finally {
      setVerifyingTampered(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-2 no-print">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
          <Award className="w-3.5 h-3.5" />
          <span>Certificate Generator & Cryptographic Sandbox</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Academic Certificate Generator
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto">
          Create university-grade sample certificates, generate authentic PDF-1.4 documents, simulate tampered forgeries, and test blockchain verification.
        </p>
      </div>

      {/* Global Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-3 no-print transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : notification.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : notification.type === "error" ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
          )}
          <div className="space-y-1 flex-1">
            <p className="font-medium">{notification.message}</p>
            {notification.txHash && (
              <p className="font-mono text-[11px] text-neutral-400 break-all">
                On-Chain Tx: {notification.txHash}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grid: Form on Left (Desktop) + Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (4 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          <div className="glass-panel p-6 border-emerald-500/20 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Certificate Details</h2>
              </div>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Fill Sample Data</span>
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {/* Student Name */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Student Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-3 py-2 rounded-lg glass-input text-neutral-100 placeholder-neutral-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Institution Name */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  College / Institution Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Apex State University"
                  className="w-full px-3 py-2 rounded-lg glass-input text-neutral-100 placeholder-neutral-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Course / Degree */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Course / Degree Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  className="w-full px-3 py-2 rounded-lg glass-input text-neutral-100 placeholder-neutral-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Certificate ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-300 font-medium">
                    Certificate ID / Reference
                  </label>
                  <button
                    type="button"
                    onClick={() => setCertificateId(generateDemoCertId())}
                    className="text-[10px] text-neutral-400 hover:text-emerald-400 transition-colors"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Leave empty to auto-generate (e.g. CERT-DEMO-2026-001)"
                  className="w-full px-3 py-2 rounded-lg glass-input font-mono text-neutral-100 placeholder-neutral-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-neutral-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Achievement / Description */}
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Achievement / Citation Description
                </label>
                <textarea
                  rows={3}
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                  placeholder="For outstanding academic performance and fulfilling all requirements."
                  className="w-full px-3 py-2 rounded-lg glass-input text-neutral-100 placeholder-neutral-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-neutral-900 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  <span>{isGenerating ? "Generating..." : "Generate Certificate"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tamper Generation Sandbox Panel */}
          {genuineCert && (
            <div className="glass-panel p-5 border-amber-500/30 bg-amber-950/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Tamper Testing Sandbox
                </h3>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Test how ChainProof detects forgeries. Creates an exact replica of this certificate with one modified field to prove that modifying even 1 byte invalidates the blockchain SHA-256 hash.
              </p>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-300 block">
                  Field to Alter in Forgery:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTamperMode("name")}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      tamperMode === "name"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className="font-medium block">Student Name</span>
                    <span className="text-[10px] text-neutral-500">Alter to Mallory Vance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTamperMode("degree")}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      tamperMode === "degree"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span className="font-medium block">Course Degree</span>
                    <span className="text-[10px] text-neutral-500">Alter to PhD Level</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateTampered}
                disabled={isGenerating}
                className="w-full py-2 px-3 rounded-lg font-medium text-xs text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Tampered Copy</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Certificate Preview & Verification Actions (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Certificate View Switcher Tabs (no-print) */}
          <div className="flex items-center justify-between no-print border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("genuine")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "genuine"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Original Genuine</span>
              </button>

              {tamperedCert && (
                <button
                  type="button"
                  onClick={() => setActiveTab("tampered")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === "tampered"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Tampered Copy</span>
                </button>
              )}

              {tamperedCert && (
                <button
                  type="button"
                  onClick={() => setActiveTab("compare")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === "compare"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Diff Comparison</span>
                </button>
              )}
            </div>

            {/* Quick Actions (Print & Download) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Print Certificate (A4 Landscape)"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {activeTab === "genuine" ? (
                <button
                  type="button"
                  onClick={handleDownloadGenuine}
                  disabled={!genuinePdf}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadTampered}
                  disabled={!tamperedPdf}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-rose-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Tampered PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Active View */}
          {activeTab === "genuine" && genuineCert && (
            <div className="space-y-4">
              <CertificateTemplate
                data={genuineCert}
                sha256Hex={genuinePdf?.sha256Hex}
                isTampered={false}
              />

              {/* Cryptographic Hash Inspector Bar */}
              {genuinePdf && (
                <div className="glass-panel p-3.5 border-emerald-500/20 text-xs space-y-2 no-print">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-medium">Genuine SHA-256 Digest:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(genuinePdf.sha256Hex, "genuine")}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      {copiedHash === "genuine" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash === "genuine" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-emerald-300 break-all bg-black/40 p-2 rounded border border-emerald-500/15">
                    {genuinePdf.bytes32}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Authentic PDF-1.4 format • {genuinePdf.fileSizeBytes} bytes</span>
                    <span>Standard magic bytes: %PDF-1.4</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tampered" && tamperedCert && (
            <div className="space-y-4">
              <CertificateTemplate
                data={tamperedCert}
                sha256Hex={tamperedPdf?.sha256Hex}
                isTampered={true}
                tamperedField={tamperedCert.tamperedField}
              />

              {/* Tampered Hash Inspector Bar */}
              {tamperedPdf && (
                <div className="glass-panel p-3.5 border-rose-500/30 bg-rose-950/10 text-xs space-y-2 no-print">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-300 font-medium">Tampered Copy SHA-256 Digest:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tamperedPdf.sha256Hex, "tampered")}
                      className="text-rose-400 hover:text-rose-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      {copiedHash === "tampered" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash === "tampered" ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-rose-300 break-all bg-black/40 p-2 rounded border border-rose-500/20">
                    {tamperedPdf.bytes32}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-rose-400/80">
                    <span>Tampered PDF-1.4 • {tamperedPdf.fileSizeBytes} bytes</span>
                    <span>1-byte alteration cascades to completely new digest</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "compare" && genuinePdf && tamperedPdf && (
            <div className="glass-panel p-6 border-neutral-800 space-y-6 no-print">
              <div>
                <h3 className="text-sm font-semibold text-white">Cryptographic Avalanche Effect Demonstration</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Comparing the authentic generated document versus the tampered copy:
                </p>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400">
                      <th className="py-2 px-3">Field / Attribute</th>
                      <th className="py-2 px-3 text-emerald-400 font-medium">Original Document</th>
                      <th className="py-2 px-3 text-rose-400 font-medium">Tampered Copy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-400 font-medium">Student Name</td>
                      <td className="py-2.5 px-3 text-neutral-200 font-semibold">{genuineCert?.studentName}</td>
                      <td className="py-2.5 px-3 text-rose-300 font-semibold bg-rose-500/5">{tamperedCert?.studentName}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-400 font-medium">Certificate ID</td>
                      <td className="py-2.5 px-3 font-mono text-neutral-300">{genuineCert?.certificateId}</td>
                      <td className="py-2.5 px-3 font-mono text-neutral-300">{tamperedCert?.certificateId}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-400 font-medium">Degree Title</td>
                      <td className="py-2.5 px-3 text-neutral-200">{genuineCert?.courseName}</td>
                      <td className="py-2.5 px-3 text-neutral-200">{tamperedCert?.courseName}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-400 font-medium">SHA-256 Digest</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-emerald-400 break-all">{genuinePdf.bytes32}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-rose-400 break-all bg-rose-500/5">{tamperedPdf.bytes32}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-neutral-400 font-medium">Blockchain Outcome</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-medium">VERIFIED (once registered)</td>
                      <td className="py-2.5 px-3 text-rose-400 font-medium">HASH MISMATCH / FILE MODIFIED</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
                <span className="font-semibold text-neutral-200">Why this matters: </span>
                In centralized systems, an altered PDF might pass casual inspection. But on ChainProof, because the SHA-256 digest is an immutable mathematical function of all file bytes, changing even 1 character alters the entire 256-bit output.
              </div>
            </div>
          )}

          {/* Verification Integration Suite (no-print) */}
          <div className="glass-panel p-6 border-emerald-500/25 space-y-5 no-print shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  ChainProof Verification & Blockchain Integration
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Local Hardhat Node
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Test how the live Ethereum smart contract processes these documents. Follow the 2-step verification lifecycle:
            </p>

            {/* Step 1: Issuer Anchoring */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-semibold text-white">
                    Anchor Genuine Certificate on Blockchain
                  </span>
                </div>
                {user?.role === "issuer" ? (
                  <span className="text-[11px] text-emerald-400 font-medium">Signed in as Authorized College</span>
                ) : (
                  <span className="text-[11px] text-neutral-500">Requires College Issuer Account</span>
                )}
              </div>

              {user?.role === "issuer" ? (
                <button
                  type="button"
                  onClick={handleRegisterOnChain}
                  disabled={isRegistering || !genuinePdf}
                  className="w-full py-2 px-3 rounded-lg text-xs font-medium text-neutral-900 bg-emerald-400 hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{isRegistering ? "Mining Transaction on Local Chain..." : "Anchor Original on Smart Contract (1-Click)"}</span>
                </button>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-neutral-400 text-[11px]">
                    To register this document on-chain, sign in with the pre-seeded demo college account:
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <span>Sign In as College (`issuer@apex.edu`)</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/issuer"
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs font-medium"
                    >
                      Open Issuer Portal
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Live In-Place Verification Sandbox */}
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-semibold text-white">
                  Test Public Verification Outcomes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Verify Genuine Button & Result */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleVerifyGenuineInPlace}
                    disabled={verifyingGenuine || !genuinePdf}
                    className="w-full py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{verifyingGenuine ? "Querying Chain..." : "Verify Genuine Copy"}</span>
                  </button>

                  {genuineVerifyResult && (
                    <div
                      className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                        genuineVerifyResult.outcome === "VERIFIED"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                          : "bg-neutral-800/60 border-neutral-700 text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Outcome:</span>
                        <span
                          className={`uppercase font-mono text-[10px] px-1.5 py-0.5 rounded ${
                            genuineVerifyResult.outcome === "VERIFIED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-800 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {genuineVerifyResult.outcomeTitle || genuineVerifyResult.outcome}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        {genuineVerifyResult.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Verify Tampered Button & Result */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleVerifyTamperedInPlace}
                    disabled={verifyingTampered || !tamperedPdf}
                    className="w-full py-2 px-3 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FileX className="w-3.5 h-3.5 text-rose-400" />
                    <span>{verifyingTampered ? "Querying Chain..." : "Verify Tampered Copy"}</span>
                  </button>

                  {tamperedVerifyResult && (
                    <div className="p-2.5 rounded-lg border bg-rose-950/20 border-rose-500/30 text-rose-300 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Outcome:</span>
                        <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {tamperedVerifyResult.outcomeTitle || tamperedVerifyResult.outcome}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        {tamperedVerifyResult.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Link to Full Verify Page */}
              <div className="pt-2 text-center">
                <Link
                  to="/verify"
                  className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Open Standalone Drag-and-Drop Verifier Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
