import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import TimelinePage from './pages/TimelinePage';
import ComparisonPage from './pages/ComparisonPage';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SiteOwnerDashboardPage } from './pages/SiteOwnerDashboardPage';
import { ClientInvoicesPage } from './pages/ClientInvoicesPage';
import { ClientInvoicePaymentPage } from './pages/ClientInvoicePaymentPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Operator routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <TimelinePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compare"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <ComparisonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <PricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute requireRole="OPERATOR">
            <InvoicesPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Site Owner routes */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute requireRole="SITE_OWNER">
            <SiteOwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/invoices"
        element={
          <ProtectedRoute requireRole="SITE_OWNER">
            <ClientInvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/invoices/:id"
        element={
          <ProtectedRoute requireRole="SITE_OWNER">
            <ClientInvoicePaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/invoices/:id/pay"
        element={
          <ProtectedRoute requireRole="SITE_OWNER">
            <ClientInvoicePaymentPage />
          </ProtectedRoute>
        }
      />

      {/* 404 - Not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
