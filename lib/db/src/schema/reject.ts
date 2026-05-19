import { pgTable, text, date, bigint, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { operatorEnum } from "./items";

export const rejectOutletsTable = pgTable("reject_outlets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
});

export const rejectItemsMasterTable = pgTable("reject_items_master", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  baseUnit: text("base_unit").notNull(),
});

export const rejectItemUnitsTable = pgTable("reject_item_units", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  itemId: text("item_id").notNull().references(() => rejectItemsMasterTable.id, { onDelete: "cascade" }),
  unitName: text("unit_name").notNull(),
  conversionRatio: numeric("conversion_ratio", { precision: 10, scale: 4 }).notNull(),
  operator: operatorEnum("operator").default("*").notNull(),
});

export const rejectBatchesTable = pgTable("reject_batches", {
  id: text("id").primaryKey(),
  date: date("date").notNull(),
  outlet: text("outlet").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const rejectBatchItemsTable = pgTable("reject_batch_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  batchId: text("batch_id").notNull().references(() => rejectBatchesTable.id, { onDelete: "cascade" }),
  itemId: text("item_id"),
  sku: text("sku"),
  name: text("name"),
  qty: numeric("qty", { precision: 15, scale: 4 }),
  unit: text("unit"),
  baseQty: numeric("base_qty", { precision: 15, scale: 4 }),
  reason: text("reason"),
  inputQty: numeric("input_qty", { precision: 15, scale: 4 }),
  inputUnit: text("input_unit"),
});

export const insertRejectOutletSchema = createInsertSchema(rejectOutletsTable);
export const insertRejectMasterItemSchema = createInsertSchema(rejectItemsMasterTable);
export const insertRejectBatchSchema = createInsertSchema(rejectBatchesTable);
export const insertRejectBatchItemSchema = createInsertSchema(rejectBatchItemsTable);

export type InsertRejectOutlet = z.infer<typeof insertRejectOutletSchema>;
export type InsertRejectMasterItem = z.infer<typeof insertRejectMasterItemSchema>;
export type InsertRejectBatch = z.infer<typeof insertRejectBatchSchema>;
export type InsertRejectBatchItem = z.infer<typeof insertRejectBatchItemSchema>;
export type RejectOutlet = typeof rejectOutletsTable.$inferSelect;
export type RejectMasterItem = typeof rejectItemsMasterTable.$inferSelect;
export type RejectBatch = typeof rejectBatchesTable.$inferSelect;
export type RejectBatchItem = typeof rejectBatchItemsTable.$inferSelect;
