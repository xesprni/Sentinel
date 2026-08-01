import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { lazy, Suspense, useEffect, useState } from "react";

const LoginPage = lazy(() => import("@/pages/login"));
const HomePage = lazy(() => import("@/pages/home"));
const FlowV1Page = lazy(() => import("@/pages/flow-v1"));
const FlowV2Page = lazy(() => import("@/pages/flow-v2"));
const DegradePage = lazy(() => import("@/pages/degrade"));
const SystemPage = lazy(() => import("@/pages/system"));
const AuthorityPage = lazy(() => import("@/pages/authority"));
const ParamFlowPage = lazy(() => import("@/pages/param-flow"));
const MetricPage = lazy(() => import("@/pages/metric"));
const IdentityPage = lazy(() => import("@/pages/identity"));
const MachinePage = lazy(() => import("@/pages/machine"));
const ClusterServerListPage = lazy(() => import("@/pages/cluster/server-list"));
const ClusterClientListPage = lazy(() => import("@/pages/cluster/client-list"));
const ClusterAssignManagePage = lazy(() => import("@/pages/cluster/assign-manage"));
const ClusterSingleConfigPage = lazy(() => import("@/pages/cluster/single-config"));
const GatewayIdentityPage = lazy(() => import("@/pages/gateway/identity"));
const GatewayApiPage = lazy(() => import("@/pages/gateway/api-management"));
const GatewayFlowPage = lazy(() => import("@/pages/gateway/flow"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, check } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    check().finally(() => setChecking(false));
  }, [check]);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [checking, isAuthenticated, navigate]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard/home" element={<HomePage />} />
        <Route path="/dashboard/home/:app" element={<HomePage />} />

        {/* Core rule pages */}
        <Route path="/dashboard/flow/:app" element={<FlowV1Page />} />
        <Route path="/dashboard/v2/flow/:app" element={<FlowV2Page />} />
        <Route path="/dashboard/degrade/:app" element={<DegradePage />} />
        <Route path="/dashboard/system/:app" element={<SystemPage />} />
        <Route path="/dashboard/authority/:app" element={<AuthorityPage />} />
        <Route path="/dashboard/paramFlow/:app" element={<ParamFlowPage />} />

        {/* Monitoring */}
        <Route path="/dashboard/metric/:app" element={<MetricPage />} />
        <Route path="/dashboard/identity/:app" element={<IdentityPage />} />

        {/* Machine */}
        <Route path="/dashboard/app/:app" element={<MachinePage />} />

        {/* Cluster flow control */}
        <Route path="/dashboard/cluster/server/:app" element={<ClusterServerListPage />} />
        <Route path="/dashboard/cluster/client/:app" element={<ClusterClientListPage />} />
        <Route path="/dashboard/cluster/assign_manage/:app" element={<ClusterAssignManagePage />} />
        <Route path="/dashboard/cluster/single/:app" element={<ClusterSingleConfigPage />} />

        {/* Gateway */}
        <Route path="/dashboard/gateway/identity/:app" element={<GatewayIdentityPage />} />
        <Route path="/dashboard/gateway/api/:app" element={<GatewayApiPage />} />
        <Route path="/dashboard/gateway/flow/:app" element={<GatewayFlowPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
      </Routes>
    </Suspense>
  );
}

function PageLoading() {
  return <div className="flex min-h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
