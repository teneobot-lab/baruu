import { Router } from "express";
import { db } from "@workspace/db";
import {
  itemsTable, warehousesTable, partnersTable, transactionsTable,
  transactionItemsTable, stockTable
} from "@workspace/db";
import { eq, and, gte, sql, count, desc } from "drizzle-orm";
import type { Request, Response } from "express";

const router = Router();

router.get("/dashboard/summary", async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [totalItems] = await db
      .select({ count: count() })
      .from(itemsTable)
      .where(eq(itemsTable.isActive, true));
    const [totalWarehouses] = await db
      .select({ count: count() })
      .from(warehousesTable)
      .where(eq(warehousesTable.isActive, true));
    const [totalPartners] = await db.select({ count: count() }).from(partnersTable);
    const [totalTransactionsToday] = await db
      .select({ count: count() })
      .from(transactionsTable)
      .where(eq(transactionsTable.date, today));
    const [totalIn] = await db
      .select({ count: count() })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.date, today), eq(transactionsTable.type, "IN")));
    const [totalOut] = await db
      .select({ count: count() })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.date, today), eq(transactionsTable.type, "OUT")));

    const stocks = await db
      .select({
        itemId: stockTable.itemId,
        qty: sql<number>`COALESCE(SUM(${stockTable.qty}), 0)`,
        minStock: itemsTable.minStock,
      })
      .from(stockTable)
      .innerJoin(itemsTable, eq(stockTable.itemId, itemsTable.id))
      .where(eq(itemsTable.isActive, true))
      .groupBy(stockTable.itemId, itemsTable.minStock);

    const lowStockCount = stocks.filter((s) => Number(s.qty) <= Number(s.minStock)).length;

    return res.json({
      totalItems: totalItems.count,
      totalWarehouses: totalWarehouses.count,
      totalPartners: totalPartners.count,
      totalTransactionsToday: totalTransactionsToday.count,
      totalInToday: totalIn.count,
      totalOutToday: totalOut.count,
      lowStockCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.get("/dashboard/low-stock", async (_req: Request, res: Response) => {
  try {
    const stocks = await db
      .select({
        itemId: stockTable.itemId,
        totalQty: sql<string>`COALESCE(SUM(${stockTable.qty}), 0)`,
      })
      .from(stockTable)
      .groupBy(stockTable.itemId);

    const items = await db
      .select()
      .from(itemsTable)
      .where(eq(itemsTable.isActive, true));

    const stockMap = new Map(stocks.map((s) => [s.itemId, Number(s.totalQty)]));

    const lowStock = items
      .filter((item) => {
        const qty = stockMap.get(item.id) ?? 0;
        return qty <= Number(item.minStock);
      })
      .map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        baseUnit: item.baseUnit,
        minStock: Number(item.minStock),
        currentStock: stockMap.get(item.id) ?? 0,
      }));

    return res.json(lowStock);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.get("/dashboard/recent-transactions", async (_req: Request, res: Response) => {
  try {
    const transactions = await db
      .select({
        id: transactionsTable.id,
        referenceNo: transactionsTable.referenceNo,
        type: transactionsTable.type,
        date: transactionsTable.date,
        warehouseName: warehousesTable.name,
        partnerName: transactionsTable.partnerName,
        itemCount: count(transactionItemsTable.id),
      })
      .from(transactionsTable)
      .innerJoin(warehousesTable, eq(transactionsTable.sourceWarehouseId, warehousesTable.id))
      .leftJoin(transactionItemsTable, eq(transactionsTable.id, transactionItemsTable.transactionId))
      .groupBy(transactionsTable.id, warehousesTable.name)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(10);

    return res.json(transactions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.get("/dashboard/stock-by-warehouse", async (_req: Request, res: Response) => {
  try {
    const result = await db
      .select({
        warehouseId: warehousesTable.id,
        warehouseName: warehousesTable.name,
        totalItems: count(stockTable.itemId),
        totalQty: sql<number>`COALESCE(SUM(${stockTable.qty}), 0)`,
      })
      .from(warehousesTable)
      .leftJoin(stockTable, eq(warehousesTable.id, stockTable.warehouseId))
      .where(eq(warehousesTable.isActive, true))
      .groupBy(warehousesTable.id, warehousesTable.name);

    return res.json(
      result.map((r) => ({
        warehouseId: r.warehouseId,
        warehouseName: r.warehouseName,
        totalItems: r.totalItems,
        totalQty: Number(r.totalQty),
      })),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

router.get("/dashboard/transaction-trend", async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split("T")[0];

    const result = await db
      .select({
        date: transactionsTable.date,
        type: transactionsTable.type,
        cnt: count(),
      })
      .from(transactionsTable)
      .where(gte(transactionsTable.date, startDate))
      .groupBy(transactionsTable.date, transactionsTable.type)
      .orderBy(transactionsTable.date);

    const dateMap = new Map<string, { inCount: number; outCount: number }>();
    for (const row of result) {
      if (!dateMap.has(row.date)) dateMap.set(row.date, { inCount: 0, outCount: 0 });
      const entry = dateMap.get(row.date)!;
      if (row.type === "IN") entry.inCount += row.cnt;
      if (row.type === "OUT") entry.outCount += row.cnt;
    }

    const trend = Array.from(dateMap.entries()).map(([date, counts]) => ({ date, ...counts }));
    return res.json(trend);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan";
    return res.status(500).json({ error: message });
  }
});

export default router;