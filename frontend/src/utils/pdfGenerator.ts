/**
 * ChainProof Certificate PDF Generator
 * 
 * Generates standards-compliant PDF-1.4 documents directly in the browser
 * with authentic magic bytes (%PDF-1.4), vector border graphics, typography,
 * and deterministic binary structure for SHA-256 cryptographic hashing.
 */

export interface CertificateData {
  studentName: string;
  institutionName: string;
  courseName: string;
  certificateId: string;
  issueDate: string;
  achievement: string;
  isTampered?: boolean;
  tamperedField?: string;
  tamperedDetails?: string;
}

export interface GeneratedPdfResult {
  pdfBytes: Uint8Array;
  pdfBlob: Blob;
  sha256Hex: string;
  bytes32: string;
  fileSizeBytes: number;
}

/**
 * Computes SHA-256 hash digest from Uint8Array bytes using Web Crypto API
 */
export async function computeBufferSha256(buffer: Uint8Array): Promise<{ sha256Hex: string; bytes32: string }> {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return {
    sha256Hex,
    bytes32: "0x" + sha256Hex,
  };
}

/**
 * Generates an authentic PDF-1.4 document for a certificate
 */
export async function generateCertificatePdf(data: CertificateData): Promise<GeneratedPdfResult> {
  const isTampered = !!data.isTampered;
  
  // Sanitize text strings for PDF literal strings (escape parentheses and backslashes)
  const sanitize = (val: string) =>
    String(val || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[\r\n]+/g, " ")
      .trim();

  const student = sanitize(data.studentName || "Student Name");
  const institution = sanitize(data.institutionName || "Apex State University");
  const course = sanitize(data.courseName || "Bachelor of Science in Computer Science");
  const certId = sanitize(data.certificateId || "CERT-DEMO-2026-001");
  const date = sanitize(data.issueDate || new Date().toISOString().split("T")[0]);
  const achievement = sanitize(
    data.achievement || "For outstanding academic performance and successfully fulfilling all graduation requirements."
  );

  const bannerText = isTampered
    ? "TAMPERED DEMO COPY - MODIFIED FOR TESTING - NOT AN OFFICIAL QUALIFICATION"
    : "DEMO SAMPLE - NOT AN OFFICIAL QUALIFICATION - CHAINPROOF VERIFICATION DEMO";

  // Build PDF content stream (A4 Landscape: 842 pt wide, 595 pt high)
  const streamLines: string[] = [
    // Outer border (Gold/Bronze: 0.78 0.62 0.22)
    "q",
    "0.78 0.62 0.22 RG",
    "4 w",
    "20 20 802 555 re S",

    // Inner gold border
    "0.85 0.70 0.30 RG",
    "1.5 w",
    "28 28 786 539 re S",

    // Corner decorative squares
    "0.78 0.62 0.22 rg",
    "23 560 12 12 re f",
    "807 560 12 12 re f",
    "23 23 12 12 re f",
    "807 23 12 12 re f",

    // Top Header Banner
    isTampered ? "0.95 0.85 0.85 rg" : "0.97 0.95 0.90 rg",
    "32 525 778 35 re f",
    "Q",

    // Top Banner Text
    "BT",
    isTampered ? "0.85 0.15 0.15 rg" : "0.68 0.52 0.15 rg",
    "/F2 10 Tf",
    "210 538 Td",
    `(${bannerText}) Tj`,
    "ET",

    // Institution Name
    "BT",
    "0.15 0.15 0.15 rg",
    "/F2 20 Tf",
    "240 480 Td",
    `(${institution}) Tj`,
    "ET",

    // Main Heading: CERTIFICATE OF ACHIEVEMENT
    "BT",
    "0.76 0.60 0.20 rg",
    "/F2 26 Tf",
    "215 435 Td",
    "(CERTIFICATE OF ACHIEVEMENT) Tj",
    "ET",

    // Subtitle
    "BT",
    "0.40 0.40 0.40 rg",
    "/F3 13 Tf",
    "310 395 Td",
    "(THIS IS PROUDLY CONFERRED UPON) Tj",
    "ET",

    // Recipient Name
    "BT",
    isTampered ? "0.82 0.15 0.15 rg" : "0.10 0.10 0.10 rg",
    "/F2 24 Tf",
    "240 355 Td",
    `(${student}) Tj`,
    "ET",

    // Gold Divider line under recipient name
    "q",
    "0.78 0.62 0.22 RG",
    "1.5 w",
    "200 345 m 642 345 l S",
    "Q",

    // Achievement text
    "BT",
    "0.30 0.30 0.30 rg",
    "/F1 12 Tf",
    "120 315 Td",
    `(${achievement}) Tj`,
    "ET",

    // Course / Degree Name
    "BT",
    "0.76 0.58 0.18 rg",
    "/F2 16 Tf",
    "240 280 Td",
    `(${course}) Tj`,
    "ET",

    // Left Column: Metadata
    "BT",
    "0.25 0.25 0.25 rg",
    "/F1 11 Tf",
    "60 170 Td",
    `(Certificate Reference: ${certId}) Tj`,
    "0 -20 Td",
    `(Issue Date: ${date}) Tj`,
    "0 -20 Td",
    "(Blockchain Anchor: Ethereum Smart Contract Registry) Tj",
    "ET",

    // Right Column: Signatures & Notary
    "q",
    "0.60 0.60 0.60 RG",
    "1 w",
    "520 160 m 740 160 l S",
    "Q",
    "BT",
    "0.25 0.25 0.25 rg",
    "/F1 10 Tf",
    "560 145 Td",
    "(Authorized University Dean) Tj",
    "0 -15 Td",
    "/F3 9 Tf",
    "(ChainProof Cryptographic Notary) Tj",
    "ET",

    // Bottom Disclaimer Banner
    "BT",
    isTampered ? "0.85 0.15 0.15 rg" : "0.65 0.50 0.15 rg",
    "/F2 10 Tf",
    "160 45 Td",
    `(${bannerText}) Tj`,
    "ET",
  ];

  const streamContent = streamLines.join("\n");
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(streamContent);
  const streamLength = streamBytes.length;

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];

  function addObj(str: string) {
    offsets.push(encoder.encode(out).length);
    out += str + "\n";
  }

  // 1: Catalog
  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  // 2: Pages
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  // 3: Page (842 x 595 landscape)
  addObj(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> >> >>\nendobj"
  );
  // 4: Contents Stream
  addObj(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);
  // 5: Font F1 (Helvetica)
  addObj("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  // 6: Font F2 (Helvetica-Bold)
  addObj("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");
  // 7: Font F3 (Helvetica-Oblique)
  addObj("7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj");

  const startxref = encoder.encode(out).length;
  out += "xref\n0 8\n";
  out += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    out += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  out += "trailer\n<< /Size 8 /Root 1 0 R >>\n";
  out += "startxref\n" + startxref + "\n%%EOF\n";

  const pdfBytes = encoder.encode(out);
  const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  const hashResult = await computeBufferSha256(pdfBytes);

  return {
    pdfBytes,
    pdfBlob,
    sha256Hex: hashResult.sha256Hex,
    bytes32: hashResult.bytes32,
    fileSizeBytes: pdfBytes.length,
  };
}

/**
 * Triggers a browser file download for a generated PDF Blob
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a unique demo certificate reference ID (e.g. CERT-DEMO-2026-A1B2)
 */
export function generateDemoCertId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-DEMO-${year}-${rand}`;
}
