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
import ReportsPage from "./pages/ReportsPage"; // Nouveau
import MainLayout from "./components/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/work-orders" element={<WorkOrdersPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/technicians" element={<TechniciansPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;