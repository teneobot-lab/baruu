import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gudangpro_salt").digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Username atau password salah" });
  }

  if (user.status === "INACTIVE") {
    return res.status(401).json({ error: "Akun tidak aktif" });
  }

  return res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  });
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ success: true });
});

export default router;
