import React from "react";
import { AuthSession } from "@workspace/api-client-react";

export const SESSION_KEY = "gp_session";

export function getSession(): AuthSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export const AuthContext = React.createContext<{
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}>({
  session: null,
  setSession: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = React.useState<AuthSession | null>(getSession());

  const handleSetSession = React.useCallback((newSession: AuthSession | null) => {
    setSession(newSession);
    setSessionState(newSession);
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession: handleSetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
