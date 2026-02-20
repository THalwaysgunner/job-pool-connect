import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/layouts/AdminLayout";
import ClientLayout from "@/layouts/ClientLayout";
import ProviderLayout from "@/layouts/ProviderLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminJobs from "@/pages/admin/AdminJobs";
import AdminCompanies from "@/pages/admin/AdminCompanies";
import AdminLegal from "@/pages/admin/AdminLegal";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import ClientDashboard from "@/pages/client/ClientDashboard";
import ClientSettings from "@/pages/client/ClientSettings";
import ClientJobs from "@/pages/client/ClientJobs";
import CreateJobWizard from "@/pages/client/CreateJobWizard";
import ProviderDashboard from "@/pages/provider/ProviderDashboard";
import ProviderPool from "@/pages/provider/ProviderPool";
import ProviderJobs from "@/pages/provider/ProviderJobs";
import JobDetailPage from "@/pages/shared/JobDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/jobs" element={<AdminJobs />} />
                  <Route path="/admin/jobs/:id" element={<JobDetailPage role="admin" />} />
                  <Route path="/admin/companies" element={<AdminCompanies />} />
                  <Route path="/admin/legal" element={<AdminLegal />} />
                  <Route path="/admin/alerts" element={<AdminAlerts />} />
                </Route>
              </Route>

              {/* Client routes */}
              <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
                <Route element={<ClientLayout />}>
                  <Route path="/client" element={<ClientDashboard />} />
                  <Route path="/client/settings" element={<ClientSettings />} />
                  <Route path="/client/jobs" element={<ClientJobs />} />
                  <Route path="/client/jobs/new" element={<CreateJobWizard />} />
                  <Route path="/client/jobs/:id" element={<JobDetailPage role="client" />} />
                </Route>
              </Route>

              {/* Provider routes */}
              <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
                <Route element={<ProviderLayout />}>
                  <Route path="/provider" element={<ProviderDashboard />} />
                  <Route path="/provider/pool" element={<ProviderPool />} />
                  <Route path="/provider/jobs" element={<ProviderJobs />} />
                  <Route path="/provider/jobs/:id" element={<JobDetailPage role="provider" />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
