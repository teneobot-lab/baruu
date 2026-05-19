import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/auth";
import { createToken, type TokenPayload } from "../lib/jwt";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  if (user.status === "INACTIVE") {
    return res.status(401).json({ error: "Akun tidak aktif" });
  }

  // Generate JWT
  const payload: TokenPayload = { userId: user.id, role: user.role };
  const token = createToken(payload);

  // Set httpOnly cookie for browser clients
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  res.cookie("gp_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: maxAgeMs,
    path: "/",
  });

  return res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    token, // also return in body for non-browser clients
  });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("gp_token", { path: "/" });
  return res.json({ success: true });
});

export default router;