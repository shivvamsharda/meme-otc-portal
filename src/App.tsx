
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import Index from "./pages/Index";
import BrowseDeals from "./pages/BrowseDeals";
import CreateDeal from "./pages/CreateDeal";
import MyDeals from "./pages/MyDeals";
import DealDetails from "./pages/DealDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SolanaWalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/deals" element={<BrowseDeals />} />
              <Route path="/create-deal" element={<CreateDeal />} />
              <Route path="/my-deals" element={<MyDeals />} />
              <Route path="/deal/:id" element={<DealDetails />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SolanaWalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
