import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [location] = useLocation();

  const isAuth = location === "/login" || !session;
  if (isAuth) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
