import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import MyProjects from "./pages/MyProjects";
import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import ExchangeAllWebsites from "./pages/ExchangeAllWebsites";
import RequestsPage from "./pages/RequestsPage";
import MarketplaceWebsites from "./pages/MarketplaceWebsites";
import MarketplaceOrders from "./pages/MarketplaceOrders";
import ViewTransactions from "./pages/ViewTransactions";
import HelpCenter from "./pages/HelpCenter";
import Settings from "./pages/Settings";
import Writerate from "./pages/Writerate";
import RequestSuggestions from "./pages/RequestSuggestions";
import AddCredits from "./pages/AddCredits";
import Upgrade from "./pages/Upgrade";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<MyProjects />} />

          {/* Existing Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-project" element={<AddProject />} />
          <Route path="/exchange/websites" element={<ExchangeAllWebsites />} />
          <Route path="/exchange/incoming" element={<RequestsPage type="incoming" />} />
          <Route path="/exchange/outgoing" element={<RequestsPage type="outgoing" />} />
          <Route path="/marketplace/websites" element={<MarketplaceWebsites />} />
          <Route path="/marketplace/orders" element={<MarketplaceOrders />} />
          <Route path="/transactions" element={<ViewTransactions />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/writerate" element={<Writerate />} />
          <Route path="/exchange/suggestions" element={<RequestSuggestions />} />
          <Route path="/credits/add" element={<AddCredits />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;