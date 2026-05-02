import { readCurrentOperator } from "@/context/CurrentUserContext";
import type { LineItem } from "@/components/common/LineItemsEditor";
import { productCategoryLabel } from "@/lib/format";

export type LineItemLogAction = "add" | "update" | "delete";
export type LineItemLogModule = "purchase" | "sales";

export interface LineItemFieldChange {
  field: string;   // 中文字段名
  before: any;
  after: any;
}

export interface LineItemLog {
  id: string;
  module: LineItemLogModule;
  /** 业务主键：编辑既有订单时为订单 id；新建时为临时 draft session id */
  scope: string;
  action: LineItemLogAction;
  productName: string;
  /** 行快照（用于 add / delete 时整行展示） */
  snapshot?: Partial<LineItem>;
  /** update 时记录字段级差异 */
  changes?: LineItemFieldChange[];
  operator: string;
  createdAt: string;
}

// ---------- localStorage 持久化 ----------
const KEY = "lineItemLogs.v1";

function readAll(): LineItemLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function writeAll(list: LineItemLog[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(-2000))); } catch { /* ignore */ }
}

const makeId = () => `lil${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowTs = () => new Date().toISOString().slice(0, 19).replace("T", " ");

const fieldLabel: Record<keyof LineItem, string> = {
  productId: "产品ID",
  productName: "名称",
  category: "分类",
  qty: "数量",
  price: "单价",
};

function fmt(field: keyof LineItem, val: any): any {
  if (field === "category") return productCategoryLabel[val as string] ?? val;
  return val;
}

/** 比较两行，返回字段差异（不包含 productId） */
export function diffLineItem(before: LineItem, after: LineItem): LineItemFieldChange[] {
  const out: LineItemFieldChange[] = [];
  (Object.keys(fieldLabel) as (keyof LineItem)[]).forEach((k) => {
    if (k === "productId") return;
    if (before[k] !== after[k]) {
      out.push({ field: fieldLabel[k], before: fmt(k, before[k]), after: fmt(k, after[k]) });
    }
  });
  return out;
}

function append(log: Omit<LineItemLog, "id" | "createdAt" | "operator">) {
  const all = readAll();
  all.push({
    ...log,
    id: makeId(),
    operator: readCurrentOperator(),
    createdAt: nowTs(),
  });
  writeAll(all);
}

export function logLineItemAdd(module: LineItemLogModule, scope: string, item: LineItem) {
  append({
    module, scope, action: "add",
    productName: item.productName || "（未命名）",
    snapshot: { ...item },
  });
}

export function logLineItemUpdate(module: LineItemLogModule, scope: string, before: LineItem, after: LineItem) {
  const changes = diffLineItem(before, after);
  if (!changes.length) return;
  append({
    module, scope, action: "update",
    productName: after.productName || before.productName || "（未命名）",
    changes,
  });
}

export function logLineItemDelete(module: LineItemLogModule, scope: string, item: LineItem) {
  append({
    module, scope, action: "delete",
    productName: item.productName || "（未命名）",
    snapshot: { ...item },
  });
}

/** 查询某 scope 的全部日志（按时间倒序） */
export function listLineItemLogs(module: LineItemLogModule, scope: string): LineItemLog[] {
  return readAll()
    .filter((l) => l.module === module && l.scope === scope)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
