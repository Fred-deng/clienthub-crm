import { useEffect, useMemo, useState } from "react";
import { salesApi } from "@/services/api";
import type { SalesOrder } from "@/types";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MKpi, MChipFilter, MDateRange } from "../components/MUI";

const inRange = (d: string, f: string, t: string) => (!f || d >= f) && (!t || d <= t);

export default function MReceivables() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [keyword, setKeyword] = useState(""); const [tab, setTab] = useState<"outstanding" | "all" | "settled">("outstanding");
  const [date, setDate] = useState({ from: "", to: "" });
  useEffect(() => { salesApi.all().then(setOrders); }, []);

  const rows = useMemo(() => {
    const map = new Map<string, { customerId: string; customerName: string; orderCount: number; contract: number; received: number; outstanding: number; oldest: string }>();
    orders.filter(o => o.status !== "cancelled" && inRange(o.createdAt, date.from, date.to)).forEach(o => {
      const c = o.contractAmount ?? o.totalAmount;
      const r = map.get(o.customerId) ?? { customerId: o.customerId, customerName: o.customerName, orderCount: 0, contract: 0, received: 0, outstanding: 0, oldest: o.createdAt };
      r.orderCount++; r.contract += c; r.received += o.received; r.outstanding = r.contract - r.received;
      if (o.createdAt < r.oldest) r.oldest = o.createdAt;
      map.set(o.customerId, r);
    });
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, date]);

  const k = keyword.toLowerCase();
  const filtered = rows.filter(r => {
    if (tab === "outstanding" && r.outstanding <= 0) return false;
    if (tab === "settled" && r.outstanding > 0) return false;
    if (k && !r.customerName.toLowerCase().includes(k)) return false;
    return true;
  });

  const totals = filtered.reduce((acc, r) => ({ contract: acc.contract + r.contract, received: acc.received + r.received, outstanding: acc.outstanding + r.outstanding }), { contract: 0, received: 0, outstanding: 0 });

  return (
    <div>
      <MPageHeader title="应收账款" subtitle={`${filtered.length} 个客户`} />
      <section className="px-4 py-3 grid grid-cols-3 gap-2">
        <MKpi label="合同总额" value={`¥${(totals.contract / 10000).toFixed(1)}万`} />
        <MKpi label="已收款" value={`¥${(totals.received / 10000).toFixed(1)}万`} accent="mint" />
        <MKpi label="未收款" value={`¥${(totals.outstanding / 10000).toFixed(1)}万`} accent="tomato" />
      </section>
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索客户" />
      <MChipFilter value={tab} onChange={(v) => setTab(v as any)} options={[{ value: "outstanding", label: "有欠款" }, { value: "settled", label: "已结清" }, { value: "all", label: "全部" }]} />
      <MDateRange value={date} onChange={setDate} />

      <MList empty={!filtered.length}>
        {filtered.map(r => {
          const pct = r.contract ? (r.received / r.contract) * 100 : 0;
          return (
            <MCard key={r.customerId}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{r.customerName}</div>
                  <div className="text-[11px] text-foreground/55 mt-0.5">{r.orderCount} 单 · 最早 {r.oldest}</div>
                </div>
                <MTag variant={r.outstanding > 0 ? "tomato" : "mint"}>{r.outstanding > 0 ? "欠款" : "结清"}</MTag>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px]">
                <div><div className="text-foreground/50">合同</div><div className="font-mono font-bold">¥{r.contract.toLocaleString()}</div></div>
                <div><div className="text-foreground/50">已收</div><div className="font-mono font-bold text-mint">¥{r.received.toLocaleString()}</div></div>
                <div><div className="text-foreground/50">未收</div><div className="font-mono font-bold text-tomato">¥{r.outstanding.toLocaleString()}</div></div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                <div className="h-full bg-mint transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </MCard>
          );
        })}
      </MList>
    </div>
  );
}
