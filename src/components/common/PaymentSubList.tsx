// 销售/采购订单 - 回款 / 付款记录子表（按 refType + refId 过滤）
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/services/api";
import { fmtMoney } from "@/lib/format";
import { QuickPaymentDialog } from "./QuickPaymentDialog";
import type { Payment } from "@/types";

export function PaymentSubList({
  orderId,
  orderCode,
  partyName,
  refType = "sales",
  remaining,
  reloadKey,
}: {
  orderId?: string;
  orderCode?: string;
  partyName?: string;
  refType?: "sales" | "purchase";
  remaining?: number; // 未收/未付金额，便于一键填充
  reloadKey?: any;
}) {
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);

  const direction: "in" | "out" = refType === "sales" ? "in" : "out";
  const verb = direction === "in" ? "回款" : "付款";

  useEffect(() => {
    if (!orderId) { setList([]); return; }
    setLoading(true);
    paymentApi.list({ pageSize: 999 }).then((res) => {
      setList(res.list.filter((p) => p.refType === refType && p.refId === orderId && p.direction === direction));
    }).finally(() => setLoading(false));
  }, [orderId, refType, direction, reloadKey, tick]);

  const total = list.reduce((s, p) => s + (p.amount || 0), 0);

  if (!orderId) {
    return (
      <div className="border border-dashed border-foreground/15 rounded-lg p-4 text-center text-xs text-foreground/45">
        请先保存订单后，再登记{verb}记录
      </div>
    );
  }

  return (
    <div className="border border-foreground/10 rounded-lg p-3 bg-foreground/[0.015]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-foreground/65">
          共 <span className="mono font-semibold text-foreground">{list.length}</span> 笔{verb} · 合计{" "}
          <span className={"mono font-semibold " + (direction === "in" ? "text-accent" : "text-warning")}>{fmtMoney(total)}</span>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />新增{verb}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col className="w-10" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-32" />
            <col />
          </colgroup>
          <thead className="text-[11px] text-foreground/55 uppercase tracking-wider">
            <tr className="border-b border-foreground/10">
              <th className="text-left py-2 px-2 font-medium">#</th>
              <th className="text-left py-2 px-2 font-medium">流水号</th>
              <th className="text-left py-2 px-2 font-medium">{verb}日期</th>
              <th className="text-left py-2 px-2 font-medium">方式</th>
              <th className="text-right py-2 px-2 font-medium">金额</th>
              <th className="text-left py-2 px-2 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-6 text-foreground/40">加载中…</td></tr>}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-foreground/40">暂无{verb}记录</td></tr>
            )}
            {list.map((p, idx) => (
              <tr key={p.id} className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
                <td className="py-2 px-2 mono text-foreground/45">{idx + 1}</td>
                <td className="py-2 px-2 mono">
                  <span className={"inline-flex items-center gap-1 " + (direction === "in" ? "text-accent" : "text-warning")}>
                    {direction === "in" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {p.code}
                  </span>
                </td>
                <td className="py-2 px-2 mono text-foreground/70">{p.paidAt}</td>
                <td className="py-2 px-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/[0.06]">{p.method}</span>
                </td>
                <td className={"py-2 px-2 text-right mono font-semibold " + (direction === "in" ? "text-accent" : "text-warning")}>
                  {direction === "in" ? "+" : "-"}{fmtMoney(p.amount)}
                </td>
                <td className="py-2 px-2 text-foreground/65 truncate">{p.remark || "—"}</td>
              </tr>
            ))}
          </tbody>
          {list.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/15 bg-foreground/[0.025]">
                <td colSpan={4} className="py-2 px-2 text-right text-[11px] font-semibold text-foreground/65 uppercase tracking-wider">列合计</td>
                <td className={"py-2 px-2 text-right mono font-bold " + (direction === "in" ? "text-accent" : "text-warning")}>{fmtMoney(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <QuickPaymentDialog
        open={open}
        onOpenChange={setOpen}
        direction={direction}
        refType={refType}
        refId={orderId}
        refCode={orderCode || ""}
        partyName={partyName || ""}
        remaining={remaining}
        onSaved={() => setTick((t) => t + 1)}
      />
    </div>
  );
}
