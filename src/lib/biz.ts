// 业务类别（软件 / 硬件）拆分工具
// 规则：产品 category === "software" 视为软件，其余视为硬件
import type { SalesOrder, PurchaseOrder, Product, Payment } from "@/types";

export type BizCategory = "software" | "hardware" | "mixed";
export type BizFilter = "all" | "software" | "hardware";

export const bizLabel: Record<BizCategory, string> = {
  software: "软件",
  hardware: "硬件",
  mixed: "软+硬",
};

export const bizTone: Record<BizCategory, string> = {
  software: "bg-cobalt/10 text-cobalt ring-1 ring-cobalt/20",
  hardware: "bg-mint/20 text-foreground ring-1 ring-mint/40",
  mixed: "bg-mustard/20 text-foreground ring-1 ring-mustard/40",
};

// 通过产品ID判断是否为软件（products 列表需先加载）
export function isSoftwareProduct(productId: string, products: Product[]): boolean {
  const p = products.find((x) => x.id === productId);
  return p?.category === "software";
}

// 拆分订单的软硬件金额
// 若没有产品列表，则按 productName 兜底（含「系统/平台/软件」即视为软件）
function fallbackIsSoftware(name: string): boolean {
  return /系统|平台|软件|MES|WMS|ERP|BI|SaaS/i.test(name);
}

export interface SplitAmounts {
  software: number;
  hardware: number;
  total: number;
  category: BizCategory;
  softwareRatio: number; // 0~1
}

export function splitOrderAmounts(
  items: { productId: string; productName: string; qty: number; price: number }[] | undefined,
  totalAmount: number,
  products?: Product[],
): SplitAmounts {
  if (!items || items.length === 0) {
    return { software: 0, hardware: totalAmount, total: totalAmount, category: "hardware", softwareRatio: 0 };
  }
  let sw = 0, hw = 0;
  for (const it of items) {
    const sub = it.qty * it.price;
    const isSw = products
      ? isSoftwareProduct(it.productId, products)
      : fallbackIsSoftware(it.productName);
    if (isSw) sw += sub; else hw += sub;
  }
  const sum = sw + hw || 1;
  // 用「明细比例」分摊到 totalAmount（合同金额可能不等于明细合计）
  // 注意：先计算软件部分再用减法计算硬件部分，避免浮点漂移导致两者之和与 total 不等。
  const swAmt = Math.round((sw / sum) * totalAmount * 100) / 100;
  const hwAmt = Math.round((totalAmount - swAmt) * 100) / 100;
  let category: BizCategory = "mixed";
  if (sw === 0) category = "hardware";
  else if (hw === 0) category = "software";
  return {
    software: swAmt,
    hardware: hwAmt,
    total: totalAmount,
    category,
    softwareRatio: sw / sum,
  };
}

// 销售订单拆分（按 contractAmount 优先；fallback totalAmount）
export function splitSales(o: SalesOrder, products?: Product[]): SplitAmounts {
  const total = o.contractAmount ?? o.totalAmount;
  return splitOrderAmounts(o.items, total, products);
}

// 销售订单回款拆分
export function splitSalesReceived(o: SalesOrder, products?: Product[]): { software: number; hardware: number } {
  const s = splitOrderAmounts(o.items, o.received || 0, products);
  return { software: s.software, hardware: s.hardware };
}

// 采购订单拆分（采购默认全为硬件，但兼容混合）
export function splitPurchase(o: PurchaseOrder, products?: Product[]): SplitAmounts {
  const total = o.contractAmount || o.totalAmount;
  return splitOrderAmounts(o.items, total, products);
}

export function splitPurchasePaid(o: PurchaseOrder, products?: Product[]): { software: number; hardware: number } {
  const s = splitOrderAmounts(o.items, o.paid || 0, products);
  return { software: s.software, hardware: s.hardware };
}

// 收支拆分：根据关联订单
export function splitPayment(
  pay: Payment,
  orders: { sales: SalesOrder[]; purchases: PurchaseOrder[] },
  products?: Product[],
): SplitAmounts {
  const ref = pay.refType === "sales"
    ? orders.sales.find((s) => s.id === pay.refId)
    : orders.purchases.find((p) => p.id === pay.refId);
  if (!ref) return { software: 0, hardware: pay.amount, total: pay.amount, category: "hardware", softwareRatio: 0 };
  return splitOrderAmounts(ref.items, pay.amount, products);
}

// 应用 BizFilter 到金额（用于按 tab 过滤总额）
export function pickByFilter(s: SplitAmounts, filter: BizFilter): number {
  if (filter === "software") return s.software;
  if (filter === "hardware") return s.hardware;
  return s.total;
}

// 判断单据在某 filter 下是否参与显示（软件 tab 时纯硬件单不显示）
export function matchFilter(s: SplitAmounts, filter: BizFilter): boolean {
  if (filter === "all") return true;
  if (filter === "software") return s.software > 0 || s.category === "software";
  if (filter === "hardware") return s.hardware > 0 || s.category === "hardware";
  return true;
}
