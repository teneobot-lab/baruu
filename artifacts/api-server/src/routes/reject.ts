import { Router } from "express";
import { db } from "@workspace/db";
import {
  rejectOutletsTable, rejectItemsMasterTable, rejectItemUnitsTable,
  rejectBatchesTable, rejectBatchItemsTable
} from "@workspace/db";
import { eq, gte, lte, and, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";

function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

const router = Router();

// Outlets
router.get("/reject/outlets", async (_req: Request, res: Response) => {
  try {
    const outlets = await db.select().from(rejectOutletsTable).orderBy(rejectOutletsTable.name);
    return res.json(outlets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/reject/outlets", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name wajib diisi" });
    const [outlet] = await db.insert(rejectOutletsTable).values({ name }).returning();
    return res.status(201).json(outlet);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// Master Items
router.get("/reject/master-items", async (_req: Request, res: Response) => {
  try {
    const items = await db.select().from(rejectItemsMasterTable).orderBy(rejectItemsMasterTable.name);
    const units = await db.select().from(rejectItemUnitsTable);
    const unitMap = new Map<string, typeof units>();
    for (const u of units) {
      if (!unitMap.has(u.itemId)) unitMap.set(u.itemId, []);
      unitMap.get(u.itemId)!.push(u);
    }
    return res.json(
      items.map((item) => ({
        ...item,
        conversions: (unitMap.get(item.id) ?? []).map((u) => ({
          unitName: u.unitName,
          conversionRatio: Number(u.conversionRatio),
          operator: u.operator,
        })),
      })),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/reject/master-items", async (req: Request, res: Response) => {
  try {
    const { id, code, name, baseUnit, conversions } = req.body;
    if (!code || !name || !baseUnit) {
      return res.status(400).json({ error: "code, name, dan baseUnit wajib diisi" });
    }
    const itemId = id || randomUUID();

    await db
      .insert(rejectItemsMasterTable)
      .values({ id: itemId, code, name, baseUnit })
      .onConflictDoUpdate({
        target: rejectItemsMasterTable.id,
        set: { code, name, baseUnit },
      });

    if (Array.isArray(conversions)) {
      await db.delete(rejectItemUnitsTable).where(eq(rejectItemUnitsTable.itemId, itemId));
      if (conversions.length > 0) {
        await db.insert(rejectItemUnitsTable).values(
          conversions.map((c: { unitName: string; conversionRatio: number; operator?: "*" | "/" }) => ({
            itemId,
            unitName: c.unitName,
            conversionRatio: String(c.conversionRatio),
            operator: c.operator ?? "*",
          })),
        );
      }
    }

    const [item] = await db.select().from(rejectItemsMasterTable).where(eq(rejectItemsMasterTable.id, itemId));
    const units = await db
      .select()
      .from(rejectItemUnitsTable)
      .where(eq(rejectItemUnitsTable.itemId, itemId));
    return res.json({
      ...item,
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

router.delete("/reject/master-items/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(rejectItemsMasterTable).where(eq(rejectItemsMasterTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

// Batches
router.get("/reject/batches", async (req: Request, res: Response) => {
  try {
    const { start, end, outlet, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (start && end) conditions.push(and(gte(rejectBatchesTable.date, start as string), lte(rejectBatchesTable.date, end as string)));
    else if (start) conditions.push(gte(rejectBatchesTable.date, start as string));
    else if (end) conditions.push(lte(rejectBatchesTable.date, end as string));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(rejectBatchesTable)
      .where(whereClause);

    const batches = await db
      .select()
      .from(rejectBatchesTable)
      .where(whereClause)
      .orderBy(rejectBatchesTable.date)
      .limit(limitNum)
      .offset(offset);

    const batchIds = batches.map((b) => b.id);
    const allItems =
      batchIds.length > 0
        ? await db.select().from(rejectBatchItemsTable).where(inArray(rejectBatchItemsTable.batchId, batchIds))
        : [];

    const itemMap = new Map<string, typeof allItems>();
    for (const i of allItems) {
      if (!itemMap.has(i.batchId)) itemMap.set(i.batchId, []);
      itemMap.get(i.batchId)!.push(i);
    }

    const result = batches
      .filter((b) => !outlet || b.outlet === outlet)
      .map((b) => ({
        id: b.id,
        date: b.date,
        outlet: b.outlet,
        createdAt: b.createdAt,
        items: (itemMap.get(b.id) ?? []).map((i) => ({
          id: i.id,
          itemId: i.itemId,
          sku: i.sku,
          name: i.name,
          qty: Number(i.qty),
          unit: i.unit,
          baseQty: Number(i.baseQty),
          reason: i.reason,
          inputQty: i.inputQty ? Number(i.inputQty) : null,
          inputUnit: i.inputUnit,
        })),
      }));

    return res.json(paginate(result, Number(count), pageNum, limitNum));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/reject/batches", async (req: Request, res: Response) => {
  try {
    const { date, outlet, items } = req.body;
    if (!date || !outlet) {
      return res.status(400).json({ error: "date dan outlet wajib diisi" });
    }

    const batchId = randomUUID();
    const createdAt = Date.now();

    await db.insert(rejectBatchesTable).values({ id: batchId, date, outlet, createdAt });

    if (Array.isArray(items) && items.length > 0) {
      await db.insert(rejectBatchItemsTable).values(
        items.map((i: {
          itemId?: string; sku?: string; name?: string; qty: number; unit: string;
          baseQty: number; reason?: string; inputQty?: number; inputUnit?: string;
        }) => ({
          batchId,
          itemId: i.itemId || null,
          sku: i.sku || null,
          name: i.name || null,
          qty: String(i.qty),
          unit: i.unit,
          baseQty: String(i.baseQty),
          reason: i.reason || null,
          inputQty: i.inputQty != null ? String(i.inputQty) : null,
          inputUnit: i.inputUnit || null,
        })),
      );
    }

    const [batch] = await db.select().from(rejectBatchesTable).where(eq(rejectBatchesTable.id, batchId));
    const batchItems = await db
      .select()
      .from(rejectBatchItemsTable)
      .where(eq(rejectBatchItemsTable.batchId, batchId));

    return res.status(201).json({
      id: batch.id,
      date: batch.date,
      outlet: batch.outlet,
      createdAt: batch.createdAt,
      items: batchItems.map((i) => ({
        id: i.id,
        itemId: i.itemId,
        sku: i.sku,
        name: i.name,
        qty: Number(i.qty),
        unit: i.unit,
        baseQty: Number(i.baseQty),
        reason: i.reason,
        inputQty: i.inputQty ? Number(i.inputQty) : null,
        inputUnit: i.inputUnit,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.delete("/reject/batches/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(rejectBatchesTable).where(eq(rejectBatchesTable.id, req.params.id as string));
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

export default router;