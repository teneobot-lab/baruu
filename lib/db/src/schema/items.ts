import { pgTable, text, boolean, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const operatorEnum = pgEnum("unit_operator", ["*", "/"]);

export const itemsTable = pgTable("items", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  baseUnit: text("base_unit").notNull(),
  minStock: numeric("min_stock", { precision: 15, scale: 4 }).default("0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const itemUnitsTable = pgTable("item_units", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  itemId: text("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  unitName: text("unit_name").notNull(),
  conversionRatio: numeric("conversion_ratio", { precision: 10, scale: 4 }).notNull(),
  operator: operatorEnum("operator").default("*").notNull(),
});

export const insertItemSchema = createInsertSchema(itemsTable)
  .omit({ createdAt: true })
  .extend({
    conversions: z.array(z.object({
      unitName: z.string(),
      conversionRatio: z.number(),
      operator: z.enum(["*", "/"]).optional(),
    })).optional(),
  });
export const insertItemUnitSchema = createInsertSchema(itemUnitsTable);
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertItemUnit = z.infer<typeof insertItemUnitSchema>;
export type Item = typeof itemsTable.$inferSelect;
export type ItemUnit = typeof itemUnitsTable.$inferSelect;
