import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import { MainLayout } from "./components/layout/MainLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import TransactionsPage from "./pages/TransactionsPage";
import RejectPage from "./pages/RejectPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { session } = useAuth();
  if (!session) return <Redirect to="/login" />;
  return <Component />;
}

function AppRouter() {
  const { session } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/inventory">
        <ProtectedRoute component={InventoryPage} />
      </Route>
      <Route path="/transaksi">
        <ProtectedRoute component={TransactionsPage} />
      </Route>
      <Route path="/reject">
        <ProtectedRoute component={RejectPage} />
      </Route>
      <Route path="/pengaturan">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route path="/">
        {session ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
      <Route>
        {session ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}>
            <MainLayout>
              <AppRouter />
            </MainLayout>
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
