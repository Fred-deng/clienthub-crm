// 应付账款（移动端）— 1:1 复刻 PC Payables
import { useEffect, useMemo, useState } from "react";
import { MPageHeader, MSearchBar, MCard, MList, MTag, MKpi, MChipFilter, MDateRange } from "../components/MUI";
import { inRange } from "@/components/common/DateRangeFilter";
import { purchaseApi, supplierApi, productApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { splitPurchase, splitPurchasePaid, type BizFilter } from "@/lib/biz";
import { categoryStore } from "@/services/categories";
import type { PurchaseOrder, Supplier, Product } from "@/types";

interface Row { supplierId: string; supplierName: string; orderCount: number; contractAmount: number; paid: number; outstanding: number; oldest: string; category?: string; swContract: number; hwContract: number; swPaid: number; hwPaid: number; swOut: number; hwOut: number; }

export default function MPayables() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [filter, setFilter] = useState<"all" | "outstanding" | "settled">("outstanding");
  const [range, setRange] = useState({ from: "", to: "" });

  useEffect(() => { purchaseApi.all().then(setOrders); supplierApi.all().then(setSuppliers); productApi.all().then(setProducts); }, []);

  const rows: Row[] = useMemo(() => {
    const map = new Map<string, Row>();
    orders.filter(o => o.status !== "cancelled" && o.status !== "draft" && inRange(o.createdAt, { from: range.from || undefined, to: range.to || undefined })).forEach(o => {
      const c = o.contractAmount || o.totalAmount;
      const sCon = splitPurchase(o, products); const sPaid = splitPurchasePaid(o, products);
      const r = map.get(o.supplierId) || { supplierId: o.supplierId, supplierName: o.supplierName, orderCount: 0, contractAmount: 0, paid: 0, outstanding: 0, oldest: o.createdAt, swContract: 0, hwContract: 0, swPaid: 0, hwPaid: 0, swOut: 0, hwOut: 0 };
      r.orderCount += 1; r.contractAmount += c; r.paid += o.paid;
      r.swContract += sCon.software; r.hwContract += sCon.hardware;
      r.swPaid += sPaid.software; r.hwPaid += sPaid.hardware;
      r.outstanding = r.contractAmount - r.paid;
      r.swOut = r.swContract - r.swPaid; r.hwOut = r.hwContract - r.hwPaid;
      if (o.createdAt && o.createdAt < r.oldest) r.oldest = o.createdAt;
      map.set(o.supplierId, r);
    });
    suppliers.forEach(s => { const r = map.get(s.id); if (r) r.category = s.category; });
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, suppliers, products]);

  const view = (r: Row) => biz === "software" ? { contract: r.swContract, paid: r.swPaid, outstanding: r.swOut } : biz === "hardware" ? { contract: r.hwContract, paid: r.hwPaid, outstanding: r.hwOut } : { contract: r.contractAmount, paid: r.paid, outstanding: r.outstanding };

  const filtered = rows.filter(r => {
    const v = view(r);
    if (biz !== "all" && v.contract <= 0) return false;
    if (filter === "outstanding" && v.outstanding <= 0) return false;
    if (filter === "settled" && v.outstanding > 0) return false;
    if (keyword && !r.supplierName.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const totals = filtered.reduce((s, r) => { const v = view(r); return { contract: s.contract + v.contract, paid: s.paid + v.paid, outstanding: s.outstanding + v.outstanding }; }, { contract: 0, paid: 0, outstanding: 0 });

  const today = new Date();
  const aging = (d: string) => Math.max(0, Math.floor((today.getTime() - new Date(d).getTime()) / 86400000));

  return (
    <>
      <MPageHeader title="应付账款" subtitle={`${filtered.length} 供应商`} />
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <MKpi label="合同总额" value={fmtMoneyShort(totals.contract)} accent="cobalt" />
        <MKpi label="已付款" value={fmtMoneyShort(totals.paid)} accent="mint" />
        <MKpi label="未付" value={fmtMoneyShort(totals.outstanding)} accent="tomato" />
      </div>
      <MChipFilter value={biz} onChange={(v) => setBiz(v as any)} options={[{ value: "all", label: "全部" }, { value: "software", label: "软件" }, { value: "hardware", label: "硬件" }] as any} />
      <MChipFilter value={filter} onChange={setFilter as any} options={[{ value: "outstanding", label: "仅看未付" }, { value: "all", label: "全部" }, { value: "settled", label: "已结清" }]} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索供应商" />

      <MList empty={filtered.length === 0}>
        {filtered.map(r => {
          const v = view(r); const days = aging(r.oldest);
          const ageTone = days > 90 ? "tomato" : days > 30 ? "mustard" : "muted";
          return (
            <MCard key={r.supplierId}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[14px] truncate">{r.supplierName}</span>
                    {r.category && <MTag variant="cobalt">{categoryStore.labelOf(r.category)}</MTag>}
                    <MTag variant={ageTone as any}>账龄 {days}d</MTag>
                  </div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{r.orderCount} 单 · 最早 {r.oldest}</div>
                  <div className="text-[12px] mt-1.5 font-mono">合同 <span className="font-bold">{fmtMoney(v.contract)}</span> · 已付 <span className="text-mint font-bold">{fmtMoney(v.paid)}</span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-foreground/45 font-mono uppercase">未付</div>
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
