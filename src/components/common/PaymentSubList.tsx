// 销售合同 - 回款记录子表（只读，按 refType=sales & refId 过滤）
import { useEffect, useState } from "react";
import { ArrowDownLeft } from "lucide-react";
import { paymentApi } from "@/services/api";
import { fmtMoney } from "@/lib/format";
import type { Payment } from "@/types";

export function PaymentSubList({ orderId, reloadKey }: { orderId?: string; reloadKey?: any }) {
  const [list, setList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) { setList([]); return; }
    setLoading(true);
    paymentApi.list({ pageSize: 999 }).then((res) => {
      setList(res.list.filter((p) => p.refType === "sales" && p.refId === orderId && p.direction === "in"));
    }).finally(() => setLoading(false));
  }, [orderId, reloadKey]);

  const total = list.reduce((s, p) => s + (p.amount || 0), 0);

  if (!orderId) {
    return (
      <div className="border border-dashed border-foreground/15 rounded-lg p-4 text-center text-xs text-foreground/45">
        合同保存后可在此查看回款记录（请在「财务收支」中登记回款）
      </div>
    );
  }

  return (
    <div className="border border-foreground/10 rounded-lg p-3 bg-foreground/[0.015]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-foreground/65">
          共 <span className="mono font-semibold text-foreground">{list.length}</span> 笔回款 · 合计{" "}
          <span className="mono font-semibold text-accent">{fmtMoney(total)}</span>
        </div>
        <span className="text-[11px] text-foreground/45">回款记录请在「财务收支」中登记</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[11px] text-foreground/55 uppercase tracking-wider">
            <tr className="border-b border-foreground/10">
              <th className="text-left py-2 px-2 font-medium w-10">#</th>
              <th className="text-left py-2 px-2 font-medium">流水号</th>
              <th className="text-left py-2 px-2 font-medium w-28">回款日期</th>
              <th className="text-left py-2 px-2 font-medium">收款方式</th>
              <th className="text-right py-2 px-2 font-medium w-32">金额</th>
              <th className="text-left py-2 px-2 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-6 text-foreground/40">加载中…</td></tr>}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-foreground/40">暂无回款记录</td></tr>
            )}
            {list.map((p, idx) => (
              <tr key={p.id} className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
                <td className="py-2 px-2 mono text-foreground/45">{idx + 1}</td>
                <td className="py-2 px-2 mono">
                  <span className="inline-flex items-center gap-1 text-accent">
                    <ArrowDownLeft className="h-3 w-3" />{p.code}
                  </span>
                </td>
                <td className="py-2 px-2 mono text-foreground/70">{p.paidAt}</td>
                <td className="py-2 px-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/[0.06]">{p.method}</span>
                </td>
                <td className="py-2 px-2 num mono font-semibold text-accent">+{fmtMoney(p.amount)}</td>
                <td className="py-2 px-2 text-foreground/65 truncate max-w-[200px]">{p.remark || "—"}</td>
              </tr>
            ))}
          </tbody>
          {list.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/15 bg-foreground/[0.025]">
                <td colSpan={4} className="py-2 px-2 text-right text-[11px] font-semibold text-foreground/65 uppercase tracking-wider">列合计</td>
                <td className="py-2 px-2 num mono font-bold text-accent">{fmtMoney(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
