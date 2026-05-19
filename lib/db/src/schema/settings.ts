import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemSettingsTable = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettingsTable);
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettingsTable.$inferSelect;
