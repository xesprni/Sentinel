import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import FlowV1Page from "@/pages/flow-v1";
import FlowV2Page from "@/pages/flow-v2";
import DegradePage from "@/pages/degrade";
import SystemPage from "@/pages/system";
import AuthorityPage from "@/pages/authority";
import ParamFlowPage from "@/pages/param-flow";
import MetricPage from "@/pages/metric";
import IdentityPage from "@/pages/identity";
import MachinePage from "@/pages/machine";
import ClusterServerListPage from "@/pages/cluster/server-list";
import ClusterClientListPage from "@/pages/cluster/client-list";
import ClusterAssignManagePage from "@/pages/cluster/assign-manage";
import ClusterSingleConfigPage from "@/pages/cluster/single-config";
import GatewayIdentityPage from "@/pages/gateway/identity";
import GatewayApiPage from "@/pages/gateway/api-management";
import GatewayFlowPage from "@/pages/gateway/flow";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedLayout() {
  return <AppLayout />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard/home" element={<HomePage />} />

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
        </HashRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
