import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warehousesTable = pgTable("warehouses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  pic: text("pic"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertWarehouseSchema = createInsertSchema(warehousesTable);
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehousesTable.$inferSelect;
