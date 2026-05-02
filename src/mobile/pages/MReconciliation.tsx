import { useEffect, useMemo, useState } from "react";
import { salesApi, purchaseApi, paymentApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { SalesOrder, PurchaseOrder } from "@/types";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MKpi, MChipFilter, MDateRange, MSheet, MField, MInput, MTextarea, MSelect, MButton } from "../components/MUI";

type Dir = "in" | "out";
const inRange = (d: string, f: string, t: string) => (!f || d >= f) && (!t || d <= t);

export default function MReconciliation() {
  const { toast } = useToast();
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [tab, setTab] = useState<Dir>("in");
  const [filter, setFilter] = useState<"outstanding" | "all">("outstanding");
  const [keyword, setKeyword] = useState("");
  const [date, setDate] = useState({ from: "", to: "" });
  const [pay, setPay] = useState<{ open: boolean; row: any | null; amount: number; method: string; paidAt: string; remark: string }>({ open: false, row: null, amount: 0, method: "对公转账", paidAt: new Date().toISOString().slice(0, 10), remark: "" });

  const reload = () => { salesApi.all().then(setSales); purchaseApi.all().then(setPurs); };
  useEffect(() => { reload(); }, []);

  const rows = useMemo(() => {
    const list = tab === "in"
      ? sales.filter(o => o.status !== "cancelled").map(o => { const c = o.contractAmount ?? o.totalAmount; return { id: o.id, code: o.code, partyId: o.customerId, partyName: o.customerName, contract: c, paid: o.received, outstanding: c - o.received, createdAt: o.createdAt, status: o.status, refType: "sales" as const }; })
      : purs.filter(o => o.status !== "cancelled" && o.status !== "draft").map(o => { const c = o.contractAmount || o.totalAmount; return { id: o.id, code: o.code, partyId: o.supplierId, partyName: o.supplierName, contract: c, paid: o.paid, outstanding: c - o.paid, createdAt: o.createdAt, status: o.status, refType: "purchase" as const }; });
    const k = keyword.toLowerCase();
    return list.filter(r => {
      if (!inRange(r.createdAt, date.from, date.to)) return false;
      if (filter === "outstanding" && r.outstanding <= 0) return false;
      if (k && !r.partyName.toLowerCase().includes(k) && !r.code.toLowerCase().includes(k)) return false;
      return true;
    }).sort((a, b) => b.outstanding - a.outstanding);
  }, [tab, sales, purs, keyword, filter, date]);

  const totals = rows.reduce((acc, r) => ({ contract: acc.contract + r.contract, paid: acc.paid + r.paid, outstanding: acc.outstanding + r.outstanding }), { contract: 0, paid: 0, outstanding: 0 });

  const openPay = (r: any) => setPay({ open: true, row: r, amount: r.outstanding, method: "对公转账", paidAt: new Date().toISOString().slice(0, 10), remark: "" });

  const submitPay = async () => {
    if (!pay.row || !pay.amount) return toast({ title: "请填写金额" });
    const r = pay.row;
    await paymentApi.create({
      direction: tab, refType: r.refType, refId: r.id, refCode: r.code, partyName: r.partyName,
      amount: pay.amount, method: pay.method as any, paidAt: pay.paidAt, remark: pay.remark, code: `PAY-${Date.now().toString().slice(-6)}`,
    } as any);
    if (tab === "in") {
      const o = sales.find(s => s.id === r.id); if (o) await salesApi.update(o.id, { received: (o.received || 0) + pay.amount });
    } else {
      const o = purs.find(p => p.id === r.id); if (o) await purchaseApi.update(o.id, { paid: (o.paid || 0) + pay.amount });
    }
    toast({ title: "登记成功" });
    setPay({ ...pay, open: false });
    reload();
  };

  return (
    <div>
      <MPageHeader title="账款核对" subtitle={`${rows.length} 笔单据`} />
      <MChipFilter value={tab} onChange={(v) => setTab(v as Dir)} options={[{ value: "in", label: "应收（客户）" }, { value: "out", label: "应付（供应商）" }]} />
      <section className="px-4 py-2 grid grid-cols-3 gap-2">
        <MKpi label="合同" value={`¥${(totals.contract / 10000).toFixed(1)}万`} />
        <MKpi label={tab === "in" ? "已收" : "已付"} value={`¥${(totals.paid / 10000).toFixed(1)}万`} accent="mint" />
        <MKpi label="未结" value={`¥${(totals.outstanding / 10000).toFixed(1)}万`} accent="tomato" />
      </section>
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="单号 / 客户 / 供应商" />
      <MChipFilter value={filter} onChange={(v) => setFilter(v as any)} options={[{ value: "outstanding", label: "未结清" }, { value: "all", label: "全部" }]} />
      <MDateRange value={date} onChange={setDate} />

      <MList empty={!rows.length}>
        {rows.map(r => {
          const pct = r.contract ? (r.paid / r.contract) * 100 : 0;
          return (
            <MCard key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{r.partyName}</div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{r.code} · {r.createdAt}</div>
                </div>
                <MTag variant={r.outstanding > 0 ? "tomato" : "mint"}>{r.outstanding > 0 ? `欠 ¥${r.outstanding.toLocaleString()}` : "结清"}</MTag>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                <div className="h-full bg-mint" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2.5 text-[11px]">
                <span className="text-foreground/55">合同 ¥{r.contract.toLocaleString()} · {tab === "in" ? "已收" : "已付"} ¥{r.paid.toLocaleString()}</span>
                {r.outstanding > 0 && (
                  <button onClick={() => openPay(r)} className="px-3 h-7 rounded-full bg-tomato text-[hsl(var(--paper))] text-[11px] font-semibold">
                    {tab === "in" ? "登记回款" : "登记付款"}
                  </button>
                )}
              </div>
            </MCard>
          );
        })}
      </MList>

      <MSheet open={pay.open} onOpenChange={(o) => setPay({ ...pay, open: o })} title={tab === "in" ? "登记回款" : "登记付款"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setPay({ ...pay, open: false })}>取消</MButton><MButton className="flex-1" onClick={submitPay}>提交</MButton></div>}
      >
        {pay.row && <div>
          <div className="bg-foreground/[0.04] rounded-xl p-3 mb-3">
            <div className="text-[11px] text-foreground/55">{pay.row.code} · {pay.row.partyName}</div>
            <div className="flex justify-between mt-1 text-sm"><span>未结</span><span className="font-mono font-bold text-tomato">¥{pay.row.outstanding.toLocaleString()}</span></div>
          </div>
          <MField label="金额" required><MInput type="number" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></MField>
          <MField label="方式"><MSelect value={pay.method} onChange={(v) => setPay({ ...pay, method: v })} options={["对公转账", "现金", "支票", "支付宝", "微信"].map(m => ({ value: m, label: m }))} /></MField>
          <MField label="日期"><MInput type="date" value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} /></MField>
          <MField label="备注"><MTextarea value={pay.remark} onChange={(e) => setPay({ ...pay, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>
    </div>
  );
}
