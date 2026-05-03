// 账款核对（移动端）— 1:1 复刻 PC Reconciliation
import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MKpi, MChipFilter, MSheet, MField, MInput,
  MTextarea, MSelect, MButton, MAccordion, MFilterBar, MDateRange,
} from "../components/MUI";
import { inRange } from "@/components/common/DateRangeFilter";
import { salesApi, purchaseApi } from "@/services/api";
import { createPaymentAndSync } from "@/services/payments";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import type { SalesOrder, PurchaseOrder } from "@/types";

type Dir = "in" | "out";
interface Row { id: string; code: string; partyId: string; partyName: string; contract: number; paid: number; outstanding: number; createdAt: string; status: string; dir: Dir; refType: "sales" | "purchase"; }

const statusZh: Record<string, string> = { pending: "待发货", shipped: "已发货", delivered: "已送达", cancelled: "已取消", draft: "草稿", ordered: "已下单", received: "已入库" };
const today = () => new Date().toISOString().slice(0, 10);

export default function MReconciliation() {
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [tab, setTab] = useState<Dir>("in");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"outstanding" | "all">("outstanding");
  const [range, setRange] = useState({ from: "", to: "" });
  const [pay, setPay] = useState<Row | null>(null);
  const [payForm, setPayForm] = useState({ amount: 0, method: "对公转账", paidAt: today(), remark: "" });

  const reload = () => { salesApi.all().then(setSales); purchaseApi.all().then(setPurs); };
  useEffect(reload, []);

  const inRows: Row[] = useMemo(() => sales.filter(o => o.status !== "cancelled").map(o => {
    const c = o.contractAmount ?? o.totalAmount;
    return { id: o.id, code: o.code, partyId: o.customerId, partyName: o.customerName, contract: c, paid: o.received || 0, outstanding: c - (o.received || 0), createdAt: o.createdAt, status: o.status, dir: "in" as const, refType: "sales" as const };
  }), [sales]);
  const outRows: Row[] = useMemo(() => purs.filter(o => o.status !== "cancelled" && o.status !== "draft").map(o => {
    const c = o.contractAmount || o.totalAmount;
    return { id: o.id, code: o.code, partyId: o.supplierId, partyName: o.supplierName, contract: c, paid: o.paid || 0, outstanding: c - (o.paid || 0), createdAt: o.createdAt, status: o.status, dir: "out" as const, refType: "purchase" as const };
  }), [purs]);

  const rng = { from: range.from || undefined, to: range.to || undefined };
  const all = (tab === "in" ? inRows : outRows).filter(r => inRange(r.createdAt, rng));
  const filtered = all.filter(r => {
    if (filter === "outstanding" && r.outstanding <= 0) return false;
    if (keyword) { const k = keyword.toLowerCase(); if (!r.partyName.toLowerCase().includes(k) && !r.code.toLowerCase().includes(k)) return false; }
    return true;
  }).sort((a, b) => b.outstanding - a.outstanding);

  const totals = all.reduce((s, r) => ({ contract: s.contract + r.contract, paid: s.paid + r.paid, outstanding: s.outstanding + Math.max(r.outstanding, 0), settled: s.settled + (r.outstanding <= 0 ? 1 : 0) }), { contract: 0, paid: 0, outstanding: 0, settled: 0 });

  const groups = useMemo(() => {
    const m = new Map<string, { partyName: string; rows: Row[]; outstanding: number }>();
    filtered.forEach(r => { const g = m.get(r.partyId) || { partyName: r.partyName, rows: [], outstanding: 0 }; g.rows.push(r); g.outstanding += r.outstanding; m.set(r.partyId, g); });
    return Array.from(m.entries()).map(([id, g]) => ({ id, ...g })).sort((a, b) => b.outstanding - a.outstanding);
  }, [filtered]);

  const today2 = new Date();
  const aging = (d: string) => Math.max(0, Math.floor((today2.getTime() - new Date(d).getTime()) / 86400000));

  const openPay = (r: Row) => { setPay(r); setPayForm({ amount: r.outstanding, method: "对公转账", paidAt: today(), remark: "" }); };
  const submitPay = async () => {
    if (!pay) return;
    if (!payForm.amount || payForm.amount <= 0) return toast.error("金额需大于 0");
    await createPaymentAndSync({
      direction: pay.dir, refType: pay.refType, refId: pay.id, refCode: pay.code,
      partyName: pay.partyName, amount: Number(payForm.amount), method: payForm.method,
      paidAt: payForm.paidAt, remark: payForm.remark,
      code: `${pay.dir === "in" ? "RC" : "PY"}-${Date.now().toString().slice(-6)}`,
    } as any);
    toast.success("已记账"); setPay(null); reload();
  };

  return (
    <>
      <MPageHeader title="账款核对" subtitle={`${groups.length} 家 · ${filtered.length} 单`} />
      <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-2 bg-background">
        <button onClick={() => setTab("in")} className={`h-11 rounded-2xl text-sm font-bold inline-flex items-center justify-center gap-1.5 ${tab === "in" ? "bg-tomato text-[hsl(var(--paper))] shadow-sm" : "bg-card border border-foreground/10 text-foreground/65"}`}>
          <ArrowDownLeft className="h-4 w-4" />应收（销售回款）
        </button>
        <button onClick={() => setTab("out")} className={`h-11 rounded-2xl text-sm font-bold inline-flex items-center justify-center gap-1.5 ${tab === "out" ? "bg-cobalt text-[hsl(var(--paper))] shadow-sm" : "bg-card border border-foreground/10 text-foreground/65"}`}>
          <ArrowUpRight className="h-4 w-4" />应付（采购付款）
        </button>
      </div>
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <MKpi label={tab === "in" ? "合同总额" : "采购总额"} value={fmtMoneyShort(totals.contract)} accent="cobalt" />
        <MKpi label={tab === "in" ? "已回款" : "已付款"} value={fmtMoneyShort(totals.paid)} accent="mint" />
        <MKpi label={tab === "in" ? "未收账款" : "未付账款"} value={fmtMoneyShort(totals.outstanding)} accent="tomato" />
        <MKpi label="已结清" value={`${totals.settled} 笔`} accent="mint" />
      </div>
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索对手方/单号" />
      <MChipFilter value={filter} onChange={setFilter as any} options={[{ value: "outstanding", label: "仅未结清" }, { value: "all", label: "全部" }]} />
      <MDateRange value={range} onChange={setRange} />
      <div className="px-4 pb-4 space-y-2">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-mint" />
            <div className="text-sm text-foreground/45">没有需要核对的账款</div>
          </div>
        ) : groups.map(g => (
          <MAccordion key={g.id} title={<span className="flex items-center gap-2"><span className="font-bold">{g.partyName}</span><MTag variant="muted">{g.rows.length} 单</MTag></span>}
            badge={<span className={`font-mono font-black text-[13px] ml-auto ${g.outstanding > 0 ? "text-tomato" : "text-foreground/40"}`}>{fmtMoney(g.outstanding)}</span>}>
            <div className="space-y-1.5">
              {g.rows.map(r => {
                const days = aging(r.createdAt); const settled = r.outstanding <= 0;
                return (
                  <div key={r.id} className="p-2.5 rounded-lg bg-foreground/[0.03]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-bold">{r.code}</span>
                          <MTag variant="muted">{statusZh[r.status] || r.status}</MTag>
                        </div>
                        <div className="text-[11px] text-foreground/55 mt-1 font-mono">合同 {fmtMoneyShort(r.contract)} · 已{tab === "in" ? "回" : "付"} {fmtMoneyShort(r.paid)}</div>
                        <div className="text-[10px] text-foreground/45 mt-0.5 font-mono">{r.createdAt} · {days}天</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`font-mono font-bold text-[13px] ${settled ? "text-foreground/40" : "text-tomato"}`}>{fmtMoneyShort(r.outstanding)}</div>
                        {settled ? <div className="text-[10px] text-mint mt-1">已结清</div> :
                          <button onClick={() => openPay(r)} className="mt-1 px-2.5 h-7 rounded-full bg-foreground text-[hsl(var(--paper))] text-[10px] font-semibold">登记{tab === "in" ? "回款" : "付款"}</button>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </MAccordion>
        ))}
      </div>

      <MSheet open={!!pay} onOpenChange={v => !v && setPay(null)} title={`登记${pay?.dir === "in" ? "回款" : "付款"}`}
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setPay(null)} className="flex-1">取消</MButton><MButton onClick={submitPay} className="flex-1">记录</MButton></div>}>
        {pay && (
          <>
            <div className="rounded-xl bg-foreground/[0.04] p-3 mb-3">
              <div className="font-bold text-[14px]">{pay.partyName}</div>
              <div className="text-[11px] text-foreground/55 font-mono mt-0.5">{pay.code}</div>
              <div className="text-[12px] mt-1.5 font-mono">合同 {fmtMoney(pay.contract)} · 余额 <span className="text-tomato font-bold">{fmtMoney(pay.outstanding)}</span></div>
            </div>
            <MField label="金额" required><MInput type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></MField>
            <MField label="方式">
              <MSelect value={payForm.method} onChange={v => setPayForm({ ...payForm, method: v })}
                options={["对公转账", "现金", "支票", "支付宝", "微信"].map(m => ({ value: m, label: m }))} />
            </MField>
            <MField label="日期"><MInput type="date" value={payForm.paidAt} onChange={e => setPayForm({ ...payForm, paidAt: e.target.value })} /></MField>
            <MField label="备注"><MTextarea value={payForm.remark} onChange={e => setPayForm({ ...payForm, remark: e.target.value })} /></MField>
          </>
        )}
      </MSheet>
    </>
  );
}
