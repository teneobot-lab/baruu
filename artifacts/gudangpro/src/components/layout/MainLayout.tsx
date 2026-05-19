import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AmbientBlobs } from "@/components/ui/AmbientBlobs";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [location] = useLocation();

  const isAuth = location === "/login" || !session;
  if (isAuth) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #dde8f5 0%, #e8eef8 40%, #d6e4f0 100%)",
          minHeight: "100vh",
          position: "relative",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <AmbientBlobs />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #dde8f5 0%, #e8eef8 40%, #d6e4f0 100%)",
        minHeight: "100vh",
        position: "relative",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <AmbientBlobs />
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Sidebar />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
          <Topbar />
          <main
            className="glass-page-enter"
            style={{
              flex: 1,
              overflow: "auto",
              padding: "20px 24px",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}