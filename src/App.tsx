import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import PlanningPage from "./pages/PlanningPage";
import ContractsPage from "./pages/ContractsPage";
import TechniciansPage from "./pages/TechniciansPage";
import ReportsPage from "./pages/ReportsPage";
import ClientsPage from "./pages/ClientsPage";
import InventoryPage from "./pages/InventoryPage";
import ToolsPage from "./pages/ToolsPage"; // Import tools page
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import ReagentsPage from "./pages/ReagentsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/work-orders" element={<WorkOrdersPage />} />
                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/technicians" element={<TechniciansPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/reagents" element={<ReagentsPage />} />
                <Route path="/tools" element={<ToolsPage />} /> {/* New tools route */}
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;