// 付款 / 回款 高阶服务：在创建/删除时同步更新关联订单的 paid/received 字段。
import { paymentApi, salesApi, purchaseApi } from "./api";
import type { Payment } from "@/types";

export async function createPaymentAndSync(data: Omit<Payment, "id">): Promise<Payment> {
  const created = await paymentApi.create(data as any);
  await syncOrderTotals(created.refType, created.refId);
  return created;
}

export async function removePaymentAndSync(id: string): Promise<boolean> {
  const all = await paymentApi.all();
  const target = all.find((p) => p.id === id);
  const ok = await paymentApi.remove(id);
  if (ok && target) await syncOrderTotals(target.refType, target.refId);
  return ok;
}

async function syncOrderTotals(refType: "sales" | "purchase", refId: string) {
  if (!refId) return;
  const all = await paymentApi.all();
  const sum = all
    .filter((p) => p.refType === refType && p.refId === refId)
    .reduce((s, p) => s + (p.amount || 0), 0);
  if (refType === "sales") {
    await salesApi.update(refId, { received: sum } as any);
  } else {
    await purchaseApi.update(refId, { paid: sum } as any);
  }
}

/** 工具：基于现有支付列表计算订单累计金额（无需调用 API，性能更好） */
export function computeOrderPaidTotal(
  payments: Payment[],
  refType: "sales" | "purchase",
  refId: string,
): number {
  return payments
    .filter((p) => p.refType === refType && p.refId === refId)
    .reduce((s, p) => s + (p.amount || 0), 0);
}
