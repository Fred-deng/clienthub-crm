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
    if (q.type && q.type !== "all" && it.type !== q.type) return false;
    if (q.stage && q.stage !== "all" && it.stage !== q.stage) return false;
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
  searchFields: ["code", "customerName", "subject", "content", "contactName"],
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
    return true;
  },
});

export const paymentApi = buildCrud(payments, {
  idPrefix: "pay",
  searchFields: ["code", "partyName", "refCode"],
  filter: (it, q) => {
    if (q.direction && q.direction !== "all" && it.direction !== q.direction) return false;
    return true;
  },
});

export const employeeApi = {
  async all() {
    return employees;
  },
};

// ---------- Aggregations for dashboard / reports ----------
export const statsApi = {
  async dashboard() {
    await delay(150);
    const monthRevenue = salesOrders.reduce((s, o) => s + o.totalAmount, 0);
    const receivable = salesOrders.reduce((s, o) => s + (o.totalAmount - o.received), 0);
    const payable = purchases.reduce((s, p) => s + (p.totalAmount - p.paid), 0);
    const activeContracts = contracts.filter((c) => c.status === "active").length;
    const formalCustomers = customers.filter((c) => c.stage === "formal").length;
    const leadCustomers = customers.filter((c) => c.stage === "lead").length;

    // 月度销售趋势（按 createdAt 分组）
    const trendMap = new Map<string, number>();
    salesOrders.forEach((o) => {
      const m = o.createdAt.slice(0, 7);
      trendMap.set(m, (trendMap.get(m) || 0) + o.totalAmount);
    });
    const trend = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([month, amount]) => ({ month, amount }));

    // 销售员业绩
    const ownerMap = new Map<string, number>();
    salesOrders.forEach((o) => ownerMap.set(o.ownerId, (ownerMap.get(o.ownerId) || 0) + o.totalAmount));
    const ranking = Array.from(ownerMap.entries())
      .map(([ownerId, amount]) => ({
        ownerId,
        name: employees.find((e) => e.id === ownerId)?.name ?? ownerId,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 低库存
    const lowStock = products.filter((p) => p.stock <= p.safetyStock && p.category !== "software").slice(0, 6);

    // 客户类型分布
    const typeDist = [
      { name: "软件客户", value: customers.filter((c) => c.type === "software").length },
      { name: "硬件客户", value: customers.filter((c) => c.type === "hardware").length },
    ];

    return {
      monthRevenue,
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
    };
  },

  async monthlyReconcile(month: string) {
    await delay(200);
    const inSales = salesOrders.filter((o) => o.createdAt.startsWith(month));
    const inPays = payments.filter((p) => p.paidAt.startsWith(month));
    return {
      month,
      sales: inSales,
      payments: inPays,
      totalSales: inSales.reduce((s, o) => s + o.totalAmount, 0),
      totalReceived: inPays.filter((p) => p.direction === "in").reduce((s, p) => s + p.amount, 0),
      totalPaid: inPays.filter((p) => p.direction === "out").reduce((s, p) => s + p.amount, 0),
    };
  },
};
