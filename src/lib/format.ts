// Format helpers
export const fmtMoney = (n: number) =>
  "¥" + (n ?? 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtMoneyShort = (n: number) => {
  if (n >= 10000) return "¥" + (n / 10000).toFixed(1) + "万";
  return "¥" + n.toLocaleString("zh-CN");
};

// Split a money amount into a big number + small unit suffix, for KPI display.
export const splitMoneyShort = (n: number): { num: string; unit: string } => {
  if (n >= 100000000) return { num: (n / 100000000).toFixed(2), unit: "亿" };
  if (n >= 10000) return { num: (n / 10000).toFixed(1), unit: "万" };
  return { num: n.toLocaleString("zh-CN"), unit: "" };
};

export const fmtInt = (n: number) => (n ?? 0).toLocaleString("zh-CN");

export const customerStageLabel = (s: string) => (s === "lead" ? "潜在客户" : "正式客户");

// —— 整合后的客户状态：单一字段覆盖生命周期 ——
export const customerStatusLabel: Record<string, string> = {
  potential: "潜在",
  intent: "意向中",
  active: "合作中",
  paused: "已暂停",
  inactive: "沉默",
  lost: "流失",
};

// 用于 Badge 配色的 tone（对应 index.css/tailwind 中的语义色）
export const customerStatusTone: Record<string, string> = {
  potential: "cobalt",
  intent: "mustard",
  active: "mint",
  paused: "mustard",
  inactive: "muted",
  lost: "tomato",
};

// 由统一状态推导阶段（潜在/意向 -> lead，其他 -> formal），
// 用于销售订单等地方对「正式客户」的过滤
export const deriveCustomerStage = (status?: string): "lead" | "formal" =>
  status === "potential" || status === "intent" ? "lead" : "formal";

export const statusLabels: Record<string, string> = {
  draft: "草稿",
  ordered: "已下单",
  received: "已入库",
  cancelled: "已取消",
  active: "执行中",
  completed: "已完成",
  terminated: "已终止",
  pending: "待发货",
  shipped: "运输中",
  delivered: "已送达",
};

export const statusTone: Record<string, string> = {
  draft: "muted",
  ordered: "primary",
  received: "accent",
  cancelled: "destructive",
  active: "primary",
  completed: "accent",
  terminated: "destructive",
  pending: "muted",
  shipped: "primary",
  delivered: "accent",
};

// 产品分类标签：动态读取自 categoryStore（产品库存可手动增删）。
// 该 Proxy 兼容旧用法（直接 productCategoryLabel[id] 取标签 / Object.entries 遍历）。
import { categoryStore } from "@/services/categories";
export const productCategoryLabel: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_t, key: string) {
    if (key === Symbol.toPrimitive as any) return undefined;
    return categoryStore.labelOf(key) || key;
  },
  ownKeys() {
    return categoryStore.getAll().map((c) => c.id);
  },
  getOwnPropertyDescriptor(_t, key: string) {
    if (categoryStore.getAll().some((c) => c.id === key)) {
      return { enumerable: true, configurable: true, writable: false, value: categoryStore.labelOf(key) };
    }
    return undefined;
  },
  has(_t, key: string) {
    return categoryStore.getAll().some((c) => c.id === key);
  },
}) as Record<string, string>;

export const currentMonth = () => new Date().toISOString().slice(0, 7);
