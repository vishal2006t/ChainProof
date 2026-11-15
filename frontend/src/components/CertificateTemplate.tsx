import React from "react";
import { Award, ShieldAlert, CheckCircle2 } from "lucide-react";
import { CertificateData } from "../utils/pdfGenerator";

interface CertificateTemplateProps {
  data: CertificateData;
  sha256Hex?: string;
  isTampered?: boolean;
  tamperedField?: string;
  originalStudentName?: string;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  data,
  sha256Hex,
  isTampered = false,
  tamperedField = "studentName",
  originalStudentName,
}) => {
  const {
    studentName = "Maya Chen",
    institutionName = "Apex State University",
    courseName = "Bachelor of Science in Computer Science",
    certificateId = "CERT-DEMO-2026-001",
    issueDate = new Date().toISOString().split("T")[0],
    achievement = "For outstanding academic performance and successfully fulfilling all graduation requirements.",
  } = data;

  const formattedDate = (() => {
    try {
      const d = new Date(issueDate);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return issueDate;
    }
  })();

  return (
    <div
      id="printable-certificate"
      className={`relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 print:shadow-none print:rounded-none print:m-0 ${
        isTampered
          ? "bg-gradient-to-b from-[#FFFDFD] via-[#FFF8F8] to-[#FDF5F5] border-2 border-rose-400/80 ring-4 ring-rose-500/20"
          : "bg-gradient-to-b from-[#FCFBF8] via-[#FAF8F2] to-[#F5F2E9] border-2 border-[#D4AF37]/80 ring-4 ring-[#D4AF37]/15"
      }`}
      style={{
        aspectRatio: "1.414 / 1", // A4 Landscape ratio
      }}
    >
      {/* Outer Ornate Gold Border */}
      <div className="absolute inset-3 border-2 border-[#D4AF37]/70 rounded-xl pointer-events-none print:inset-2" />
      {/* Inner Fine Gold Border */}
      <div className="absolute inset-5 border border-[#C5A059]/40 rounded-lg pointer-events-none print:inset-3" />

      {/* Decorative Corner Filigrees */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#B8860B] rounded-tl-sm pointer-events-none" />
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#B8860B] rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#B8860B] rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#B8860B] rounded-br-sm pointer-events-none" />

      {/* Background Watermark Pattern */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
        <Award className="w-[380px] h-[380px] text-[#B8860B]" />
      </div>

      {/* Top Disclaimer Banner */}
      <div
        className={`w-full py-1 px-4 text-center text-[10px] sm:text-xs font-semibold tracking-wider uppercase border-b transition-colors ${
          isTampered
            ? "bg-rose-500/15 text-rose-700 border-rose-300/60"
            : "bg-[#D4AF37]/15 text-[#8C6D1F] border-[#D4AF37]/30"
        }`}
      >
        {isTampered ? (
          <span className="flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 inline" />
            <span>TAMPERED DEMO COPY — MODIFIED FOR VERIFICATION TESTING ONLY</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
            <span>DEMO SAMPLE — NOT AN OFFICIAL QUALIFICATION</span>
          </span>
        )}
      </div>

      {/* Certificate Main Body */}
      <div className="relative z-10 px-8 sm:px-14 py-6 sm:py-8 flex flex-col justify-between h-[calc(100%-28px)] text-center text-neutral-800">
        {/* Top Header: University Crest & Name */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#AA820A] flex items-center justify-center shadow-md">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-xs sm:text-sm font-serif tracking-[0.25em] text-[#7A611B] uppercase font-bold">
            {institutionName}
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-0.5" />
        </div>

        {/* Title: CERTIFICATE OF ACHIEVEMENT */}
        <div className="space-y-1 my-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-wider text-neutral-900 uppercase">
            Certificate of Achievement
          </h1>
          <p className="text-[10px] sm:text-xs text-neutral-500 tracking-widest font-sans uppercase">
            This is proudly conferred upon
          </p>

          {/* Student Recipient Name */}
          <div className="py-2">
            <div className="inline-block relative">
              <p
                className={`text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-tight px-6 ${
                  isTampered && tamperedField === "studentName"
                    ? "text-rose-700 bg-rose-50 rounded-lg border border-dashed border-rose-300 py-1"
                    : "text-neutral-900"
                }`}
              >
                {studentName}
              </p>
              {isTampered && tamperedField === "studentName" && (
                <span className="absolute -top-3 right-0 bg-rose-600 text-white text-[9px] font-mono uppercase px-2 py-0.5 rounded-full shadow-sm">
                  Altered Field
                </span>
              )}
            </div>
            <div className="w-48 sm:w-64 h-[1.5px] bg-[#D4AF37] mx-auto mt-2 shadow-sm" />
          </div>

          {/* Achievement Description */}
          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto italic font-serif leading-relaxed px-4">
            {achievement}
          </p>

          {/* Degree / Program Name */}
          <div className="pt-2">
            <span
              className={`inline-block text-sm sm:text-base md:text-lg font-serif font-bold tracking-wide uppercase px-4 py-0.5 rounded ${
                isTampered && tamperedField === "courseName"
                  ? "text-rose-700 bg-rose-50 border border-dashed border-rose-300"
                  : "text-[#8C6D1F]"
              }`}
            >
              {courseName}
            </span>
          </div>
        </div>

        {/* Bottom Section: Metadata & Official Signatures */}
        <div className="pt-4 border-t border-[#D4AF37]/30 grid grid-cols-3 items-end gap-2 text-left">
          {/* Left: Metadata */}
          <div className="space-y-1 text-[10px] sm:text-[11px] text-neutral-600 font-sans">
            <div>
              <span className="font-semibold text-neutral-700">Certificate ID: </span>
              <span className="font-mono text-neutral-800 font-medium">{certificateId}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Date Issued: </span>
              <span>{formattedDate}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-700">Verification: </span>
              <span className="text-[#8C6D1F] font-medium">ChainProof Smart Contract</span>
            </div>
          </div>

          {/* Center: Gold Foil Notary Seal */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#E6C65A] via-[#D4AF37] to-[#996515] p-1 shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-dashed border-amber-900/30 flex flex-col items-center justify-center text-center p-1 bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB]">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-950 mb-0.5" />
                <span className="text-[7px] sm:text-[8px] font-bold text-amber-950 uppercase leading-none tracking-tighter">
                  CHAINPROOF
                </span>
                <span className="text-[6px] sm:text-[7px] text-amber-900 tracking-tighter leading-none mt-0.5">
                  SEAL OF INTEGRITY
                </span>
              </div>
            </div>
          </div>

          {/* Right: Signatures */}
          <div className="space-y-3 text-right">
            <div>
              {/* Cursive Signature Graphic */}
              <div className="inline-block border-b border-neutral-400 pb-0.5 px-4 font-serif italic text-base sm:text-lg text-neutral-700 select-none">
                Dr. A. Montgomery
              </div>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-sans">
                Dean of Academic Affairs
              </p>
            </div>
            <div>
              <div className="inline-block border-b border-neutral-400 pb-0.5 px-4 font-serif italic text-sm sm:text-base text-neutral-700 select-none">
                M. Sterling, Notary
              </div>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase font-sans">
                Registrar & Blockchain Attestor
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Hash Notice */}
        {sha256Hex && (
          <div className="pt-2 text-[9px] font-mono text-neutral-500 border-t border-dashed border-neutral-200 flex items-center justify-between">
            <span className="truncate max-w-[80%]">
              <span className="font-semibold text-neutral-600">SHA-256: </span>
              {sha256Hex}
            </span>
            <span className="shrink-0 text-[#8C6D1F]">ChainID 31337</span>
          </div>
        )}
      </div>
    </div>
  );
};
