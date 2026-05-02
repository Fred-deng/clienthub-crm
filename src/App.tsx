import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/context/CurrentUserContext";
import { useIsMobile } from "@/hooks/use-mobile";
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

import MobileLayout from "./mobile/MobileLayout";
import MDashboard from "./mobile/pages/MDashboard";
import MCustomers from "./mobile/pages/MCustomers";
import MContacts from "./mobile/pages/MContacts";
import MFollowUps from "./mobile/pages/MFollowUps";
import MProducts from "./mobile/pages/MProducts";
import MSuppliers from "./mobile/pages/MSuppliers";
import MPurchases from "./mobile/pages/MPurchases";
import MSales from "./mobile/pages/MSales";
import MPayments from "./mobile/pages/MPayments";
import MReceivables from "./mobile/pages/MReceivables";
import MPayables from "./mobile/pages/MPayables";
import MReconciliation from "./mobile/pages/MReconciliation";

const queryClient = new QueryClient();

// 自动跳转：手机访问 PC 路由 → /m，桌面访问 /m → 对应 PC 路由
function ResponsiveRedirect() {
  const isMobile = useIsMobile();
  const loc = useLocation();
  useEffect(() => {
    const onMobileRoute = loc.pathname.startsWith("/m");
    if (isMobile && !onMobileRoute) {
      // 仅首次进入时跳转（用户也可以在 PC 路由间手动操作）
      const map: Record<string, string> = {
        "/": "/m", "/customers": "/m/customers", "/contacts": "/m/contacts",
        "/follow-ups": "/m/follow-ups", "/products": "/m/products", "/suppliers": "/m/suppliers",
        "/purchases": "/m/purchases", "/sales": "/m/sales", "/payments": "/m/payments",
        "/receivables": "/m/receivables", "/payables": "/m/payables", "/reconciliation": "/m/reconciliation",
      };
      const target = map[loc.pathname];
      if (target) window.history.replaceState(null, "", target);
    }
  }, [isMobile, loc.pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CurrentUserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ResponsiveRedirect />
          <Routes>
            {/* 移动端独立路由 */}
            <Route path="/m" element={<MobileLayout />}>
              <Route index element={<MDashboard />} />
              <Route path="customers" element={<MCustomers />} />
              <Route path="contacts" element={<MContacts />} />
              <Route path="follow-ups" element={<MFollowUps />} />
              <Route path="products" element={<MProducts />} />
              <Route path="suppliers" element={<MSuppliers />} />
              <Route path="purchases" element={<MPurchases />} />
              <Route path="sales" element={<MSales />} />
              <Route path="payments" element={<MPayments />} />
              <Route path="receivables" element={<MReceivables />} />
              <Route path="payables" element={<MPayables />} />
              <Route path="reconciliation" element={<MReconciliation />} />
            </Route>

            {/* PC 路由 */}
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
