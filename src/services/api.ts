// 通用 CRUD 仓储层。便于将来切换为真实 HTTP 接口：
// 只需替换本文件中各方法的内部实现为 fetch/axios 调用即可。
import type { Paged, ListQuery } from "@/types";
import {
  customers, products, suppliers, supplierContacts, purchases, contracts, salesOrders, payments, employees, contacts, followUps,
} from "@/mock/data";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function paginate<T>(list: T[], q: ListQuery = {}): Paged<T> {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length, page, pageSize };
}

function filterByKeyword<T extends Record<string, any>>(list: T[], keyword?: string, fields: string[] = []): T[] {
  if (!keyword) return list;
  const k = keyword.toLowerCase();
  return list.filter((it) => fields.some((f) => String(it[f] ?? "").toLowerCase().includes(k)));
}

function makeId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function buildCrud<T extends { id: string }>(
  store: T[],
  opts: { idPrefix: string; searchFields: string[]; filter?: (item: T, q: ListQuery) => boolean }
) {
  return {
    async list(q: ListQuery = {}): Promise<Paged<T>> {
      await delay();
      let arr = [...store];
      if (opts.filter) arr = arr.filter((it) => opts.filter!(it, q));
      arr = filterByKeyword(arr, q.keyword, opts.searchFields);
      return paginate(arr, q);
    },
    async all(): Promise<T[]> {
      await delay(50);
      return [...store];
    },
    async get(id: string): Promise<T | undefined> {
      await delay(50);
      return store.find((it) => it.id === id);
    },
    async create(data: Omit<T, "id">): Promise<T> {
      await delay();
      const item = { ...(data as any), id: makeId(opts.idPrefix) } as T;
      store.unshift(item);
      return item;
    },
    async update(id: string, data: Partial<T>): Promise<T | undefined> {
      await delay();
      const idx = store.findIndex((it) => it.id === id);
      if (idx < 0) return undefined;
      store[idx] = { ...store[idx], ...data };
      return store[idx];
    },
    async remove(id: string): Promise<boolean> {
      await delay();
      const idx = store.findIndex((it) => it.id === id);
      if (idx < 0) return false;
      store.splice(idx, 1);
      return true;
    },
  };
}

export const customerApi = buildCrud(customers, {
  idPrefix: "c",
  searchFields: ["name", "code", "contact", "phone"],
  filter: (it, q) => {
    if (q.stage && q.stage !== "all" && it.stage !== q.stage) return false;
    if (q.status && q.status !== "all" && it.status !== q.status) return false;
    if (q.seaStatus && q.seaStatus !== "all" && it.seaStatus !== q.seaStatus) return false;
    if (q.level && q.level !== "all" && it.level !== q.level) return false;
    return true;
  },
});

export const contactApi = buildCrud(contacts, {
  idPrefix: "ct",
  searchFields: ["name", "code", "phone", "customerName", "position"],
  filter: (it, q) => {
    if (q.customerId && q.customerId !== "all" && it.customerId !== q.customerId) return false;
    if (q.isPrimary === true && !it.isPrimary) return false;
    return true;
  },
});

export const followUpApi = buildCrud(followUps, {
  idPrefix: "fu",
  searchFields: ["code", "customerName", "subject", "content", "contactName", "oppStatus", "salesLead", "intentProduct"],
  filter: (it, q) => {
    if (q.customerId && q.customerId !== "all" && it.customerId !== q.customerId) return false;
    if (q.contactWay && q.contactWay !== "all" && it.contactWay !== q.contactWay) return false;
    if (q.oppStatus && q.oppStatus !== "all" && it.oppStatus !== q.oppStatus) return false;
    return true;
  },
});

export const productApi = buildCrud(products, {
  idPrefix: "p",
  searchFields: ["name", "code", "spec"],
  filter: (it, q) => {
    if (q.category && q.category !== "all" && it.category !== q.category) return false;
    if (q.lowStock && it.stock > it.safetyStock) return false;
    return true;
  },
});

export const supplierApi = buildCrud(suppliers, {
  idPrefix: "s",
  searchFields: ["name", "code", "contact"],
});

export const supplierContactApi = buildCrud(supplierContacts, {
  idPrefix: "sc",
  searchFields: ["name", "code", "phone", "supplierName", "position"],
  filter: (it, q) => {
    if (q.supplierId && q.supplierId !== "all" && it.supplierId !== q.supplierId) return false;
    return true;
  },
});

export const purchaseApi = buildCrud(purchases, {
  idPrefix: "po",
  searchFields: ["code", "supplierName"],
  filter: (it, q) => {
    if (q.status && q.status !== "all" && it.status !== q.status) return false;
    if (q.dateFrom && (it.createdAt || "") < q.dateFrom) return false;
    if (q.dateTo && (it.createdAt || "") > q.dateTo) return false;
    return true;
  },
});

export const contractApi = buildCrud(contracts, {
  idPrefix: "ct",
  searchFields: ["code", "customerName", "title"],
  filter: (it, q) => {
    if (q.status && q.status !== "all" && it.status !== q.status) return false;
    return true;
  },
});

export const salesApi = buildCrud(salesOrders, {
  idPrefix: "so",
  searchFields: ["code", "customerName"],
  filter: (it, q) => {
    if (q.status && q.status !== "all" && it.status !== q.status) return false;
    if (q.month) {
      const m = (it as any).createdAt?.slice(0, 7);
      if (m !== q.month) return false;
    }
    if (q.dateFrom && (it.createdAt || "") < q.dateFrom) return false;
    if (q.dateTo && (it.createdAt || "") > q.dateTo) return false;
    return true;
  },
});

export const paymentApi = buildCrud(payments, {
  idPrefix: "pay",
  searchFields: ["code", "partyName", "refCode"],
  filter: (it, q) => {
    if (q.direction && q.direction !== "all" && it.direction !== q.direction) return false;
    if (q.dateFrom && (it.paidAt || "") < q.dateFrom) return false;
    if (q.dateTo && (it.paidAt || "") > q.dateTo) return false;
    return true;
  },
});

export const employeeApi = {
  async all() {
    return employees;
  },
};

// ---------- Aggregations for dashboard / reports ----------
import { splitSales, splitPurchase, splitSalesReceived, splitPurchasePaid } from "@/lib/biz";

export const statsApi = {
  async dashboard() {
    await delay(150);
    const month = new Date().toISOString().slice(0, 7);
    // 有效销售订单：排除已取消（统计销售额时用全部已生效订单）
    const activeSales = salesOrders.filter((o) => o.status !== "cancelled");
    const activePurs = purchases.filter((p) => p.status !== "cancelled" && p.status !== "draft");
    const monthSales = activeSales.filter((o) => (o.createdAt || "").startsWith(month));
    const monthRevenue = monthSales.reduce((s, o) => s + (o.contractAmount ?? o.totalAmount), 0);
    const receivable = activeSales.reduce((s, o) => s + Math.max((o.contractAmount ?? o.totalAmount) - o.received, 0), 0);
    const payable = activePurs.reduce((s, p) => s + Math.max((p.contractAmount || p.totalAmount) - p.paid, 0), 0);
    const activeContracts = contracts.filter((c) => c.status === "active").length;
    const formalCustomers = customers.filter((c) => c.stage === "formal").length;
    const leadCustomers = customers.filter((c) => c.stage === "lead").length;

    // 销售按软硬件拆分（本月口径用于 KPI；趋势/排行用全量）
    let revSw = 0, revHw = 0, recvSw = 0, recvHw = 0;
    let gpSw = 0, gpHw = 0; // 本月毛利（按销售明细 - 成本）
    monthSales.forEach((o) => {
      const s = splitSales(o, products);
      revSw += s.software; revHw += s.hardware;
      o.items.forEach((it) => {
        const prod = products.find((pp) => pp.id === it.productId);
        const cost = (prod?.cost ?? 0) * it.qty;
        const profit = it.qty * it.price - cost;
        if (prod?.category === "software") gpSw += profit; else gpHw += profit;
      });
    });
    activeSales.forEach((o) => {
      const r = splitSalesReceived(o, products);
      recvSw += r.software; recvHw += r.hardware;
    });
    let payableSw = 0, payableHw = 0;
    activePurs.forEach((p) => {
      const s = splitPurchase(p, products);
      payableSw += s.software; payableHw += s.hardware;
      const paid = splitPurchasePaid(p, products);
      payableSw -= paid.software; payableHw -= paid.hardware;
    });
    // 应收按软硬件
    const recvAbleSw = revSw - recvSw;
    const recvAbleHw = revHw - recvHw;

    // 月度销售趋势（按 createdAt 分组，软硬件分列）
    const trendMap = new Map<string, { software: number; hardware: number; amount: number }>();
    activeSales.forEach((o) => {
      const m = o.createdAt.slice(0, 7);
      const cur = trendMap.get(m) || { software: 0, hardware: 0, amount: 0 };
      const s = splitSales(o, products);
      cur.software += s.software;
      cur.hardware += s.hardware;
      cur.amount += s.total;
      trendMap.set(m, cur);
    });
    const trend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([month, v]) => ({ month, ...v }));

    // 销售员业绩（拆分软硬件）
    const ownerMap = new Map<string, { amount: number; software: number; hardware: number }>();
    activeSales.forEach((o) => {
      const cur = ownerMap.get(o.ownerId) || { amount: 0, software: 0, hardware: 0 };
      const s = splitSales(o, products);
      cur.amount += s.total; cur.software += s.software; cur.hardware += s.hardware;
      ownerMap.set(o.ownerId, cur);
    });
    const ranking = Array.from(ownerMap.entries())
      .map(([ownerId, v]) => ({
        ownerId,
        name: employees.find((e) => e.id === ownerId)?.name ?? ownerId,
        ...v,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 低库存
    const lowStock = products.filter((p) => p.stock <= p.safetyStock && p.category !== "software").slice(0, 6);

    // 客户业务覆盖分布
    const cusBiz = new Map<string, { sw: boolean; hw: boolean }>();
    salesOrders.forEach((o) => {
      const has = cusBiz.get(o.customerId) || { sw: false, hw: false };
      o.items.forEach((it) => {
        const p = products.find((pp) => pp.id === it.productId);
        if (p?.category === "software") has.sw = true; else has.hw = true;
      });
      cusBiz.set(o.customerId, has);
    });
    let swOnly = 0, hwOnly = 0, both = 0, none = 0;
    customers.forEach((c) => {
      const b = cusBiz.get(c.id);
      if (!b) none++;
      else if (b.sw && b.hw) both++;
      else if (b.sw) swOnly++;
      else hwOnly++;
    });
    const typeDist = [
      { name: "纯软件客户", value: swOnly },
      { name: "纯硬件客户", value: hwOnly },
      { name: "软+硬客户", value: both },
      { name: "无订单", value: none },
    ];

    return {
      monthRevenue,
      monthGrossProfit: gpSw + gpHw,
      receivable,
      payable,
      activeContracts,
      formalCustomers,
      leadCustomers,
      trend,
      ranking,
      lowStock,
      typeDist,
      recentSales: salesOrders.slice(0, 6),
      // 软硬件拆分
      biz: {
        revenue: { software: revSw, hardware: revHw },
        grossProfit: { software: gpSw, hardware: gpHw },
        received: { software: recvSw, hardware: recvHw },
        receivable: { software: recvAbleSw, hardware: recvAbleHw },
        payable: { software: payableSw, hardware: payableHw },
      },
    };
  },

  async monthlyReconcile(month: string) {
    await delay(200);
    const inSales = salesOrders.filter((o) => o.createdAt.startsWith(month));
    const inPays = payments.filter((p) => p.paidAt.startsWith(month));
    let salesSw = 0, salesHw = 0, recvSw = 0, recvHw = 0, paidSw = 0, paidHw = 0;
    inSales.forEach((o) => {
      const s = splitSales(o, products);
      salesSw += s.software; salesHw += s.hardware;
    });
    inPays.forEach((p) => {
      const ref = p.refType === "sales" ? salesOrders.find((s) => s.id === p.refId) : purchases.find((x) => x.id === p.refId);
      if (!ref) return;
      const items = (ref as any).items || [];
      let sw = 0, hw = 0;
      items.forEach((it: any) => {
        const sub = it.qty * it.price;
        const prod = products.find((pp) => pp.id === it.productId);
        if (prod?.category === "software") sw += sub; else hw += sub;
      });
      const sum = sw + hw || 1;
      const swPart = (sw / sum) * p.amount;
      const hwPart = p.amount - swPart;
      if (p.direction === "in") { recvSw += swPart; recvHw += hwPart; }
      else { paidSw += swPart; paidHw += hwPart; }
    });
    return {
      month,
      sales: inSales,
      payments: inPays,
      totalSales: inSales.reduce((s, o) => s + o.totalAmount, 0),
      totalReceived: inPays.filter((p) => p.direction === "in").reduce((s, p) => s + p.amount, 0),
      totalPaid: inPays.filter((p) => p.direction === "out").reduce((s, p) => s + p.amount, 0),
      biz: {
        sales: { software: salesSw, hardware: salesHw },
        received: { software: recvSw, hardware: recvHw },
        paid: { software: paidSw, hardware: paidHw },
      },
    };
  },
};
