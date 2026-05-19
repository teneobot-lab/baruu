/**
 * Centralized API client for GudangPro frontend.
 * Exports a configured fetch instance that automatically:
 * - Uses VITE_API_URL as the base URL (falls back to relative path for dev proxy)
 * - Attaches JWT token from auth context when available
 * - Handles 401 responses by clearing the session
 *
 * Usage:
 *   import { apiClient } from "@/lib/api";
 *   const data = await apiClient.get("/api/dashboard/summary");
 */

import { setBaseUrl, setAuthTokenGetter, customFetch } from "@workspace/api-client-react";

// Base URL from environment
const apiBaseUrl =
  typeof import.meta.env["VITE_API_URL"] === "string"
    ? import.meta.env["VITE_API_URL"]
    : ""; // Use relative path (dev server proxy handles routing)

if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
}

// Token getter reads from localStorage (same key as AuthContext)
function getToken(): string | null {
  try {
    const raw = localStorage.getItem("gp_session");
    if (!raw) return null;
    const session = JSON.parse(raw) as { token?: string };
    return session.token ?? null;
  } catch {
    return null;
  }
}

setAuthTokenGetter(getToken);

/**
 * Wrapper around customFetch that:
 * - Handles 401 by clearing session and redirecting to /login
 * - Returns parsed JSON on success
 */
async function apiFetch<T>(
  input: RequestInfo | URL,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await customFetch<T>(input, options);
  } catch (err: unknown) {
    // Handle 401 — clear session and redirect
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status: number }).status === 401
    ) {
      localStorage.removeItem("gp_session");
      window.location.href = "/login";
      throw err;
    }
    throw err;
  }
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    return apiFetch<T>(url, { method: "GET" });
  },

  async post<T>(url: string, body: unknown): Promise<T> {
    return apiFetch<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  async put<T>(url: string, body: unknown): Promise<T> {
    return apiFetch<T>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },

  async delete<T>(url: string): Promise<T> {
    return apiFetch<T>(url, { method: "DELETE" });
  },
};

/**
 * Fetcher factory for use with @tanstack/react-query.
 * Handles 401 globally by redirecting to login.
 */
export function createQueryFetcher<T>(url: string): () => Promise<T> {
  return async () => {
    try {
      return await apiClient.get<T>(url);
    } catch (err: unknown) {
      // Let the caller handle it — do not swallow errors in query hooks
      throw err;
    }
  };
}