import type { PurchaseOrder, SalesOrder } from "@/types";
import { readCurrentOperator } from "@/context/CurrentUserContext";
import { statusLabels } from "@/lib/format";

export type OrderLogAction = "update" | "delete";
export type OrderLogModule = "purchase" | "sales";

export interface OrderLogChange {
  field: string;       // 字段中文名
  before: any;
  after: any;
}

export interface OrderLog {
  id: string;
  module: OrderLogModule;
  refId: string;
  refCode: string;
  action: OrderLogAction;
  operator: string;
  changes: OrderLogChange[];
  createdAt: string;
  remark?: string;
}

// ---------- 内存存储 ----------
export const orderLogs: OrderLog[] = [];

const makeId = () => `ol${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ts = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// ---------- 字段标签 ----------
const purchaseFieldLabel: Record<string, string> = {
  supplierId: "供应商",
  supplierName: "供应商名称",
  contractTitle: "合同名称",
  signingParty: "签约单位",
  signedAt: "签订日期",
  contractExpireAt: "合同到期日",
  contractAmount: "合同金额",
  linkedSalesContract: "是否关联销售合同",
  linkedSalesContractId: "关联销售合同",
  buyerId: "采购经理",
  applicantId: "申请人",
  department: "所属部门",
  appliedAt: "申请日期",
  status: "订单状态",
  paid: "已付款",
  totalAmount: "明细合计",
  expectedAt: "预计入库",
  createdAt: "下单日期",
  remark: "备注",
  items: "采购明细",
  invoices: "发票管理",
  contractAttachments: "合同附件",
};
const salesFieldLabel: Record<string, string> = {
  customerId: "客户",
  customerName: "客户名称",
  contractTitle: "合同名称",
  contractAmount: "合同金额",
  salesMode: "销售方式",
  contractProperty: "合同属性",
  taxNo: "统一社会信用代码",
  applicantId: "申请人",
  department: "所属部门",
  appliedAt: "申请日期",
  signedAt: "签约日期",
  contractExpireAt: "合同到期日",
  accountManagerId: "客户经理",
  assistantIds: "协助人",
  isSettled: "是否结算",
  isPartyA: "是否甲方",
  serviceFee: "约定服务费",
  outsourceFee: "外包费用",
  salesFee: "销售费用",
  productStdCost: "产品标准成本",
  status: "订单状态",
  received: "已回款",
  totalAmount: "明细合计",
  ownerId: "销售负责人",
  remark: "备注",
  items: "销售明细",
  invoices: "发票管理",
  contractAttachments: "合同附件",
  stampedContractAttachments: "盖章合同",
};

const trackedKeys: Record<OrderLogModule, string[]> = {
  purchase: Object.keys(purchaseFieldLabel),
  sales: Object.keys(salesFieldLabel),
};

function fmtVal(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "是" : "否";
  if (Array.isArray(v)) {
    if (v.length === 0) return "（空）";
    if (typeof v[0] === "object") return `${v.length} 项`;
    return v.join("、");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function isEqual(a: any, b: any) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "object" || typeof b === "object") {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
  }
  return false;
}

/** 计算订单字段级差异 */
export function diffOrder(
  module: OrderLogModule,
  before: Record<string, any>,
  after: Record<string, any>,
): OrderLogChange[] {
  const labels = module === "purchase" ? purchaseFieldLabel : salesFieldLabel;
  const out: OrderLogChange[] = [];
  for (const key of trackedKeys[module]) {
    const a = before?.[key];
    const b = after?.[key];
    if (!isEqual(a, b)) {
      // 子表特殊化：明细行
      if (key === "items" && Array.isArray(a) && Array.isArray(b)) {
        const aDesc = a.map((it: any) => `${it.productName}×${it.qty}`).join("、");
        const bDesc = b.map((it: any) => `${it.productName}×${it.qty}`).join("、");
        if (aDesc !== bDesc) out.push({ field: labels[key], before: aDesc || "（空）", after: bDesc || "（空）" });
        else continue;
      } else if (key === "invoices" && Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) out.push({ field: labels[key], before: `${a.length} 张`, after: `${b.length} 张` });
        else continue;
      } else if (key === "status") {
        out.push({ field: labels[key], before: statusLabels[a as string] || fmtVal(a), after: statusLabels[b as string] || fmtVal(b) });
      } else {
        out.push({ field: labels[key], before: fmtVal(a), after: fmtVal(b) });
      }
    }
  }
  return out;
}

export function logOrderUpdate(
  module: OrderLogModule,
  before: PurchaseOrder | SalesOrder,
  after: Record<string, any>,
  remark?: string,
) {
  const changes = diffOrder(module, before as any, { ...before, ...after });
  if (changes.length === 0 && !remark) return;
  orderLogs.unshift({
    id: makeId(),
    module,
    refId: before.id,
    refCode: before.code,
    action: "update",
    operator: readCurrentOperator(),
    changes,
    createdAt: ts(),
    remark,
  });
}

export function logOrderDelete(module: OrderLogModule, order: PurchaseOrder | SalesOrder) {
  orderLogs.unshift({
    id: makeId(),
    module,
    refId: order.id,
    refCode: order.code,
    action: "delete",
    operator: readCurrentOperator(),
    changes: [],
    createdAt: ts(),
    remark: `删除订单（${(order as any).supplierName || (order as any).customerName || ""}）`,
  });
}

// ---------- 查询 ----------
const delay = (ms = 60) => new Promise((r) => setTimeout(r, ms));
export const orderLogApi = {
  async list(q: { module?: OrderLogModule; refId?: string; operator?: string; action?: string; keyword?: string } = {}) {
    await delay();
    let arr = [...orderLogs];
    if (q.module) arr = arr.filter((x) => x.module === q.module);
    if (q.refId) arr = arr.filter((x) => x.refId === q.refId);
    if (q.operator && q.operator !== "all") arr = arr.filter((x) => x.operator === q.operator);
    if (q.action && q.action !== "all") arr = arr.filter((x) => x.action === q.action);
    if (q.keyword) {
      const k = q.keyword.toLowerCase();
      arr = arr.filter((x) =>
        x.refCode.toLowerCase().includes(k) ||
        x.operator.toLowerCase().includes(k) ||
        x.changes.some((c) => c.field.toLowerCase().includes(k)),
      );
    }
    return arr;
  },
};
