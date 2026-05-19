import { pgTable, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";
import { warehousesTable } from "./warehouses";

export const stockTable = pgTable("stock", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  warehouseId: text("warehouse_id").notNull().references(() => warehousesTable.id),
  itemId: text("item_id").notNull().references(() => itemsTable.id),
  qty: numeric("qty", { precision: 15, scale: 4 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockSchema = createInsertSchema(stockTable).omit({ lastUpdated: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stockTable.$inferSelect;
