import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Resume from "./pages/Resume";
import ExamSetup from "./pages/ExamSetup";
import ExamTaking from "./pages/ExamTaking";
import ExamResults from "./pages/ExamResults";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import MentorCategory from "./pages/MentorCategory";
import FinanceDashboard from "./pages/FinanceDashboard";
import BudgetPlanner from "./pages/BudgetPlanner";
import InvestmentPlanner from "./pages/InvestmentPlanner";
import FinancialGoals from "./pages/FinancialGoals";
import CodingPlayground from "./pages/CodingPlayground";
import Analytics from "./pages/Analytics";
import { usePageTracking } from "./hooks/usePageTracking";

const queryClient = new QueryClient();


const AppContent = () => {
  usePageTracking();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/exam-setup" element={<ExamSetup />} />
      <Route path="/exam/:examId" element={<ExamTaking />} />
      <Route path="/exam-results/:examId" element={<ExamResults />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/mentor/:category" element={<MentorCategory />} />
      <Route path="/finance/dashboard" element={<FinanceDashboard />} />
      <Route path="/finance/budget" element={<BudgetPlanner />} />
      <Route path="/finance/investments" element={<InvestmentPlanner />} />
      <Route path="/finance/goals" element={<FinancialGoals />} />
      <Route path="/coding-playground" element={<CodingPlayground />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
