// 库存联动 + 日志服务（基于 mock 内存数据）
import { products, stockLogs } from "@/mock/data";
import { readCurrentOperator } from "@/context/CurrentUserContext";
import type { Product, ProductCategory, PurchaseOrder, SalesOrder, StockLog, StockLogAction } from "@/types";

const todayStr = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const makeId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function writeLog(entry: Omit<StockLog, "id" | "createdAt"> & { createdAt?: string }) {
  const log: StockLog = {
    id: makeId("sl"),
    createdAt: entry.createdAt ?? todayStr(),
    ...entry,
  } as StockLog;
  stockLogs.unshift(log);
  return log;
}

/**
 * 根据名称查找产品；不存在则按 category/price 创建一条新记录并写"create"日志
 */
export function findOrCreateProductByName(
  name: string,
  category: ProductCategory,
  price: number,
  operator?: string,
): Product {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new Error("产品名称不能为空");
  const exist = products.find((p) => p.name.trim() === trimmed);
  if (exist) return exist;
  const code = `PRD-${Date.now().toString().slice(-6)}`;
  const created: Product = {
    id: makeId("p"),
    code,
    name: trimmed,
    category,
    unit: category === "software" ? "套" : "台",
    price: Number(price) || 0,
    cost: Number(price) || 0,
    stock: 0,
    safetyStock: category === "software" ? 0 : 10,
  };
  products.unshift(created);
  writeLog({
    productId: created.id,
    productName: created.name,
    action: "create",
    delta: 0,
    beforeStock: 0,
    afterStock: 0,
    refType: "purchase",
    operator: operator || readCurrentOperator(),
    remark: `采购明细自动建档（${category}）`,
  });
  return created;
}

/** 调整产品库存并记录日志 */
export function adjustStock(opts: {
  productId: string;
  delta: number;             // 正=入库 负=出库
  action: StockLogAction;    // in / out / adjust
  refType?: StockLog["refType"];
  refId?: string;
  refCode?: string;
  operator?: string;
  remark?: string;
}) {
  const p = products.find((x) => x.id === opts.productId);
  if (!p) return;
  const before = p.stock;
  p.stock = Math.max(0, before + opts.delta);
  writeLog({
    productId: p.id,
    productName: p.name,
    action: opts.action,
    delta: opts.delta,
    beforeStock: before,
    afterStock: p.stock,
    refType: opts.refType,
    refId: opts.refId,
    refCode: opts.refCode,
    operator: opts.operator || readCurrentOperator(),
    remark: opts.remark,
  });
}

/** 应用采购订单入库：每条明细 +qty */
export function applyPurchaseReceive(order: PurchaseOrder, operator?: string) {
  order.items.forEach((it) => {
    if (!it.productId || !it.qty) return;
    adjustStock({
      productId: it.productId,
      delta: Math.abs(it.qty),
      action: "in",
      refType: "purchase",
      refId: order.id,
      refCode: order.code,
      operator,
      remark: `采购入库：${order.supplierName}`,
    });
  });
}

/** 撤销采购入库：每条明细 -qty */
export function revertPurchaseReceive(order: PurchaseOrder, operator?: string, reason = "撤销采购入库") {
  order.items.forEach((it) => {
    if (!it.productId || !it.qty) return;
    adjustStock({
      productId: it.productId,
      delta: -Math.abs(it.qty),
      action: "out",
      refType: "purchase",
      refId: order.id,
      refCode: order.code,
      operator,
      remark: `${reason}：${order.supplierName}`,
    });
  });
}

/** 应用销售订单出库：每条明细 -qty（仅扣减有 productId 的硬件型明细） */
export function applySalesDeliver(order: SalesOrder, operator?: string) {
  order.items.forEach((it) => {
    if (!it.productId || !it.qty) return;
    adjustStock({
      productId: it.productId,
      delta: -Math.abs(it.qty),
      action: "out",
      refType: "sales",
      refId: order.id,
      refCode: order.code,
      operator,
      remark: `销售出库：${order.customerName}`,
    });
  });
}

/** 撤销销售出库：每条明细 +qty */
export function revertSalesDeliver(order: SalesOrder, operator?: string, reason = "撤销销售出库") {
  order.items.forEach((it) => {
    if (!it.productId || !it.qty) return;
    adjustStock({
      productId: it.productId,
      delta: Math.abs(it.qty),
      action: "in",
      refType: "sales",
      refId: order.id,
      refCode: order.code,
      operator,
      remark: `${reason}：${order.customerName}`,
    });
  });
}

/** 记录产品信息修改/删除（非数量） */
export function logProductChange(p: Product, action: "update" | "delete", remark?: string, operator?: string) {
  writeLog({
    productId: p.id,
    productName: p.name,
    action,
    delta: 0,
    beforeStock: p.stock,
    afterStock: action === "delete" ? 0 : p.stock,
    refType: "manual",
    operator: operator || readCurrentOperator(),
    remark,
  });
}

// ---------- 简易日志查询 API ----------
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));
export const stockLogApi = {
  async list(q: { productId?: string; action?: string; keyword?: string; page?: number; pageSize?: number } = {}) {
    await delay();
    let arr = [...stockLogs];
    if (q.productId) arr = arr.filter((x) => x.productId === q.productId);
    if (q.action && q.action !== "all") arr = arr.filter((x) => x.action === q.action);
    if (q.keyword) {
      const k = q.keyword.toLowerCase();
      arr = arr.filter((x) =>
        x.productName.toLowerCase().includes(k) ||
        (x.refCode || "").toLowerCase().includes(k) ||
        (x.remark || "").toLowerCase().includes(k),
      );
    }
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return { list: arr.slice(start, start + pageSize), total: arr.length, page, pageSize };
  },
};
