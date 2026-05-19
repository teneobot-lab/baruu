import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  role: string;
}

const JWT_SECRET =
  process.env["JWT_SECRET"] ??
  (() => {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error(
        "JWT_SECRET environment variable must be set in production",
      );
    }
    // Unsafe default for local development only
    return "gudangpro-dev-secret-do-not-use-in-production";
  })();

const JWT_EXPIRES_IN = "7d";

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}