import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { VerifyPage } from "./pages/VerifyPage";
import { ReceiptPage } from "./pages/ReceiptPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterIssuerPage } from "./pages/RegisterIssuerPage";
import { GenerateCertificatePage } from "./pages/GenerateCertificatePage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { IssuerDashboard } from "./pages/IssuerDashboard";
import { SettingsPage } from "./pages/SettingsPage";

// Protected Route Helpers
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-xs text-neutral-400">Loading session...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const IssuerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-xs text-neutral-400">Loading session...</div>;
  if (!user || user.role !== "issuer") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-xs text-neutral-400">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-[#080B0A] text-[#F3F4F6]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/generate" element={<GenerateCertificatePage />} />
              <Route path="/generator" element={<Navigate to="/generate" replace />} />
              <Route path="/receipt" element={<ReceiptPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register-issuer" element={<RegisterIssuerPage />} />

              {/* Protected Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/issuer"
                element={
                  <IssuerRoute>
                    <IssuerDashboard />
                  </IssuerRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <AuthenticatedRoute>
                    <SettingsPage />
                  </AuthenticatedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
