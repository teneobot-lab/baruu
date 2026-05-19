import { pgTable, text, date, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { itemsTable } from "./items";
import { warehousesTable } from "./warehouses";
import { partnersTable } from "./partners";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", ["IN", "OUT", "TRANSFER", "ADJUSTMENT"]);

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  referenceNo: text("reference_no").notNull().unique(),
  type: transactionTypeEnum("type").notNull(),
  date: date("date").notNull(),
  sourceWarehouseId: text("source_warehouse_id").notNull().references(() => warehousesTable.id),
  targetWarehouseId: text("target_warehouse_id").references(() => warehousesTable.id),
  partnerId: text("partner_id").references(() => partnersTable.id),
  partnerName: text("partner_name"),
  deliveryOrderNo: text("delivery_order_no"),
  notes: text("notes"),
  createdBy: text("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactionItemsTable = pgTable("transaction_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  transactionId: text("transaction_id").notNull().references(() => transactionsTable.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => itemsTable.id),
  qty: numeric("qty", { precision: 15, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  conversionRatio: numeric("conversion_ratio", { precision: 10, scale: 4 }).notNull(),
  baseQty: numeric("base_qty", { precision: 15, scale: 4 }).notNull(),
  note: text("note"),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ createdAt: true });
export const insertTransactionItemSchema = createInsertSchema(transactionItemsTable);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
export type TransactionItem = typeof transactionItemsTable.$inferSelect;
