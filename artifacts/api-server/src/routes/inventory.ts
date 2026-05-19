import { Router } from "express";
import { db } from "@workspace/db";
import {
  itemsTable, itemUnitsTable, warehousesTable, partnersTable,
  usersTable, stockTable, systemSettingsTable
} from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "gudangpro_salt").digest("hex");
}

// ─── ITEMS ───────────────────────────────────────────────────────────────────

router.get("/inventory/items", async (req, res) => {
  const { category, isActive } = req.query;
  const items = await db.select().from(itemsTable)
    .where(
      isActive !== undefined
        ? eq(itemsTable.isActive, isActive === "true")
        : undefined
    )
    .orderBy(itemsTable.name);

  const units = await db.select().from(itemUnitsTable);
  const unitMap = new Map<string, typeof units>();
  for (const u of units) {
    if (!unitMap.has(u.itemId)) unitMap.set(u.itemId, []);
    unitMap.get(u.itemId)!.push(u);
  }

  const result = items
    .filter(i => !category || i.category === category)
    .map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      baseUnit: item.baseUnit,
      minStock: Number(item.minStock),
      isActive: item.isActive,
      createdAt: item.createdAt,
      conversions: (unitMap.get(item.id) ?? []).map(u => ({
        unitName: u.unitName,
        conversionRatio: Number(u.conversionRatio),
        operator: u.operator,
      })),
    }));

  return res.json(result);
});

router.post("/inventory/items", async (req, res) => {
  const { id, code, name, category, baseUnit, minStock, isActive, conversions } = req.body;
  const itemId = id || randomUUID();

  await db.insert(itemsTable).values({
    id: itemId, code, name, category, baseUnit,
    minStock: String(minStock ?? 0),
    isActive: isActive ?? true,
  }).onConflictDoUpdate({
    target: itemsTable.id,
    set: { code, name, category, baseUnit, minStock: String(minStock ?? 0), isActive: isActive ?? true },
  });

  if (conversions !== undefined) {
    await db.delete(itemUnitsTable).where(eq(itemUnitsTable.itemId, itemId));
    if (Array.isArray(conversions) && conversions.length > 0) {
      await db.insert(itemUnitsTable).values(
        conversions.map((c: { unitName: string; conversionRatio: number; operator: "*" | "/" }) => ({
          itemId,
          unitName: c.unitName,
          conversionRatio: String(c.conversionRatio),
          operator: c.operator ?? "*",
        }))
      );
    }
  }

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
  const units = await db.select().from(itemUnitsTable).where(eq(itemUnitsTable.itemId, itemId));

  return res.json({
    ...item,
    minStock: Number(item.minStock),
    conversions: units.map(u => ({
      unitName: u.unitName,
      conversionRatio: Number(u.conversionRatio),
      operator: u.operator,
    })),
  });
});

router.get("/inventory/items/:id", async (req, res) => {
  const { id } = req.params;
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id));
  if (!item) return res.status(404).json({ error: "Barang tidak ditemukan" });

  const units = await db.select().from(itemUnitsTable).where(eq(itemUnitsTable.itemId, id));

  const stocks = await db
    .select({
      warehouseId: stockTable.warehouseId,
      warehouseName: warehousesTable.name,
      itemId: stockTable.itemId,
      qty: stockTable.qty,
      lastUpdated: stockTable.lastUpdated,
    })
    .from(stockTable)
    .innerJoin(warehousesTable, eq(stockTable.warehouseId, warehousesTable.id))
    .where(eq(stockTable.itemId, id));

  return res.json({
    ...item,
    minStock: Number(item.minStock),
    conversions: units.map(u => ({
      unitName: u.unitName,
      conversionRatio: Number(u.conversionRatio),
      operator: u.operator,
    })),
    stockByWarehouse: stocks.map(s => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouseName,
      itemId: s.itemId,
      itemName: item.name,
      itemCode: item.code,
      qty: Number(s.qty),
      lastUpdated: s.lastUpdated,
    })),
    recentMutations: [],
  });
});

router.delete("/inventory/items/:id", async (req, res) => {
  await db.update(itemsTable).set({ isActive: false }).where(eq(itemsTable.id, req.params.id));
  return res.json({ success: true });
});

router.post("/inventory/items/bulk-delete", async (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    await db.update(itemsTable).set({ isActive: false }).where(inArray(itemsTable.id, ids));
  }
  return res.json({ success: true });
});

// ─── WAREHOUSES ───────────────────────────────────────────────────────────────

router.get("/inventory/warehouses", async (_req, res) => {
  const warehouses = await db.select().from(warehousesTable).orderBy(warehousesTable.name);
  return res.json(warehouses);
});

router.post("/inventory/warehouses", async (req, res) => {
  const { id, name, location, pic, phone, isActive } = req.body;
  const wId = id || randomUUID();

  await db.insert(warehousesTable).values({
    id: wId, name, location, pic, phone, isActive: isActive ?? true,
  }).onConflictDoUpdate({
    target: warehousesTable.id,
    set: { name, location, pic, phone, isActive: isActive ?? true },
  });

  const [w] = await db.select().from(warehousesTable).where(eq(warehousesTable.id, wId));
  return res.json(w);
});

router.delete("/inventory/warehouses/:id", async (req, res) => {
  await db.delete(warehousesTable).where(eq(warehousesTable.id, req.params.id));
  return res.json({ success: true });
});

// ─── PARTNERS ─────────────────────────────────────────────────────────────────

router.get("/inventory/partners", async (req, res) => {
  const { type } = req.query;
  const partners = await db.select().from(partnersTable).orderBy(partnersTable.name);
  const filtered = type ? partners.filter(p => p.type === type) : partners;
  return res.json(filtered.map(p => ({ ...p, termDays: p.termDays ?? 0 })));
});

router.post("/inventory/partners", async (req, res) => {
  const { id, type, name, phone, email, address, npwp, termDays } = req.body;
  const pId = id || randomUUID();

  await db.insert(partnersTable).values({
    id: pId, type, name, phone, email, address, npwp, termDays: termDays ?? 0,
  }).onConflictDoUpdate({
    target: partnersTable.id,
    set: { type, name, phone, email, address, npwp, termDays: termDays ?? 0 },
  });

  const [p] = await db.select().from(partnersTable).where(eq(partnersTable.id, pId));
  return res.json({ ...p, termDays: p.termDays ?? 0 });
});

router.delete("/inventory/partners/:id", async (req, res) => {
  await db.delete(partnersTable).where(eq(partnersTable.id, req.params.id));
  return res.json({ success: true });
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/inventory/users", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    fullName: usersTable.fullName,
    role: usersTable.role,
    status: usersTable.status,
    createdAt: usersTable.createdAt,
  }).from(usersTable).orderBy(usersTable.fullName);
  return res.json(users);
});

router.post("/inventory/users", async (req, res) => {
  const { id, username, fullName, role, status, password } = req.body;
  const uId = id || randomUUID();

  if (!id) {
    // New user — password required
    if (!password) return res.status(400).json({ error: "Password wajib untuk pengguna baru" });
    await db.insert(usersTable).values({
      id: uId, username, fullName, role: role ?? "STAFF",
      status: status ?? "ACTIVE",
      passwordHash: hashPassword(password),
    });
  } else {
    // Update
    const updateData: Record<string, unknown> = { username, fullName, role, status };
    if (password) updateData.passwordHash = hashPassword(password);
    await db.update(usersTable).set(updateData as Parameters<typeof db.update>[0]).where(eq(usersTable.id, uId));
  }

  const [u] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    fullName: usersTable.fullName,
    role: usersTable.role,
    status: usersTable.status,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, uId));
  return res.json(u);
});

router.delete("/inventory/users/:id", async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
  return res.json({ success: true });
});

// ─── STOCK ────────────────────────────────────────────────────────────────────

router.get("/inventory/stocks", async (req, res) => {
  const { warehouseId, itemId } = req.query;

  const stocks = await db
    .select({
      warehouseId: stockTable.warehouseId,
      warehouseName: warehousesTable.name,
      itemId: stockTable.itemId,
      itemName: itemsTable.name,
      itemCode: itemsTable.code,
      qty: stockTable.qty,
      lastUpdated: stockTable.lastUpdated,
    })
    .from(stockTable)
    .innerJoin(warehousesTable, eq(stockTable.warehouseId, warehousesTable.id))
    .innerJoin(itemsTable, eq(stockTable.itemId, itemsTable.id))
    .where(
      warehouseId && itemId
        ? and(eq(stockTable.warehouseId, warehouseId as string), eq(stockTable.itemId, itemId as string))
        : warehouseId
        ? eq(stockTable.warehouseId, warehouseId as string)
        : itemId
        ? eq(stockTable.itemId, itemId as string)
        : undefined
    );

  return res.json(stocks.map(s => ({ ...s, qty: Number(s.qty) })));
});

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────

router.get("/inventory/config/:key", async (req, res) => {
  const [setting] = await db.select().from(systemSettingsTable).where(eq(systemSettingsTable.key, req.params.key));
  return res.json({ key: req.params.key, value: setting?.value ?? null });
});

router.post("/inventory/config", async (req, res) => {
  const { key, value } = req.body;
  await db.insert(systemSettingsTable).values({ key, value }).onConflictDoUpdate({
    target: systemSettingsTable.key,
    set: { value },
  });
  return res.json({ success: true });
});

export default router;
