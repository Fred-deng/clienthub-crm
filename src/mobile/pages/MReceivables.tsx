// 应收账款（移动端）— 1:1 复刻 PC Receivables
import { useEffect, useMemo, useState } from "react";
import { MPageHeader, MSearchBar, MCard, MList, MTag, MKpi, MChipFilter, MDateRange } from "../components/MUI";
import { salesApi, customerApi, productApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { splitSales, splitSalesReceived, type BizFilter } from "@/lib/biz";
import { inRange } from "@/components/common/DateRangeFilter";
import type { SalesOrder, Customer, Product } from "@/types";

interface Row { customerId: string; customerName: string; orderCount: number; contractAmount: number; received: number; outstanding: number; oldest: string; level?: string; swContract: number; hwContract: number; swReceived: number; hwReceived: number; swOut: number; hwOut: number; }

export default function MReceivables() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [filter, setFilter] = useState<"all" | "outstanding" | "settled">("outstanding");
  const [range, setRange] = useState({ from: "", to: "" });

  useEffect(() => { salesApi.all().then(setOrders); customerApi.all().then(setCustomers); productApi.all().then(setProducts); }, []);

  const rows: Row[] = useMemo(() => {
    const map = new Map<string, Row>();
    orders.filter(o => o.status !== "cancelled" && inRange(o.createdAt, { from: range.from || undefined, to: range.to || undefined })).forEach(o => {
      const c = o.contractAmount ?? o.totalAmount;
      const sCon = splitSales(o, products); const sRec = splitSalesReceived(o, products);
      const r = map.get(o.customerId) || { customerId: o.customerId, customerName: o.customerName, orderCount: 0, contractAmount: 0, received: 0, outstanding: 0, oldest: o.createdAt, swContract: 0, hwContract: 0, swReceived: 0, hwReceived: 0, swOut: 0, hwOut: 0 };
      r.orderCount += 1; r.contractAmount += c; r.received += o.received;
      r.swContract += sCon.software; r.hwContract += sCon.hardware;
      r.swReceived += sRec.software; r.hwReceived += sRec.hardware;
      r.outstanding = r.contractAmount - r.received;
      r.swOut = r.swContract - r.swReceived; r.hwOut = r.hwContract - r.hwReceived;
      if (o.createdAt < r.oldest) r.oldest = o.createdAt;
      map.set(o.customerId, r);
    });
    customers.forEach(c => { const r = map.get(c.id); if (r) r.level = c.level; });
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, customers, products, range]);

  const view = (r: Row) => biz === "software" ? { contract: r.swContract, received: r.swReceived, outstanding: r.swOut } : biz === "hardware" ? { contract: r.hwContract, received: r.hwReceived, outstanding: r.hwOut } : { contract: r.contractAmount, received: r.received, outstanding: r.outstanding };

  const filtered = rows.filter(r => {
    const v = view(r);
    if (biz !== "all" && v.contract <= 0) return false;
    if (filter === "outstanding" && v.outstanding <= 0) return false;
    if (filter === "settled" && v.outstanding > 0) return false;
    if (keyword && !r.customerName.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const totals = filtered.reduce((s, r) => { const v = view(r); return { contract: s.contract + v.contract, received: s.received + v.received, outstanding: s.outstanding + v.outstanding }; }, { contract: 0, received: 0, outstanding: 0 });

  const today = new Date();
  const aging = (d: string) => Math.max(0, Math.floor((today.getTime() - new Date(d).getTime()) / 86400000));

  return (
    <>
      <MPageHeader title="应收账款" subtitle={`${filtered.length} 客户`} />
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <MKpi label="合同总额" value={fmtMoneyShort(totals.contract)} accent="cobalt" />
        <MKpi label="已回款" value={fmtMoneyShort(totals.received)} accent="mint" />
        <MKpi label="未收" value={fmtMoneyShort(totals.outstanding)} accent="tomato" />
      </div>
      <MChipFilter value={biz} onChange={(v) => setBiz(v as any)}
        options={[{ value: "all", label: "全部" }, { value: "software", label: "软件" }, { value: "hardware", label: "硬件" }] as any} />
      <MChipFilter value={filter} onChange={setFilter as any}
        options={[{ value: "outstanding", label: "仅看未收" }, { value: "all", label: "全部" }, { value: "settled", label: "已结清" }]} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索客户" />
      <MDateRange value={range} onChange={setRange} />

      <MList empty={filtered.length === 0}>
        {filtered.map(r => {
          const v = view(r); const days = aging(r.oldest);
          const ageTone = days > 90 ? "tomato" : days > 30 ? "mustard" : "muted";
          return (
            <MCard key={r.customerId}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[14px] truncate">{r.customerName}</span>
                    {r.level && <MTag variant="muted">{r.level}级</MTag>}
                    <MTag variant={ageTone as any}>账龄 {days}d</MTag>
                  </div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{r.orderCount} 单 · 最早 {r.oldest}</div>
                  <div className="text-[12px] mt-1.5 font-mono">合同 <span className="font-bold">{fmtMoney(v.contract)}</span> · 已回 <span className="text-mint font-bold">{fmtMoney(v.received)}</span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-foreground/45 font-mono uppercase">未收</div>
                  <div className={`text-lg font-display font-black tabular-nums ${v.outstanding > 0 ? "text-tomato" : "text-foreground/40"}`}>{fmtMoneyShort(v.outstanding)}</div>
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>
    </>
  );
}
