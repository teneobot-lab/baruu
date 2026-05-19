import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playlistsTable = pgTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const songsTable = pgTable("songs", {
  id: text("id").primaryKey(),
  playlistId: text("playlist_id").notNull().references(() => playlistsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlistsTable).omit({ createdAt: true });
export const insertSongSchema = createInsertSchema(songsTable).omit({ createdAt: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Playlist = typeof playlistsTable.$inferSelect;
export type Song = typeof songsTable.$inferSelect;
