import { Router } from "express";
import { db } from "@workspace/db";
import {
  itemsTable, itemUnitsTable, warehousesTable, partnersTable,
  usersTable, stockTable, systemSettingsTable
} from "@workspace/db";
import { eq, inArray, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { insertItemSchema } from "@workspace/db/schema/items";
import { insertWarehouseSchema } from "@workspace/db/schema/warehouses";
import { insertPartnerSchema } from "@workspace/db/schema/partners";
import { insertUserSchema } from "@workspace/db/schema/users";
import { hashPassword } from "../lib/auth";
import type { Request, Response } from "express";

// ─── Local type for user update values (matches db schema shape) ───────────────
type UserUpdate = {
  username?: string;
  fullName?: string;
  role?: "ADMIN" | "MANAGER" | "STAFF";
  status?: "ACTIVE" | "INACTIVE";
  passwordHash?: string;
};

// ─── Pagination helper ─────────────────────────────────────────────────────────

interface PaginationParams {
  page?: number;
  limit?: number;
}

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── ITEMS ────────────────────────────────────────────────────────────────────

const router = Router();

router.get("/inventory/items", async (req: Request, res: Response) => {
  try {
    const { category, isActive, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build conditions — filter in DB, not JS (BUG-3 fix)
    const conditions = [];
    if (category) conditions.push(eq(itemsTable.category, category as string));
    if (isActive !== undefined) conditions.push(eq(itemsTable.isActive, isActive === "true"));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(itemsTable)
      .where(whereClause);

    // Fetch paginated items
    const items = await db
      .select()
      .from(itemsTable)
      .where(whereClause)
      .orderBy(itemsTable.name)
      .limit(limitNum)
      .offset(offset);

    // Fetch units in single query
    const itemIds = items.map((i) => i.id);
    const units =
      itemIds.length > 0
        ? await db.select().from(itemUnitsTable).where(inArray(itemUnitsTable.itemId, itemIds))
        : [];

    const unitMap = new Map<string, typeof units>();
    for (const u of units) {
      if (!unitMap.has(u.itemId)) unitMap.set(u.itemId, []);
      unitMap.get(u.itemId)!.push(u);
    }

    const result = items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      baseUnit: item.baseUnit,
      minStock: Number(item.minStock),
      isActive: item.isActive,
      createdAt: item.createdAt,
      conversions: (unitMap.get(item.id) ?? []).map((u) => ({
        unitName: u.unitName,
        conversionRatio: Number(u.conversionRatio),
        operator: u.operator,
      })),
    }));

    return res.json(paginate(result, Number(count), pageNum, limitNum));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/items", async (req: Request, res: Response) => {
  try {
    const parsed = insertItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() });
    }

    const { id, code, name, category, baseUnit, minStock, isActive, conversions } = parsed.data;
    const itemId = id || randomUUID();

    await db.insert(itemsTable).values({
      id: itemId,
      code,
      name,
      category,
      baseUnit,
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
          conversions.map((c) => ({
            itemId,
            unitName: c.unitName,
            conversionRatio: String(c.conversionRatio),
            operator: c.operator ?? "*",
          })),
        );
      }
    }

    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, itemId));
    const units = await db.select().from(itemUnitsTable).where(eq(itemUnitsTable.itemId, itemId));

    return res.json({
      ...item,
      minStock: Number(item.minStock),
      conversions: units.map((u) => ({
        unitName: u.unitName,
        conversionRatio: Number(u.conversionRatio),
        operator: u.operator,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.get("/inventory/items/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id as string));
    if (!item) return res.status(404).json({ error: "Barang tidak ditemukan" });

    const units = await db.select().from(itemUnitsTable).where(eq(itemUnitsTable.itemId, id as string));

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
      .where(eq(stockTable.itemId, id as string));

    return res.json({
      ...item,
      minStock: Number(item.minStock),
      conversions: units.map((u) => ({
        unitName: u.unitName,
        conversionRatio: Number(u.conversionRatio),
        operator: u.operator,
      })),
      stockByWarehouse: stocks.map((s) => ({
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.delete("/inventory/items/:id", async (req: Request, res: Response) => {
  try {
    await db.update(itemsTable).set({ isActive: false }).where(eq(itemsTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/items/bulk-delete", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids wajib berupa array non-kosong" });
    }
    await db.update(itemsTable).set({ isActive: false }).where(inArray(itemsTable.id, ids));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/items/bulk-import", async (req: Request, res: Response) => {
  try {
    const { rows } = req.body as { rows: Array<{
      kode: string; nama: string; kategori?: string | null;
      satuan_dasar: string; minimum_stok?: number | null;
      konversi?: string | null;
    }> };

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows wajib berupa array non-kosong" });
    }

    const errors: Array<{ row: number; field: string; message: string }> = [];
    const total = rows.length;
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (1-indexed header = row 1)

      // Validate required fields
      if (!row.kode?.trim()) {
        errors.push({ row: rowNum, field: "kode", message: "Kode barang wajib diisi" });
        continue;
      }
      if (!row.nama?.trim()) {
        errors.push({ row: rowNum, field: "nama", message: "Nama barang wajib diisi" });
        continue;
      }
      if (!row.satuan_dasar?.trim()) {
        errors.push({ row: rowNum, field: "satuan_dasar", message: "Satuan dasar wajib diisi" });
        continue;
      }

      const itemId = randomUUID();
      const minStock = Number(row.minimum_stok ?? 0);

      // Parse conversions: "SATUAN,NILAI;SATUAN2,NILAI2"
      const conversions: Array<{ itemId: string; unitName: string; conversionRatio: string; operator: "*" | "/" }> = [];
      if (row.konversi?.trim()) {
        const convParts = row.konversi.split(";").filter(Boolean);
        for (const part of convParts) {
          const commaIdx = part.lastIndexOf(",");
          if (commaIdx === -1) {
            errors.push({ row: rowNum, field: "konversi", message: `Format konversi salah: "${part}". Gunakan format "SATUAN,NILAI"` });
            continue;
          }
          const unitName = part.slice(0, commaIdx).trim();
          const ratioStr = part.slice(commaIdx + 1).trim();
          const ratio = Number(ratioStr);
          if (!unitName || Number.isNaN(ratio) || ratio <= 0) {
            errors.push({ row: rowNum, field: "konversi", message: `Konversi "${part}" tidak valid. Contoh: "DUS,24"` });
            continue;
          }
          conversions.push({ itemId, unitName, conversionRatio: String(ratio), operator: "*" });
        }
      }

      try {
        await db.insert(itemsTable).values({
          id: itemId,
          code: row.kode.trim(),
          name: row.nama.trim(),
          category: row.kategori?.trim() ?? null,
          baseUnit: row.satuan_dasar.trim().toUpperCase(),
          minStock: String(minStock),
          isActive: true,
        }).onConflictDoUpdate({
          target: itemsTable.code,
          set: {
            name: row.nama.trim(),
            category: row.kategori?.trim() ?? null,
            baseUnit: row.satuan_dasar.trim().toUpperCase(),
            minStock: String(minStock),
          },
        });

        if (conversions.length > 0) {
          // Get the item id (may have been updated)
          const [existing] = await db.select({ id: itemsTable.id }).from(itemsTable).where(eq(itemsTable.code, row.kode.trim()));
          const targetId = existing?.id ?? itemId;

          // Delete existing conversions
          await db.delete(itemUnitsTable).where(eq(itemUnitsTable.itemId, targetId));
          // Insert new conversions with the correct itemId
          await db.insert(itemUnitsTable).values(
            conversions.map((c) => ({ itemId: targetId, unitName: c.unitName, conversionRatio: c.conversionRatio, operator: c.operator })),
          );
        }

        imported++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
        errors.push({ row: rowNum, field: "server", message: msg });
      }
    }

    return res.json({
      success: errors.length === 0,
      total,
      imported,
      failed: total - imported,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// ─── WAREHOUSES ────────────────────────────────────────────────────────────────

router.get("/inventory/warehouses", async (_req: Request, res: Response) => {
  try {
    const warehouses = await db.select().from(warehousesTable).orderBy(warehousesTable.name);
    return res.json(warehouses);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/warehouses", async (req: Request, res: Response) => {
  try {
    const parsed = insertWarehouseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() });
    }

    const { id, name, location, pic, phone, isActive } = parsed.data;
    const wId = id || randomUUID();

    await db.insert(warehousesTable).values({
      id: wId,
      name,
      location,
      pic,
      phone,
      isActive: isActive ?? true,
    }).onConflictDoUpdate({
      target: warehousesTable.id,
      set: { name, location, pic, phone, isActive: isActive ?? true },
    });

    const [w] = await db.select().from(warehousesTable).where(eq(warehousesTable.id, wId));
    return res.json(w);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.delete("/inventory/warehouses/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(warehousesTable).where(eq(warehousesTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// ─── PARTNERS ─────────────────────────────────────────────────────────────────

router.get("/inventory/partners", async (req: Request, res: Response) => {
  try {
    const { type, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (type) conditions.push(eq(partnersTable.type, type as "SUPPLIER" | "CUSTOMER"));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(partnersTable)
      .where(whereClause);

    const partners = await db
      .select()
      .from(partnersTable)
      .where(whereClause)
      .orderBy(partnersTable.name)
      .limit(limitNum)
      .offset(offset);

    return res.json(
      paginate(
        partners.map((p) => ({ ...p, termDays: p.termDays ?? 0 })),
        Number(count),
        pageNum,
        limitNum,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/partners", async (req: Request, res: Response) => {
  try {
    const parsed = insertPartnerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() });
    }

    const { id, type, name, phone, email, address, npwp, termDays } = parsed.data;
    const pId = id || randomUUID();

    await db.insert(partnersTable).values({
      id: pId,
      type,
      name,
      phone,
      email,
      address,
      npwp,
      termDays: termDays ?? 0,
    }).onConflictDoUpdate({
      target: partnersTable.id,
      set: { type, name, phone, email, address, npwp, termDays: termDays ?? 0 },
    });

    const [p] = await db.select().from(partnersTable).where(eq(partnersTable.id, pId));
    return res.json({ ...p, termDays: p.termDays ?? 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.delete("/inventory/partners/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(partnersTable).where(eq(partnersTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/inventory/users", async (_req: Request, res: Response) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
        role: usersTable.role,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(usersTable.fullName);
    return res.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/users", async (req: Request, res: Response) => {
  try {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() });
    }

    const { id, username, fullName, role, status, password } = parsed.data;

    if (!id && !password) {
      return res.status(400).json({ error: "Password wajib untuk pengguna baru" });
    }

    const uId = id || randomUUID();

    if (!id) {
      // New user — password required (validated above)
      const passwordHash = await hashPassword(password!);
      await db.insert(usersTable).values({
        id: uId,
        username,
        fullName,
        role: role ?? "STAFF",
        status: status ?? "ACTIVE",
        passwordHash,
      });
    } else {
      // Update existing user
      const updateValues: UserUpdate = {};
      if (username !== undefined) updateValues.username = username;
      if (fullName !== undefined) updateValues.fullName = fullName;
      if (role !== undefined) updateValues.role = role;
      if (status !== undefined) updateValues.status = status;
      if (password !== undefined) updateValues.passwordHash = await hashPassword(password);
      await db.update(usersTable).set(updateValues).where(eq(usersTable.id, uId));
    }

    const [u] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
        role: usersTable.role,
        status: usersTable.status,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, uId));
    return res.json(u);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.delete("/inventory/users/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// ─── STOCK ────────────────────────────────────────────────────────────────────

router.get("/inventory/stocks", async (req: Request, res: Response) => {
  try {
    const { warehouseId, itemId, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (warehouseId) conditions.push(eq(stockTable.warehouseId, warehouseId as string));
    if (itemId) conditions.push(eq(stockTable.itemId, itemId as string));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockTable)
      .where(whereClause);

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
      .where(whereClause)
      .limit(limitNum)
      .offset(offset);

    return res.json(
      paginate(
        stocks.map((s) => ({ ...s, qty: Number(s.qty) })),
        Number(count),
        pageNum,
        limitNum,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────

router.get("/inventory/config/:key", async (req: Request, res: Response) => {
  try {
    const [setting] = await db
      .select()
      .from(systemSettingsTable)
      .where(eq(systemSettingsTable.key, req.params.key as string));
    return res.json({ key: req.params.key, value: setting?.value ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/inventory/config", async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: "key dan value wajib diisi" });
    }
    await db.insert(systemSettingsTable).values({ key, value }).onConflictDoUpdate({
      target: systemSettingsTable.key,
      set: { value },
    });
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

export default router;