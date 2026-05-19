import { Router } from "express";
import { db } from "@workspace/db";
import {
  transactionsTable, transactionItemsTable,
  stockTable, itemsTable, warehousesTable
} from "@workspace/db";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

async function updateStock(
  warehouseId: string,
  itemId: string,
  deltaQty: number,
  conn: typeof db
) {
  const [existing] = await conn
    .select()
    .from(stockTable)
    .where(and(eq(stockTable.warehouseId, warehouseId), eq(stockTable.itemId, itemId)));

  if (existing) {
    const newQty = Number(existing.qty) + deltaQty;
    if (newQty < 0) throw new Error(`Stok tidak mencukupi untuk barang di gudang ini`);
    await conn
      .update(stockTable)
      .set({ qty: String(newQty), lastUpdated: new Date() })
      .where(eq(stockTable.id, existing.id));
  } else {
    if (deltaQty < 0) throw new Error(`Stok tidak mencukupi untuk barang di gudang ini`);
    await conn.insert(stockTable).values({
      warehouseId, itemId, qty: String(deltaQty), lastUpdated: new Date(),
    });
  }
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

async function buildTransactionResponse(tx: typeof transactionsTable.$inferSelect) {
  const items = await db.select().from(transactionItemsTable).where(eq(transactionItemsTable.transactionId, tx.id));
  const [srcWh] = await db.select().from(warehousesTable).where(eq(warehousesTable.id, tx.sourceWarehouseId));
  let tgtWhName: string | null = null;
  if (tx.targetWarehouseId) {
    const [tgt] = await db.select().from(warehousesTable).where(eq(warehousesTable.id, tx.targetWarehouseId));
    tgtWhName = tgt?.name ?? null;
  }
  const itemDetails = await db.select().from(itemsTable).where(inArray(itemsTable.id, items.map(i => i.itemId)));
  const itemMap = new Map(itemDetails.map(i => [i.id, i]));

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
    items: items.map(i => {
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

router.get("/transactions", async (req, res) => {
  const { start, end, warehouseId, type, itemId } = req.query;

  let query = db.select().from(transactionsTable).$dynamic();

  const conditions = [];
  if (start) conditions.push(gte(transactionsTable.date, start as string));
  if (end) conditions.push(lte(transactionsTable.date, end as string));
  if (warehouseId) conditions.push(eq(transactionsTable.sourceWarehouseId, warehouseId as string));
  if (type) conditions.push(eq(transactionsTable.type, type as "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT"));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const txs = await query.orderBy(transactionsTable.date);

  const results = await Promise.all(txs.map(buildTransactionResponse));

  const filtered = itemId
    ? results.filter(tx => tx.items.some(i => i.itemId === itemId))
    : results;

  return res.json(filtered);
});

router.post("/transactions", async (req, res) => {
  const { referenceNo, type, date, sourceWarehouseId, targetWarehouseId, partnerId, partnerName, deliveryOrderNo, notes, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Minimal 1 item diperlukan" });
  }

  const txId = randomUUID();
  const refNo = referenceNo || `${type}-${date.replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    await db.transaction(async (trx) => {
      await trx.insert(transactionsTable).values({
        id: txId, referenceNo: refNo, type, date, sourceWarehouseId,
        targetWarehouseId: targetWarehouseId || null,
        partnerId: partnerId || null, partnerName: partnerName || null,
        deliveryOrderNo: deliveryOrderNo || null,
        notes: notes || null,
      });

      for (const item of items) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(type, baseQty);

        await updateStock(sourceWarehouseId, item.itemId, srcDelta, trx as typeof db);
        if (tgtDelta !== undefined && targetWarehouseId) {
          await updateStock(targetWarehouseId, item.itemId, tgtDelta, trx as typeof db);
        }

        await trx.insert(transactionItemsTable).values({
          transactionId: txId,
          itemId: item.itemId,
          qty: String(item.qty),
          unit: item.unit,
          conversionRatio: String(item.conversionRatio),
          baseQty: String(baseQty),
          note: item.note || null,
        });
      }
    });

    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, txId));
    return res.status(201).json(await buildTransactionResponse(tx));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(400).json({ error: message });
  }
});

router.get("/transactions/:id", async (req, res) => {
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, req.params.id));
  if (!tx) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
  return res.json(await buildTransactionResponse(tx));
});

router.put("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const { type, date, sourceWarehouseId, targetWarehouseId, partnerId, partnerName, deliveryOrderNo, notes, items } = req.body;

  const [oldTx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!oldTx) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

  const oldItems = await db.select().from(transactionItemsTable).where(eq(transactionItemsTable.transactionId, id));

  try {
    await db.transaction(async (trx) => {
      // Revert old stock
      for (const item of oldItems) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(oldTx.type, baseQty);
        await updateStock(oldTx.sourceWarehouseId, item.itemId, -srcDelta, trx as typeof db);
        if (tgtDelta !== undefined && oldTx.targetWarehouseId) {
          await updateStock(oldTx.targetWarehouseId, item.itemId, -tgtDelta, trx as typeof db);
        }
      }

      // Update transaction
      await trx.update(transactionsTable).set({
        type, date, sourceWarehouseId,
        targetWarehouseId: targetWarehouseId || null,
        partnerId: partnerId || null, partnerName: partnerName || null,
        deliveryOrderNo: deliveryOrderNo || null, notes: notes || null,
      }).where(eq(transactionsTable.id, id));

      // Delete old items
      await trx.delete(transactionItemsTable).where(eq(transactionItemsTable.transactionId, id));

      // Insert new items and apply new stock
      for (const item of items) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(type, baseQty);
        await updateStock(sourceWarehouseId, item.itemId, srcDelta, trx as typeof db);
        if (tgtDelta !== undefined && targetWarehouseId) {
          await updateStock(targetWarehouseId, item.itemId, tgtDelta, trx as typeof db);
        }
        await trx.insert(transactionItemsTable).values({
          transactionId: id,
          itemId: item.itemId,
          qty: String(item.qty),
          unit: item.unit,
          conversionRatio: String(item.conversionRatio),
          baseQty: String(baseQty),
          note: item.note || null,
        });
      }
    });

    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    return res.json(await buildTransactionResponse(tx));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(400).json({ error: message });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const [oldTx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!oldTx) return res.status(404).json({ error: "Transaksi tidak ditemukan" });

  const oldItems = await db.select().from(transactionItemsTable).where(eq(transactionItemsTable.transactionId, id));

  try {
    await db.transaction(async (trx) => {
      for (const item of oldItems) {
        const baseQty = Number(item.baseQty);
        const { srcDelta, tgtDelta } = getStockDelta(oldTx.type, baseQty);
        await updateStock(oldTx.sourceWarehouseId, item.itemId, -srcDelta, trx as typeof db);
        if (tgtDelta !== undefined && oldTx.targetWarehouseId) {
          await updateStock(oldTx.targetWarehouseId, item.itemId, -tgtDelta, trx as typeof db);
        }
      }
      await trx.delete(transactionsTable).where(eq(transactionsTable.id, id));
    });
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(400).json({ error: message });
  }
});

export default router;
