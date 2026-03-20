import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ReportProvider } from "./contexts/ReportContext";
import { ProductProvider } from "./contexts/ProductContext";
import { SalesProvider } from "./contexts/SalesContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { QuoteProvider } from "./contexts/QuoteContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Quotes from "./pages/Quotes";
import Finances from "./pages/Finances";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/sales" replace />;
  return <>{children}</>;
}

function AssistantOrAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'assistant') return <Navigate to="/sales" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuth();
  const defaultRoute = currentUser?.role === 'admin' ? <Index /> : <Navigate to="/sales" replace />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute>{defaultRoute}</ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
      <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
      <Route path="/finances" element={<AdminRoute><Finances /></AdminRoute>} />
      <Route path="/expenses" element={<AssistantOrAdminRoute><Expenses /></AssistantOrAdminRoute>} />
      <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <CategoryProvider>
            <ProductProvider>
              <SalesProvider>
                <FinanceProvider>
                  <QuoteProvider>
                    <NotificationProvider>
                      <ReportProvider>
                        <Toaster />
                        <Sonner />
                        <AppRoutes />
                      </ReportProvider>
                    </NotificationProvider>
                  </QuoteProvider>
                </FinanceProvider>
              </SalesProvider>
            </ProductProvider>
          </CategoryProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
