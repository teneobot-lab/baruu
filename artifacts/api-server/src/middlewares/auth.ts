import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../lib/jwt";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

interface AuthOptions {
  roles?: string[];
}

/**
 * Middleware that requires a valid JWT token.
 * Supports optional role-based access control.
 */
export function requireAuth(options: AuthOptions = {}) {
  const { roles } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Try to get token from cookie first, then Authorization header
    let token: string | undefined = req.cookies?.gp_token;

    if (!token) {
      const authHeader = req.headers["authorization"];
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      res.status(401).json({ error: "Token autentikasi diperlukan" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa" });
      return;
    }

    if (roles && roles.length > 0 && !roles.includes(payload.role)) {
      res.status(403).json({ error: "Akses ditolak — role tidak diizinkan" });
      return;
    }

    req.user = payload;
    next();
  };
}

/**
 * Optional auth — attaches user if token is valid, but does NOT block
 * if token is missing. Useful for endpoints that behave differently
 * for authenticated vs anonymous callers.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token =
    req.cookies?.gp_token ??
    ((): string | undefined => {
      const authHeader = req.headers["authorization"];
      return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    })();

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}