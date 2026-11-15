const fs = require("fs");
const path = require("path");

const certDir = path.join(__dirname, "../sample-certificates");
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

function createSimplePdf(content, studentName, degree, serial) {
  // Generates valid, compliant PDF structure with %PDF-1.4 header
  const body = `BT
/F1 20 Tf
100 700 Td
(CHAINPROOF OFFICIAL DEMO CERTIFICATE) Tj
0 -40 Td
/F1 14 Tf
(This is to certify that) Tj
0 -30 Td
/F1 18 Tf
(${studentName}) Tj
0 -40 Td
/F1 14 Tf
(has successfully completed the requirements for) Tj
0 -30 Td
/F1 16 Tf
(${degree}) Tj
0 -40 Td
/F1 11 Tf
(Institution: Apex State University) Tj
0 -20 Td
(Credential Reference: ${serial}) Tj
0 -20 Td
(Issued on: 2026-10-21) Tj
ET`;

  const streamLength = body.length;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${body}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

// 1. Genuine Certificate
const genuinePdf = createSimplePdf(
  "Genuine Degree Certificate",
  "Maya Chen",
  "Bachelor of Science in Computer Science",
  "CERT-APEX-2026-001"
);
fs.writeFileSync(path.join(certDir, "Maya_Chen_CS_Degree_GENUINE.pdf"), genuinePdf);

// 2. Tampered Certificate (altered name or grade, different bytes)
const tamperedPdf = createSimplePdf(
  "Tampered Degree Certificate",
  "Maya Chen [ALTERED FORGERY - 4.0 GPA MODIFIED]",
  "Bachelor of Science in Computer Science",
  "CERT-APEX-2026-001"
);
fs.writeFileSync(path.join(certDir, "Maya_Chen_CS_Degree_TAMPERED.pdf"), tamperedPdf);

// 3. Unregistered Certificate
const unregisteredPdf = createSimplePdf(
  "Unregistered Certificate",
  "Alex Rivera",
  "Master of Cybersecurity",
  "CERT-UNREG-2026-999"
);
fs.writeFileSync(path.join(certDir, "Alex_Rivera_Cyber_UNREGISTERED.pdf"), unregisteredPdf);

console.log("Created demo sample PDF certificates inside ./sample-certificates/:");
console.log("  1. Maya_Chen_CS_Degree_GENUINE.pdf");
console.log("  2. Maya_Chen_CS_Degree_TAMPERED.pdf");
console.log("  3. Alex_Rivera_Cyber_UNREGISTERED.pdf");
