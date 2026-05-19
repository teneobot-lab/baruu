"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var db_1 = require("@workspace/db");
var db_2 = require("@workspace/db");
var drizzle_orm_1 = require("drizzle-orm");
var crypto_1 = require("crypto");
var items_1 = require("@workspace/db/schema/items");
var warehouses_1 = require("@workspace/db/schema/warehouses");
var partners_1 = require("@workspace/db/schema/partners");
var users_1 = require("@workspace/db/schema/users");
var auth_1 = require("../lib/auth");
function paginate(data, total, page, limit) {
    return {
        data: data,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
    };
}
// ─── ITEMS ────────────────────────────────────────────────────────────────────
var router = (0, express_1.Router)();
router.get("/inventory/items", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, category, isActive, _b, page, _c, limit, pageNum, limitNum, offset, conditions, whereClause, count, items, itemIds, units, _d, unitMap_1, _i, units_1, u, result, err_1, message;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 6, , 7]);
                _a = req.query, category = _a.category, isActive = _a.isActive, _b = _a.page, page = _b === void 0 ? "1" : _b, _c = _a.limit, limit = _c === void 0 ? "50" : _c;
                pageNum = Math.max(1, Number(page));
                limitNum = Math.min(200, Math.max(1, Number(limit)));
                offset = (pageNum - 1) * limitNum;
                conditions = [];
                if (category)
                    conditions.push((0, drizzle_orm_1.eq)(db_2.itemsTable.category, category));
                if (isActive !== undefined)
                    conditions.push((0, drizzle_orm_1.eq)(db_2.itemsTable.isActive, isActive === "true"));
                whereClause = conditions.length > 0 ? drizzle_orm_1.and.apply(void 0, conditions) : undefined;
                return [4 /*yield*/, db_1.db
                        .select({ count: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                        .from(db_2.itemsTable)
                        .where(whereClause)];
            case 1:
                count = (_e.sent())[0].count;
                return [4 /*yield*/, db_1.db
                        .select()
                        .from(db_2.itemsTable)
                        .where(whereClause)
                        .orderBy(db_2.itemsTable.name)
                        .limit(limitNum)
                        .offset(offset)];
            case 2:
                items = _e.sent();
                itemIds = items.map(function (i) { return i.id; });
                if (!(itemIds.length > 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, db_1.db.select().from(db_2.itemUnitsTable).where((0, drizzle_orm_1.inArray)(db_2.itemUnitsTable.itemId, itemIds))];
            case 3:
                _d = _e.sent();
                return [3 /*break*/, 5];
            case 4:
                _d = [];
                _e.label = 5;
            case 5:
                units = _d;
                unitMap_1 = new Map();
                for (_i = 0, units_1 = units; _i < units_1.length; _i++) {
                    u = units_1[_i];
                    if (!unitMap_1.has(u.itemId))
                        unitMap_1.set(u.itemId, []);
                    unitMap_1.get(u.itemId).push(u);
                }
                result = items.map(function (item) {
                    var _a;
                    return ({
                        id: item.id,
                        code: item.code,
                        name: item.name,
                        category: item.category,
                        baseUnit: item.baseUnit,
                        minStock: Number(item.minStock),
                        isActive: item.isActive,
                        createdAt: item.createdAt,
                        conversions: ((_a = unitMap_1.get(item.id)) !== null && _a !== void 0 ? _a : []).map(function (u) { return ({
                            unitName: u.unitName,
                            conversionRatio: Number(u.conversionRatio),
                            operator: u.operator,
                        }); }),
                    });
                });
                return [2 /*return*/, res.json(paginate(result, Number(count), pageNum, limitNum))];
            case 6:
                err_1 = _e.sent();
                message = err_1 instanceof Error ? err_1.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 7: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/items", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, _a, id, code, name_1, category, baseUnit, minStock, isActive, conversions, itemId_1, item, units, err_2, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                parsed = items_1.insertItemSchema.safeParse(req.body);
                if (!parsed.success) {
                    return [2 /*return*/, res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() })];
                }
                _a = parsed.data, id = _a.id, code = _a.code, name_1 = _a.name, category = _a.category, baseUnit = _a.baseUnit, minStock = _a.minStock, isActive = _a.isActive, conversions = _a.conversions;
                itemId_1 = id || (0, crypto_1.randomUUID)();
                return [4 /*yield*/, db_1.db.insert(db_2.itemsTable).values({
                        id: itemId_1,
                        code: code,
                        name: name_1,
                        category: category,
                        baseUnit: baseUnit,
                        minStock: String(minStock !== null && minStock !== void 0 ? minStock : 0),
                        isActive: isActive !== null && isActive !== void 0 ? isActive : true,
                    }).onConflictDoUpdate({
                        target: db_2.itemsTable.id,
                        set: { code: code, name: name_1, category: category, baseUnit: baseUnit, minStock: String(minStock !== null && minStock !== void 0 ? minStock : 0), isActive: isActive !== null && isActive !== void 0 ? isActive : true },
                    })];
            case 1:
                _b.sent();
                if (!(conversions !== undefined)) return [3 /*break*/, 4];
                return [4 /*yield*/, db_1.db.delete(db_2.itemUnitsTable).where((0, drizzle_orm_1.eq)(db_2.itemUnitsTable.itemId, itemId_1))];
            case 2:
                _b.sent();
                if (!(Array.isArray(conversions) && conversions.length > 0)) return [3 /*break*/, 4];
                return [4 /*yield*/, db_1.db.insert(db_2.itemUnitsTable).values(conversions.map(function (c) {
                        var _a;
                        return ({
                            itemId: itemId_1,
                            unitName: c.unitName,
                            conversionRatio: String(c.conversionRatio),
                            operator: (_a = c.operator) !== null && _a !== void 0 ? _a : "*",
                        });
                    }))];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4: return [4 /*yield*/, db_1.db.select().from(db_2.itemsTable).where((0, drizzle_orm_1.eq)(db_2.itemsTable.id, itemId_1))];
            case 5:
                item = (_b.sent())[0];
                return [4 /*yield*/, db_1.db.select().from(db_2.itemUnitsTable).where((0, drizzle_orm_1.eq)(db_2.itemUnitsTable.itemId, itemId_1))];
            case 6:
                units = _b.sent();
                return [2 /*return*/, res.json(__assign(__assign({}, item), { minStock: Number(item.minStock), conversions: units.map(function (u) { return ({
                            unitName: u.unitName,
                            conversionRatio: Number(u.conversionRatio),
                            operator: u.operator,
                        }); }) }))];
            case 7:
                err_2 = _b.sent();
                message = err_2 instanceof Error ? err_2.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 8: return [2 /*return*/];
        }
    });
}); });
router.get("/inventory/items/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, item_1, units, stocks, err_3, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                return [4 /*yield*/, db_1.db.select().from(db_2.itemsTable).where((0, drizzle_orm_1.eq)(db_2.itemsTable.id, id))];
            case 1:
                item_1 = (_a.sent())[0];
                if (!item_1)
                    return [2 /*return*/, res.status(404).json({ error: "Barang tidak ditemukan" })];
                return [4 /*yield*/, db_1.db.select().from(db_2.itemUnitsTable).where((0, drizzle_orm_1.eq)(db_2.itemUnitsTable.itemId, id))];
            case 2:
                units = _a.sent();
                return [4 /*yield*/, db_1.db
                        .select({
                        warehouseId: db_2.stockTable.warehouseId,
                        warehouseName: db_2.warehousesTable.name,
                        itemId: db_2.stockTable.itemId,
                        qty: db_2.stockTable.qty,
                        lastUpdated: db_2.stockTable.lastUpdated,
                    })
                        .from(db_2.stockTable)
                        .innerJoin(db_2.warehousesTable, (0, drizzle_orm_1.eq)(db_2.stockTable.warehouseId, db_2.warehousesTable.id))
                        .where((0, drizzle_orm_1.eq)(db_2.stockTable.itemId, id))];
            case 3:
                stocks = _a.sent();
                return [2 /*return*/, res.json(__assign(__assign({}, item_1), { minStock: Number(item_1.minStock), conversions: units.map(function (u) { return ({
                            unitName: u.unitName,
                            conversionRatio: Number(u.conversionRatio),
                            operator: u.operator,
                        }); }), stockByWarehouse: stocks.map(function (s) { return ({
                            warehouseId: s.warehouseId,
                            warehouseName: s.warehouseName,
                            itemId: s.itemId,
                            itemName: item_1.name,
                            itemCode: item_1.code,
                            qty: Number(s.qty),
                            lastUpdated: s.lastUpdated,
                        }); }), recentMutations: [] }))];
            case 4:
                err_3 = _a.sent();
                message = err_3 instanceof Error ? err_3.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 5: return [2 /*return*/];
        }
    });
}); });
router.delete("/inventory/items/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var err_4, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db.update(db_2.itemsTable).set({ isActive: false }).where((0, drizzle_orm_1.eq)(db_2.itemsTable.id, req.params.id))];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_4 = _a.sent();
                message = err_4 instanceof Error ? err_4.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/items/bulk-delete", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ids, err_5, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ids = req.body.ids;
                if (!Array.isArray(ids) || ids.length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "ids wajib berupa array non-kosong" })];
                }
                return [4 /*yield*/, db_1.db.update(db_2.itemsTable).set({ isActive: false }).where((0, drizzle_orm_1.inArray)(db_2.itemsTable.id, ids))];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_5 = _a.sent();
                message = err_5 instanceof Error ? err_5.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ─── WAREHOUSES ────────────────────────────────────────────────────────────────
router.get("/inventory/warehouses", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var warehouses, err_6, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db.select().from(db_2.warehousesTable).orderBy(db_2.warehousesTable.name)];
            case 1:
                warehouses = _a.sent();
                return [2 /*return*/, res.json(warehouses)];
            case 2:
                err_6 = _a.sent();
                message = err_6 instanceof Error ? err_6.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/warehouses", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, _a, id, name_2, location_1, pic, phone, isActive, wId, w, err_7, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                parsed = warehouses_1.insertWarehouseSchema.safeParse(req.body);
                if (!parsed.success) {
                    return [2 /*return*/, res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() })];
                }
                _a = parsed.data, id = _a.id, name_2 = _a.name, location_1 = _a.location, pic = _a.pic, phone = _a.phone, isActive = _a.isActive;
                wId = id || (0, crypto_1.randomUUID)();
                return [4 /*yield*/, db_1.db.insert(db_2.warehousesTable).values({
                        id: wId,
                        name: name_2,
                        location: location_1,
                        pic: pic,
                        phone: phone,
                        isActive: isActive !== null && isActive !== void 0 ? isActive : true,
                    }).onConflictDoUpdate({
                        target: db_2.warehousesTable.id,
                        set: { name: name_2, location: location_1, pic: pic, phone: phone, isActive: isActive !== null && isActive !== void 0 ? isActive : true },
                    })];
            case 1:
                _b.sent();
                return [4 /*yield*/, db_1.db.select().from(db_2.warehousesTable).where((0, drizzle_orm_1.eq)(db_2.warehousesTable.id, wId))];
            case 2:
                w = (_b.sent())[0];
                return [2 /*return*/, res.json(w)];
            case 3:
                err_7 = _b.sent();
                message = err_7 instanceof Error ? err_7.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.delete("/inventory/warehouses/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var err_8, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db.delete(db_2.warehousesTable).where((0, drizzle_orm_1.eq)(db_2.warehousesTable.id, req.params.id))];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_8 = _a.sent();
                message = err_8 instanceof Error ? err_8.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ─── PARTNERS ─────────────────────────────────────────────────────────────────
router.get("/inventory/partners", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, _b, page, _c, limit, pageNum, limitNum, offset, conditions, whereClause, count, partners, err_9, message;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, type = _a.type, _b = _a.page, page = _b === void 0 ? "1" : _b, _c = _a.limit, limit = _c === void 0 ? "50" : _c;
                pageNum = Math.max(1, Number(page));
                limitNum = Math.min(200, Math.max(1, Number(limit)));
                offset = (pageNum - 1) * limitNum;
                conditions = [];
                if (type)
                    conditions.push((0, drizzle_orm_1.eq)(db_2.partnersTable.type, type));
                whereClause = conditions.length > 0 ? drizzle_orm_1.and.apply(void 0, conditions) : undefined;
                return [4 /*yield*/, db_1.db
                        .select({ count: (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                        .from(db_2.partnersTable)
                        .where(whereClause)];
            case 1:
                count = (_d.sent())[0].count;
                return [4 /*yield*/, db_1.db
                        .select()
                        .from(db_2.partnersTable)
                        .where(whereClause)
                        .orderBy(db_2.partnersTable.name)
                        .limit(limitNum)
                        .offset(offset)];
            case 2:
                partners = _d.sent();
                return [2 /*return*/, res.json(paginate(partners.map(function (p) { var _a; return (__assign(__assign({}, p), { termDays: (_a = p.termDays) !== null && _a !== void 0 ? _a : 0 })); }), Number(count), pageNum, limitNum))];
            case 3:
                err_9 = _d.sent();
                message = err_9 instanceof Error ? err_9.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/partners", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, _a, id, type, name_3, phone, email, address, npwp, termDays, pId, p, err_10, message;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                parsed = partners_1.insertPartnerSchema.safeParse(req.body);
                if (!parsed.success) {
                    return [2 /*return*/, res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() })];
                }
                _a = parsed.data, id = _a.id, type = _a.type, name_3 = _a.name, phone = _a.phone, email = _a.email, address = _a.address, npwp = _a.npwp, termDays = _a.termDays;
                pId = id || (0, crypto_1.randomUUID)();
                return [4 /*yield*/, db_1.db.insert(db_2.partnersTable).values({
                        id: pId,
                        type: type,
                        name: name_3,
                        phone: phone,
                        email: email,
                        address: address,
                        npwp: npwp,
                        termDays: termDays !== null && termDays !== void 0 ? termDays : 0,
                    }).onConflictDoUpdate({
                        target: db_2.partnersTable.id,
                        set: { type: type, name: name_3, phone: phone, email: email, address: address, npwp: npwp, termDays: termDays !== null && termDays !== void 0 ? termDays : 0 },
                    })];
            case 1:
                _c.sent();
                return [4 /*yield*/, db_1.db.select().from(db_2.partnersTable).where((0, drizzle_orm_1.eq)(db_2.partnersTable.id, pId))];
            case 2:
                p = (_c.sent())[0];
                return [2 /*return*/, res.json(__assign(__assign({}, p), { termDays: (_b = p.termDays) !== null && _b !== void 0 ? _b : 0 }))];
            case 3:
                err_10 = _c.sent();
                message = err_10 instanceof Error ? err_10.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.delete("/inventory/partners/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var err_11, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db.delete(db_2.partnersTable).where((0, drizzle_orm_1.eq)(db_2.partnersTable.id, req.params.id))];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_11 = _a.sent();
                message = err_11 instanceof Error ? err_11.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ─── USERS ────────────────────────────────────────────────────────────────────
router.get("/inventory/users", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, err_12, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db
                        .select({
                        id: db_2.usersTable.id,
                        username: db_2.usersTable.username,
                        fullName: db_2.usersTable.fullName,
                        role: db_2.usersTable.role,
                        status: db_2.usersTable.status,
                        createdAt: db_2.usersTable.createdAt,
                    })
                        .from(db_2.usersTable)
                        .orderBy(db_2.usersTable.fullName)];
            case 1:
                users = _a.sent();
                return [2 /*return*/, res.json(users)];
            case 2:
                err_12 = _a.sent();
                message = err_12 instanceof Error ? err_12.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/users", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, _a, id, username, fullName, role, status_1, password, uId, passwordHash, updateData, _b, u, err_13, message;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                parsed = users_1.insertUserSchema.safeParse(req.body);
                if (!parsed.success) {
                    return [2 /*return*/, res.status(422).json({ error: "Validasi gagal", details: parsed.error.flatten() })];
                }
                _a = parsed.data, id = _a.id, username = _a.username, fullName = _a.fullName, role = _a.role, status_1 = _a.status, password = _a.password;
                if (!id && !password) {
                    return [2 /*return*/, res.status(400).json({ error: "Password wajib untuk pengguna baru" })];
                }
                uId = id || (0, crypto_1.randomUUID)();
                if (!!id) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, auth_1.hashPassword)(password)];
            case 1:
                passwordHash = _c.sent();
                return [4 /*yield*/, db_1.db.insert(db_2.usersTable).values({
                        id: uId,
                        username: username,
                        fullName: fullName,
                        role: role !== null && role !== void 0 ? role : "STAFF",
                        status: status_1 !== null && status_1 !== void 0 ? status_1 : "ACTIVE",
                        passwordHash: passwordHash,
                    })];
            case 2:
                _c.sent();
                return [3 /*break*/, 7];
            case 3:
                updateData = { username: username, fullName: fullName, role: role, status: status_1 };
                if (!password) return [3 /*break*/, 5];
                _b = updateData;
                return [4 /*yield*/, (0, auth_1.hashPassword)(password)];
            case 4:
                _b.passwordHash = _c.sent();
                _c.label = 5;
            case 5: return [4 /*yield*/, db_1.db.update(db_2.usersTable).set(updateData).where((0, drizzle_orm_1.eq)(db_2.usersTable.id, uId))];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7: return [4 /*yield*/, db_1.db
                    .select({
                    id: db_2.usersTable.id,
                    username: db_2.usersTable.username,
                    fullName: db_2.usersTable.fullName,
                    role: db_2.usersTable.role,
                    status: db_2.usersTable.status,
                    createdAt: db_2.usersTable.createdAt,
                })
                    .from(db_2.usersTable)
                    .where((0, drizzle_orm_1.eq)(db_2.usersTable.id, uId))];
            case 8:
                u = (_c.sent())[0];
                return [2 /*return*/, res.json(u)];
            case 9:
                err_13 = _c.sent();
                message = err_13 instanceof Error ? err_13.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 10: return [2 /*return*/];
        }
    });
}); });
router.delete("/inventory/users/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var err_14, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db.delete(db_2.usersTable).where((0, drizzle_orm_1.eq)(db_2.usersTable.id, req.params.id))];
            case 1:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_14 = _a.sent();
                message = err_14 instanceof Error ? err_14.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ─── STOCK ────────────────────────────────────────────────────────────────────
router.get("/inventory/stocks", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, warehouseId, itemId, _b, page, _c, limit, pageNum, limitNum, offset, conditions, whereClause, count, stocks, err_15, message;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                _a = req.query, warehouseId = _a.warehouseId, itemId = _a.itemId, _b = _a.page, page = _b === void 0 ? "1" : _b, _c = _a.limit, limit = _c === void 0 ? "50" : _c;
                pageNum = Math.max(1, Number(page));
                limitNum = Math.min(200, Math.max(1, Number(limit)));
                offset = (pageNum - 1) * limitNum;
                conditions = [];
                if (warehouseId)
                    conditions.push((0, drizzle_orm_1.eq)(db_2.stockTable.warehouseId, warehouseId));
                if (itemId)
                    conditions.push((0, drizzle_orm_1.eq)(db_2.stockTable.itemId, itemId));
                whereClause = conditions.length > 0 ? drizzle_orm_1.and.apply(void 0, conditions) : undefined;
                return [4 /*yield*/, db_1.db
                        .select({ count: (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["count(*)"], ["count(*)"]))) })
                        .from(db_2.stockTable)
                        .where(whereClause)];
            case 1:
                count = (_d.sent())[0].count;
                return [4 /*yield*/, db_1.db
                        .select({
                        warehouseId: db_2.stockTable.warehouseId,
                        warehouseName: db_2.warehousesTable.name,
                        itemId: db_2.stockTable.itemId,
                        itemName: db_2.itemsTable.name,
                        itemCode: db_2.itemsTable.code,
                        qty: db_2.stockTable.qty,
                        lastUpdated: db_2.stockTable.lastUpdated,
                    })
                        .from(db_2.stockTable)
                        .innerJoin(db_2.warehousesTable, (0, drizzle_orm_1.eq)(db_2.stockTable.warehouseId, db_2.warehousesTable.id))
                        .innerJoin(db_2.itemsTable, (0, drizzle_orm_1.eq)(db_2.stockTable.itemId, db_2.itemsTable.id))
                        .where(whereClause)
                        .limit(limitNum)
                        .offset(offset)];
            case 2:
                stocks = _d.sent();
                return [2 /*return*/, res.json(paginate(stocks.map(function (s) { return (__assign(__assign({}, s), { qty: Number(s.qty) })); }), Number(count), pageNum, limitNum))];
            case 3:
                err_15 = _d.sent();
                message = err_15 instanceof Error ? err_15.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────────
router.get("/inventory/config/:key", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var setting, err_16, message;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db_1.db
                        .select()
                        .from(db_2.systemSettingsTable)
                        .where((0, drizzle_orm_1.eq)(db_2.systemSettingsTable.key, req.params.key))];
            case 1:
                setting = (_b.sent())[0];
                return [2 /*return*/, res.json({ key: req.params.key, value: (_a = setting === null || setting === void 0 ? void 0 : setting.value) !== null && _a !== void 0 ? _a : null })];
            case 2:
                err_16 = _b.sent();
                message = err_16 instanceof Error ? err_16.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/inventory/config", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, key, value, err_17, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, key = _a.key, value = _a.value;
                if (!key || value === undefined) {
                    return [2 /*return*/, res.status(400).json({ error: "key dan value wajib diisi" })];
                }
                return [4 /*yield*/, db_1.db.insert(db_2.systemSettingsTable).values({ key: key, value: value }).onConflictDoUpdate({
                        target: db_2.systemSettingsTable.key,
                        set: { value: value },
                    })];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ success: true })];
            case 2:
                err_17 = _b.sent();
                message = err_17 instanceof Error ? err_17.message : "Terjadi kesalahan";
                return [2 /*return*/, res.status(500).json({ error: message })];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
var templateObject_1, templateObject_2, templateObject_3;
