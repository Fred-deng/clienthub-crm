import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/context/CurrentUserContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Customers from "./pages/Customers";
import Contacts from "./pages/Contacts";
import FollowUps from "./pages/FollowUps";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";

import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Receivables from "./pages/Receivables";
import Payables from "./pages/Payables";

import Reconciliation from "./pages/Reconciliation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrentUserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/contracts" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/receivables" element={<Receivables />} />
            <Route path="/payables" element={<Payables />} />
            
            <Route path="/reconciliation" element={<Reconciliation />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </CurrentUserProvider>
  </QueryClientProvider>
);

export default App;
