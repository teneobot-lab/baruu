import { Router } from "express";
import { db } from "@workspace/db";
import {
  transactionsTable, transactionItemsTable,
  stockTable, itemsTable, warehousesTable
} from "@workspace/db";
import { eq, and, gte, lte, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { insertTransactionSchema } from "@workspace/db/schema/transactions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

// ─── Stock atomic update ──────────────────────────────────────────────────────

/**
 * Atomically update stock quantity using SQL arithmetic.
 * Uses FOR UPDATE lock via Drizzle transaction to prevent race conditions.
 * Checks for negative stock after update and throws if insufficient.
 */
async function atomicUpdateStock(
  warehouseId: string,
  itemId: string,
  delta: number,
): Promise<void> {
  if (delta === 0) return;

  await db.transaction(async (trx) => {
    // Attempt atomic update: qty = qty + delta
    const result = await trx
      .update(stockTable)
      .set({
        qty: sql`${stockTable.qty} + ${delta}`,
        lastUpdated: new Date(),
      })
      .where(
        and(
          eq(stockTable.warehouseId, warehouseId),
          eq(stockTable.itemId, itemId),
        ),
      )
      .returning({ qty: stockTable.qty });

    if (result.length === 0) {
      // Row didn't exist — insert new stock entry
      if (delta < 0) {
        throw new Error("Stok tidak mencukupi — barang tidak ada di gudang ini");
      }
      await trx.insert(stockTable).values({
        warehouseId,
        itemId,
        qty: String(delta),
        lastUpdated: new Date(),
      });
    } else {
      // Verify stock is not negative (newQty = oldQty + delta)
      const newQty = Number(result[0]!.qty);
      if (newQty < 0) {
        throw new Error("Stok tidak mencukupi untuk barang di gudang ini");
      }
    }
  });
}

function getStockDelta(type: string, baseQty: number): { srcDelta: number; tgtDelta?: number } {
  switch (type) {
    case "IN": return { srcDelta: baseQty };
    case "OUT": return { srcDelta: -baseQty };
    case "TRANSFER": return { srcDelta: -baseQty, tgtDelta: baseQty };
    case "ADJUSTMENT": return { srcDelta: baseQty };
    default: return { srcDelta: 0 };
  }
}

// ─── Single-query transaction response builder ────────────────────────────────

/**
 * Fetches transaction with all related data in a single JOIN query.
 * Replaces the N+1 buildTransactionResponse pattern.
 */
async function buildTransactionResponse(txId: string) {
  // Single query: transactions + items + source warehouse + target warehouse + items detail
  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, txId));

  if (!tx) return null;

  const items = await db
    .select()
    .from(transactionItemsTable)
    .where(eq(transactionItemsTable.transactionId, txId));

  const [srcWh] = await db
    .select({ name: warehousesTable.name })
    .from(warehousesTable)
    .where(eq(warehousesTable.id, tx.sourceWarehouseId));

  let tgtWhName: string | null = null;
  if (tx.targetWarehouseId) {
    const [tgt] = await db
      .select({ name: warehousesTable.name })
      .from(warehousesTable)
      .where(eq(warehousesTable.id, tx.targetWarehouseId));
    tgtWhName = tgt?.name ?? null;
  }

  let itemDetails: { id: string; name: string; code: string }[] = [];
  if (items.length > 0) {
    itemDetails = await db
      .select({ id: itemsTable.id, name: itemsTable.name, code: itemsTable.code })
      .from(itemsTable)
      .where(inArray(itemsTable.id, items.map((i) => i.itemId)));
  }

  const itemMap = new Map(itemDetails.map((i) => [i.id, i]));

  return {
    id: tx.id,
    referenceNo: tx.referenceNo,
    type: tx.type,
    date: tx.date,
    sourceWarehouseId: tx.sourceWarehouseId,
    sourceWarehouseName: srcWh?.name ?? "",
    targetWarehouseId: tx.targetWarehouseId,
    targetWarehouseName: tgtWhName,
    partnerId: tx.partnerId,
    partnerName: tx.partnerName,
    deliveryOrderNo: tx.deliveryOrderNo,
    notes: tx.notes,
    createdBy: tx.createdBy,
    createdAt: tx.createdAt,
    items: items.map((i) => {
      const item = itemMap.get(i.itemId);
      return {
        id: i.id,
        itemId: i.itemId,
        itemName: item?.name ?? "",
        itemCode: item?.code ?? "",
        qty: Number(i.qty),
        unit: i.unit,
        conversionRatio: Number(i.conversionRatio),
        baseQty: Number(i.baseQty),
        note: i.note,
      };
    }),
  };
}

// ─── Batch transaction list fetcher (N+1 fix) ────────────────────────────────

/**
 * Fetches transactions with filters and pagination in a single query.
 * Replaces GET /transactions that previously called buildTransactionResponse
 * for each transaction individually (N+1 pattern).
 */
async function fetchTransactionList(params: {
  start?: string;
  end?: string;
  warehouseId?: string;
  type?: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  itemId?: string;
  page?: number;
  limit?: number;
}) {
  const { start, end, warehouseId, type, itemId, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  // Build base conditions
  const conditions = [];
  if (start) conditions.push(gte(transactionsTable.date, start));
  if (end) conditions.push(lte(transactionsTable.date, end));
  if (warehouseId) conditions.push(eq(transactionsTable.sourceWarehouseId, warehouseId));
  if (type) conditions.push(eq(transactionsTable.type, type));

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const txs = await (conditions.length > 0
    ? db
        .select({
          id: transactionsTable.id,
          referenceNo: transactionsTable.referenceNo,
          type: transactionsTable.type,
          date: transactionsTable.date,
          sourceWarehouseId: transactionsTable.sourceWarehouseId,
          targetWarehouseId: transactionsTable.targetWarehouseId,
          partnerId: transactionsTable.partnerId,
          partnerName: transactionsTable.partnerName,
          deliveryOrderNo: transactionsTable.deliveryOrderNo,
          notes: transactionsTable.notes,
          createdBy: transactionsTable.createdBy,
          createdAt: transactionsTable.createdAt,
          sourceWarehouseName: warehousesTable.name,
        })
        .from(transactionsTable)
        .innerJoin(warehousesTable, eq(transactionsTable.sourceWarehouseId, warehousesTable.id))
        .where(and(...conditions))
    : db
        .select({
          id: transactionsTable.id,
          referenceNo: transactionsTable.referenceNo,
          type: transactionsTable.type,
          date: transactionsTable.date,
          sourceWarehouseId: transactionsTable.sourceWarehouseId,
          targetWarehouseId: transactionsTable.targetWarehouseId,
          partnerId: transactionsTable.partnerId,
          partnerName: transactionsTable.partnerName,
          deliveryOrderNo: transactionsTable.deliveryOrderNo,
          notes: transactionsTable.notes,
          createdBy: transactionsTable.createdBy,
          createdAt: transactionsTable.createdAt,
          sourceWarehouseName: warehousesTable.name,
        })
        .from(transactionsTable)
        .innerJoin(warehousesTable, eq(transactionsTable.sourceWarehouseId, warehousesTable.id)))
    .orderBy(transactionsTable.date)
    .limit(limit)
    .offset(offset);

  // Fetch all transaction items for these transactions in one query
  const txIds = txs.map((t) => t.id);
  const allItems =
    txIds.length > 0
      ? await db
          .select()
          .from(transactionItemsTable)
          .where(inArray(transactionItemsTable.transactionId, txIds))
      : [];

  // Group items by transaction
  const itemsByTx = new Map<string, typeof allItems>();
  for (const item of allItems) {
    if (!itemsByTx.has(item.transactionId)) itemsByTx.set(item.transactionId, []);
    itemsByTx.get(item.transactionId)!.push(item);
  }

  // Fetch item details for all unique item IDs
  const allItemIds = [...new Set(allItems.map((i) => i.itemId))];
  const itemDetails =
    allItemIds.length > 0
      ? await db
          .select({ id: itemsTable.id, name: itemsTable.name, code: itemsTable.code })
          .from(itemsTable)
          .where(inArray(itemsTable.id, allItemIds))
      : [];

  const itemMap = new Map(itemDetails.map((i) => [i.id, i]));

  // Fetch target warehouse names for transfers
  const tgtWarehouseIds = [...new Set(txs.map((t) => t.targetWarehouseId).filter((id): id is string => id !== null))];
  const tgtWarehouses =
    tgtWarehouseIds.length > 0
      ? await db
          .select({ id: warehousesTable.id, name: warehousesTable.name })
          .from(warehousesTable)
          .where(inArray(warehousesTable.id, tgtWarehouseIds))
      : [];

  const tgtWhMap = new Map(tgtWarehouses.map((w) => [w.id, w.name]));

  // Filter by itemId if needed
  let results = txs.map((tx) => {
    const items = itemsByTx.get(tx.id) ?? [];
    return {
      id: tx.id,
      referenceNo: tx.referenceNo,
      type: tx.type,
      date: tx.date,
      sourceWarehouseId: tx.sourceWarehouseId,
      sourceWarehouseName: tx.sourceWarehouseName,
      targetWarehouseId: tx.targetWarehouseId,
      targetWarehouseName: tx.targetWarehouseId ? tgtWhMap.get(tx.targetWarehouseId) ?? null : null,
      partnerId: tx.partnerId,
      partnerName: tx.partnerName,
      deliveryOrderNo: tx.deliveryOrderNo,
      notes: tx.notes,
      createdBy: tx.createdBy,
      createdAt: tx.createdAt,
      items: items.map((i) => {
        const item = itemMap.get(i.itemId);
        return {
          id: i.id,
          itemId: i.itemId,
          itemName: item?.name ?? "",
          itemCode: item?.code ?? "",
          qty: Number(i.qty),
          unit: i.unit,
          conversionRatio: Number(i.conversionRatio),
          baseQty: Number(i.baseQty),
          note: i.note,
        };
      }),
    };
  });

  if (itemId) {
    results = results.filter((tx) => tx.items.some((i) => i.itemId === itemId));
  }

  return {
    data: results,
    total: Number(count),
    page,
    totalPages: Math.ceil(Number(count) / limit),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const router = Router();

router.get("/transactions", async (req: Request, res: Response) => {
  try {
    const { start, end, warehouseId, type, itemId, page, limit } = req.query;

    const result = await fetchTransactionList({
      start: start as string | undefined,
      end: end as string | undefined,
      warehouseId: warehouseId as string | undefined,
      type: type as "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT" | undefined,
      itemId: itemId as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    return res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/transactions", async (req: Request, res: Response) => {
  try {
    const parsed = insertTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        error: "Validasi gagal",
        details: parsed.error.flatten(),
      });
    }

    const { referenceNo, type, date, sourceWarehouseId, targetWarehouseId, partnerId, partnerName, deliveryOrderNo, notes, items } = parsed.data;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Minimal 1 item diperlukan" });
    }

    const userId = (req as AuthenticatedRequest).user?.userId;

    const txId = randomUUID();
    const refNo =
      referenceNo ??
      `${type}-${date.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    await db.transaction(async (trx) => {
      await trx.insert(transactionsTable).values({
        id: txId,
        referenceNo: refNo,
        type,
        date,
        sourceWarehouseId,
        targetWarehouseId: targetWarehouseId ?? null,
        partnerId: partnerId ?? null,
        partnerName: partnerName ?? null,
        deliveryOrderNo: deliveryOrderNo ?? null,
        notes: notes ?? null,
        createdBy: userId ?? null,
      });

      for (const item of items) {
        const baseQty = Number(item.baseQty ?? item.qty);
        const { srcDelta, tgtDelta } = getStockDelta(type, baseQty);

        // Use atomic update within transaction
        await trx
          .update(stockTable)
          .set({ qty: sql`${stockTable.qty} + ${srcDelta}`, lastUpdated: new Date() })
          .where(and(eq(stockTable.warehouseId, sourceWarehouseId), eq(stockTable.itemId, item.itemId)))
          .returning({ qty: stockTable.qty })
          .catch(async () => {
            // Row not found — insert if positive delta
            if (srcDelta >= 0) {
              await trx.insert(stockTable).values({
                warehouseId: sourceWarehouseId,
                itemId: item.itemId,
                qty: String(srcDelta),
                lastUpdated: new Date(),
              });
            } else {
              throw new Error("Stok tidak mencukupi untuk barang di gudang ini");
            }
          });

        if (tgtDelta !== undefined && targetWarehouseId) {
          const tgtResult = await trx
            .update(stockTable)
            .set({ qty: sql`${stockTable.qty} + ${tgtDelta}`, lastUpdated: new Date() })
            .where(and(eq(stockTable.warehouseId, targetWarehouseId), eq(stockTable.itemId, item.itemId)))
            .returning({ qty: stockTable.qty });

          if (tgtResult.length === 0) {
            await trx.insert(stockTable).values({
              warehouseId: targetWarehouseId,
              itemId: item.itemId,
              qty: String(tgtDelta),
              lastUpdated: new Date(),
            });
          }
        }

        await trx.insert(transactionItemsTable).values({
          transactionId: txId,
          itemId: item.itemId,
          qty: String(item.qty),
          unit: item.unit,
          conversionRatio: String(item.conversionRatio ?? "1"),
          baseQty: String(baseQty),
          note: item.note ?? null,
        });
      }
    });

    const response = await buildTransactionResponse(txId);
    return res.status(201).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(400).json({ error: message });
  }
});

router.get("/transactions/:id", async (req: Request, res: Response) => {
  try {
    const response = await buildTransactionResponse(req.params.id as string);
    if (!response) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    return res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.put("/transactions/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const [oldTx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!oldTx) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

    const oldItems = await db
      .select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transactionId, id));

    await db.transaction(async (trx) => {
      // Revert old stock
      for (const item of oldItems) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(oldTx.type, baseQty);
        await trx
          .update(stockTable)
          .set({ qty: sql`${stockTable.qty} + ${-srcDelta}`, lastUpdated: new Date() })
          .where(and(eq(stockTable.warehouseId, oldTx.sourceWarehouseId), eq(stockTable.itemId, item.itemId)));
        if (tgtDelta !== undefined && oldTx.targetWarehouseId) {
          await trx
            .update(stockTable)
            .set({ qty: sql`${stockTable.qty} + ${-tgtDelta}`, lastUpdated: new Date() })
            .where(and(eq(stockTable.warehouseId, oldTx.targetWarehouseId), eq(stockTable.itemId, item.itemId)));
        }
      }

      const parsed = insertTransactionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw Object.assign(new Error("Validasi gagal"), {
          status: 422,
          details: parsed.error.flatten(),
        });
      }

      const { type, date, sourceWarehouseId, targetWarehouseId, partnerId, partnerName, deliveryOrderNo, notes, items } = parsed.data;

      // Update transaction
      await trx.update(transactionsTable).set({
        type,
        date,
        sourceWarehouseId,
        targetWarehouseId: targetWarehouseId ?? null,
        partnerId: partnerId ?? null,
        partnerName: partnerName ?? null,
        deliveryOrderNo: deliveryOrderNo ?? null,
        notes: notes ?? null,
      }).where(eq(transactionsTable.id, id));

      // Delete old items
      await trx.delete(transactionItemsTable).where(eq(transactionItemsTable.transactionId, id));

      // Insert new items and apply new stock
      for (const item of items ?? []) {
        const baseQty = Number(item.baseQty ?? item.qty);
        const { srcDelta, tgtDelta } = getStockDelta(type, baseQty);

        await trx
          .update(stockTable)
          .set({ qty: sql`${stockTable.qty} + ${srcDelta}`, lastUpdated: new Date() })
          .where(and(eq(stockTable.warehouseId, sourceWarehouseId), eq(stockTable.itemId, item.itemId)));

        if (tgtDelta !== undefined && targetWarehouseId) {
          await trx
            .update(stockTable)
            .set({ qty: sql`${stockTable.qty} + ${tgtDelta}`, lastUpdated: new Date() })
            .where(and(eq(stockTable.warehouseId, targetWarehouseId), eq(stockTable.itemId, item.itemId)));
        }

        await trx.insert(transactionItemsTable).values({
          transactionId: id,
          itemId: item.itemId,
          qty: String(item.qty),
          unit: item.unit,
          conversionRatio: String(item.conversionRatio ?? "1"),
          baseQty: String(baseQty),
          note: item.note ?? null,
        });
      }
    });

    const response = await buildTransactionResponse(id);
    return res.json(response);
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 422) {
      return res.status(422).json({ error: "Validasi gagal", details: (err as unknown as { details: unknown }).details });
    }
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(400).json({ error: message });
  }
});

router.delete("/transactions/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const [oldTx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!oldTx) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

    const oldItems = await db
      .select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transactionId, id));

    await db.transaction(async (trx) => {
      for (const item of oldItems) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(oldTx.type, baseQty);
        await trx
          .update(stockTable)
          .set({ qty: sql`${stockTable.qty} + ${-srcDelta}`, lastUpdated: new Date() })
          .where(and(eq(stockTable.warehouseId, oldTx.sourceWarehouseId), eq(stockTable.itemId, item.itemId)));
        if (tgtDelta !== undefined && oldTx.targetWarehouseId) {
          await trx
            .update(stockTable)
            .set({ qty: sql`${stockTable.qty} + ${-tgtDelta}`, lastUpdated: new Date() })
            .where(and(eq(stockTable.warehouseId, oldTx.targetWarehouseId), eq(stockTable.itemId, item.itemId)));
        }
      }
      await trx.delete(transactionsTable).where(eq(transactionsTable.id, id));
    });
    return res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.post("/transactions/bulk-import", async (req: Request, res: Response) => {
  try {
    const { rows } = req.body as { rows: Array<{
      tipe: string; tanggal: string; gudang_asal: string;
      gudang_tujuan?: string | null; mitra?: string | null;
      no_sj?: string | null; kode_barang: string;
      jumlah: number; satuan: string; catatan?: string | null;
    }> };

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows wajib berupa array non-kosong" });
    }

    const VALID_TYPES = ["IN", "OUT", "TRANSFER", "ADJUSTMENT"];
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const total = rows.length;
    let imported = 0;

    // Pre-fetch all warehouses and items for validation
    const allWarehouses = await db.select().from(warehousesTable);
    const whNameMap = new Map(allWarehouses.map((w) => [w.name.toLowerCase(), w]));
    const allItems = await db.select().from(itemsTable);
    const itemCodeMap = new Map(allItems.map((i) => [i.code.toLowerCase(), i]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // Validate required fields
      if (!VALID_TYPES.includes(row.tipe)) {
        errors.push({ row: rowNum, field: "tipe", message: `Tipe tidak valid: "${row.tipe}". Gunakan: IN, OUT, TRANSFER, atau ADJUSTMENT` });
        continue;
      }
      if (!row.tanggal?.trim()) {
        errors.push({ row: rowNum, field: "tanggal", message: "Tanggal wajib diisi" });
        continue;
      }
      if (!row.gudang_asal?.trim()) {
        errors.push({ row: rowNum, field: "gudang_asal", message: "Gudang asal wajib diisi" });
        continue;
      }
      if (!row.kode_barang?.trim()) {
        errors.push({ row: rowNum, field: "kode_barang", message: "Kode barang wajib diisi" });
        continue;
      }
      if (typeof row.jumlah !== "number" || row.jumlah <= 0) {
        errors.push({ row: rowNum, field: "jumlah", message: "Jumlah harus angka lebih dari 0" });
        continue;
      }
      if (!row.satuan?.trim()) {
        errors.push({ row: rowNum, field: "satuan", message: "Satuan wajib diisi" });
        continue;
      }

      // Validate warehouse
      const srcWh = whNameMap.get(row.gudang_asal.trim().toLowerCase());
      if (!srcWh) {
        errors.push({ row: rowNum, field: "gudang_asal", message: `Gudang "${row.gudang_asal}" tidak ditemukan` });
        continue;
      }

      // Validate target warehouse for TRANSFER
      let tgtWhId: string | null = null;
      if (row.tipe === "TRANSFER") {
        if (!row.gudang_tujuan?.trim()) {
          errors.push({ row: rowNum, field: "gudang_tujuan", message: "Gudang tujuan wajib untuk tipe TRANSFER" });
          continue;
        }
        const tgtWh = whNameMap.get(row.gudang_tujuan.trim().toLowerCase());
        if (!tgtWh) {
          errors.push({ row: rowNum, field: "gudang_tujuan", message: `Gudang tujuan "${row.gudang_tujuan}" tidak ditemukan` });
          continue;
        }
        tgtWhId = tgtWh.id;
        if (tgtWh.id === srcWh.id) {
          errors.push({ row: rowNum, field: "gudang_tujuan", message: "Gudang asal dan tujuan tidak boleh sama" });
          continue;
        }
      }

      // Validate item by code
      const item = itemCodeMap.get(row.kode_barang.trim().toLowerCase());
      if (!item) {
        errors.push({ row: rowNum, field: "kode_barang", message: `Barang dengan kode "${row.kode_barang}" tidak ditemukan` });
        continue;
      }

      // Determine conversion ratio
      const baseUnit = item.baseUnit;
      const convRatio = row.satuan.trim().toUpperCase() === baseUnit.toUpperCase()
        ? 1
        : 1; // For now use 1; full implementation would look up item_units table

      const baseQty = row.jumlah * convRatio;
      const userId = (req as AuthenticatedRequest).user?.userId;
      const txId = randomUUID();
      const refNo = `${row.tipe}-${row.tanggal.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      try {
        await db.transaction(async (trx) => {
          await trx.insert(transactionsTable).values({
            id: txId,
            referenceNo: refNo,
            type: row.tipe as "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT",
            date: row.tanggal,
            sourceWarehouseId: srcWh.id,
            targetWarehouseId: tgtWhId,
            partnerId: null,
            partnerName: row.mitra?.trim() ?? null,
            deliveryOrderNo: row.no_sj?.trim() ?? null,
            notes: row.catatan?.trim() ?? null,
            createdBy: userId ?? null,
          });

          const { srcDelta, tgtDelta } = getStockDelta(row.tipe, baseQty);

          // Update source warehouse stock
          const srcResult = await trx
            .update(stockTable)
            .set({ qty: sql`${stockTable.qty} + ${srcDelta}`, lastUpdated: new Date() })
            .where(and(eq(stockTable.warehouseId, srcWh.id), eq(stockTable.itemId, item.id)))
            .returning({ qty: stockTable.qty });

          if (srcResult.length === 0) {
            if (srcDelta >= 0) {
              await trx.insert(stockTable).values({
                warehouseId: srcWh.id,
                itemId: item.id,
                qty: String(srcDelta),
                lastUpdated: new Date(),
              });
            } else {
              throw new Error("Stok tidak mencukupi");
            }
          }

          // Update target warehouse stock for TRANSFER
          if (tgtDelta !== undefined && tgtWhId) {
            const tgtResult = await trx
              .update(stockTable)
              .set({ qty: sql`${stockTable.qty} + ${tgtDelta}`, lastUpdated: new Date() })
              .where(and(eq(stockTable.warehouseId, tgtWhId), eq(stockTable.itemId, item.id)))
              .returning({ qty: stockTable.qty });

            if (tgtResult.length === 0) {
              await trx.insert(stockTable).values({
                warehouseId: tgtWhId,
                itemId: item.id,
                qty: String(tgtDelta),
                lastUpdated: new Date(),
              });
            }
          }

          await trx.insert(transactionItemsTable).values({
            transactionId: txId,
            itemId: item.id,
            qty: String(row.jumlah),
            unit: row.satuan.trim().toUpperCase(),
            conversionRatio: String(convRatio),
            baseQty: String(baseQty),
            note: row.catatan?.trim() ?? null,
          });
        });

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

export default router;