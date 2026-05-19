import React from "react";
import { AuthSession } from "@workspace/api-client-react";

export const SESSION_KEY = "gp_session";

// Session expiry: 7 days in milliseconds
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface StoredSession extends AuthSession {
  /** Unix timestamp (ms) when the session was created */
  createdAt: number;
}

export function getSession(): AuthSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;

    const session: StoredSession = JSON.parse(data);

    // Expiry check (SEC-5 fix)
    const age = Date.now() - session.createdAt;
    if (age > SESSION_EXPIRY_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Strip internal `createdAt` field before returning
    const { createdAt: _createdAt, ...publicSession } = session;
    void _createdAt;
    return publicSession as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession | null): void {
  if (session) {
    const stored: StoredSession = {
      ...session,
      createdAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
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
  const [session, setSessionState] = React.useState<AuthSession | null>(getSession);

  const handleSetSession = React.useCallback(
    (newSession: AuthSession | null) => {
      setSession(newSession);
      setSessionState(newSession);
    },
    [],
  );

  return (
    <AuthContext.Provider value={{ session, setSession: handleSetSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}