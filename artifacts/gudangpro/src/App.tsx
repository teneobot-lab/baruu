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

// QA-1 fix: Global error boundary for catching runtime React errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service if available
    console.error("React ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="max-w-md w-full bg-card border border-destructive/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-lg font-bold text-destructive mb-2">
              Terjadi Kesalahan Tak Terduga
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              Aplikasi mengalami crash. Silakan refresh halaman atau hubungi administrator.
            </p>
            {this.state.error && (
              <details className="text-left bg-muted rounded-lg p-3 mb-4">
                <summary className="text-xs font-medium cursor-pointer mb-1">Detail Error</summary>
                <pre className="text-xs text-destructive overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;