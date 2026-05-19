import { pgTable, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerTypeEnum = pgEnum("partner_type", ["SUPPLIER", "CUSTOMER"]);

export const partnersTable = pgTable("partners", {
  id: text("id").primaryKey(),
  type: partnerTypeEnum("type").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  npwp: text("npwp"),
  termDays: integer("term_days").default(0),
});

export const insertPartnerSchema = createInsertSchema(partnersTable);
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partnersTable.$inferSelect;
