import { Router } from "express";
import { db } from "@workspace/db";
import { playlistsTable, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/music/playlists", async (_req, res) => {
  const playlists = await db.select().from(playlistsTable).orderBy(playlistsTable.name);
  const songs = await db.select().from(songsTable).orderBy(songsTable.createdAt);

  const songMap = new Map<string, typeof songs>();
  for (const s of songs) {
    if (!songMap.has(s.playlistId)) songMap.set(s.playlistId, []);
    songMap.get(s.playlistId)!.push(s);
  }

  return res.json(playlists.map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    songs: songMap.get(p.id) ?? [],
  })));
});

router.post("/music/playlists", async (req, res) => {
  const { name } = req.body;
  const id = randomUUID();
  await db.insert(playlistsTable).values({ id, name });
  const [p] = await db.select().from(playlistsTable).where(eq(playlistsTable.id, id));
  return res.status(201).json({ ...p, songs: [] });
});

router.delete("/music/playlists/:id", async (req, res) => {
  await db.delete(playlistsTable).where(eq(playlistsTable.id, req.params.id));
  return res.json({ success: true });
});

router.post("/music/playlists/:id/songs", async (req, res) => {
  const { title, youtubeUrl } = req.body;
  const songId = randomUUID();
  await db.insert(songsTable).values({ id: songId, playlistId: req.params.id, title, youtubeUrl });
  const [s] = await db.select().from(songsTable).where(eq(songsTable.id, songId));
  return res.status(201).json(s);
});

router.delete("/music/songs/:id", async (req, res) => {
  await db.delete(songsTable).where(eq(songsTable.id, req.params.id));
  return res.json({ success: true });
});

export default router;
