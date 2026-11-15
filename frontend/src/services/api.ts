const API_BASE = "/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("chainproof_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "An error occurred during API request");
  }
  return data;
}

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<any>(res);
  },

  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return handleResponse<{ success: boolean; token: string; user: any }>(res);
  },

  async registerIssuer(data: {
    email: string;
    password: string;
    institutionName: string;
    accreditationNumber: string;
    walletAddress: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register-issuer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean; message: string; status: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; user: any }>(res);
  },

  logout() {
    localStorage.removeItem("chainproof_token");
    localStorage.removeItem("chainproof_user");
  },

  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; data: any }>(res);
  },

  async getAdminIssuers() {
    const res = await fetch(`${API_BASE}/admin/issuers`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; issuers: any[] }>(res);
  },

  async approveIssuer(id: number) {
    const res = await fetch(`${API_BASE}/admin/issuers/${id}/approve`, {
      method: "POST",
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; message: string; txHash?: string; blockNumber?: number }>(res);
  },

  async rejectIssuer(id: number, reason: string) {
    const res = await fetch(`${API_BASE}/admin/issuers/${id}/reject`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },

  async revokeIssuer(id: number, reason: string) {
    const res = await fetch(`${API_BASE}/admin/issuers/${id}/revoke`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ success: boolean; message: string; txHash?: string; blockNumber?: number }>(res);
  },

  async getAdminRegistrations() {
    const res = await fetch(`${API_BASE}/admin/registrations`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; registrations: any[] }>(res);
  },

  async getAdminAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; logs: any[] }>(res);
  },

  // Issuer
  async getIssuerStatus() {
    const res = await fetch(`${API_BASE}/issuer/status`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; issuer: any; onChain: any; statistics: any }>(res);
  },

  async previewCertificateHash(file: File) {
    const formData = new FormData();
    formData.append("certificateFile", file);
    const res = await fetch(`${API_BASE}/certificates/preview-hash`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse<{ success: boolean; data: any }>(res);
  },

  async registerCertificate(formData: FormData) {
    const res = await fetch(`${API_BASE}/certificates/register`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse<{ success: boolean; message: string; data: any }>(res);
  },

  async getIssuerRegistrations() {
    const res = await fetch(`${API_BASE}/certificates/registrations`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ success: boolean; registrations: any[] }>(res);
  },

  async revokeCertificate(id: number, reason: string) {
    const res = await fetch(`${API_BASE}/certificates/${id}/revoke`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<{ success: boolean; message: string; txHash?: string }>(res);
  },

  // Verification (Public)
  async verifyCertificateFile(file: File, expectedHash?: string, expectedRef?: string) {
    const formData = new FormData();
    formData.append("certificateFile", file);
    if (expectedHash) formData.append("expectedHash", expectedHash);
    if (expectedRef) formData.append("expectedRef", expectedRef);

    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<{ success: boolean; data: any }>(res);
  },

  async verifyCertificateHash(hashInput: string, expectedHash?: string) {
    const res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certHash: hashInput, expectedHash }),
    });
    return handleResponse<{ success: boolean; data: any }>(res);
  },

  async queryHashDirect(hash: string) {
    const res = await fetch(`${API_BASE}/verify/${hash}`);
    return handleResponse<{ success: boolean; data: any }>(res);
  },
};
