// 财务收支（移动端）— 1:1 复刻 PC Payments
import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MButton, MConfirm, MGroupTitle, MChipFilter, MKpi, MFilterBar, MDateRange,
} from "../components/MUI";
import { paymentApi, salesApi, purchaseApi, productApi } from "@/services/api";
import { createPaymentAndSync, removePaymentAndSync } from "@/services/payments";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { exportCsv } from "@/lib/csv";
import { splitPayment, pickByFilter, matchFilter, bizLabel, type BizFilter } from "@/lib/biz";
import type { Payment, SalesOrder, PurchaseOrder, Product } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);

export default function MPayments() {
  const [list, setList] = useState<Payment[]>([]);
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [dirF, setDirF] = useState<"all" | "in" | "out">("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [form, setForm] = useState({ direction: "in" as "in" | "out", refId: "", amount: 0, method: "对公转账", paidAt: today(), remark: "" });

  const reload = async () => setList(await paymentApi.all());
  useEffect(() => { reload(); salesApi.all().then(setSales); purchaseApi.all().then(setPurs); productApi.all().then(setProducts); }, []);

  const enriched = useMemo(() => {
    return list.map(p => ({ p, split: splitPayment(p, { sales, purchases: purs }, products) }))
      .filter(({ p, split }) => {
        if (dirF !== "all" && p.direction !== dirF) return false;
        if (range.from && p.paidAt < range.from) return false;
        if (range.to && p.paidAt > range.to) return false;
        if (!matchFilter(split, biz)) return false;
        if (keyword) {
          const k = keyword.toLowerCase();
          if (!p.code.toLowerCase().includes(k) && !p.refCode.toLowerCase().includes(k) && !p.partyName.toLowerCase().includes(k)) return false;
        }
        return true;
      });
  }, [list, sales, purs, products, biz, dirF, range, keyword]);

  const totals = enriched.reduce((acc, { p, split }) => {
    const amt = pickByFilter(split, biz);
    if (p.direction === "in") acc.in += amt; else acc.out += amt;
    return acc;
  }, { in: 0, out: 0 });

  const submit = async () => {
    const ref: any = (form.direction === "in" ? sales : purs).find(x => x.id === form.refId);
    if (!ref) return toast.error("请选择关联单据");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("金额必须大于 0");
    const total = (ref.contractAmount ?? ref.totalAmount) || 0;
    const paidNow = form.direction === "in" ? (ref.received || 0) : (ref.paid || 0);
    const remain = Math.max(total - paidNow, 0);
    if (amount > remain + 0.001) {
      if (!window.confirm(`本次 ${fmtMoney(amount)} 超过余额 ${fmtMoney(remain)}，将出现负余额，是否继续？`)) return;
    }
    await createPaymentAndSync({
      ...form, refType: form.direction === "in" ? "sales" : "purchase",
      refCode: ref.code, partyName: ref.customerName ?? ref.supplierName,
      amount, code: `${form.direction === "in" ? "RC" : "PY"}-${Date.now().toString().slice(-6)}`,
    } as any);
    toast.success("已记账"); setOpen(false); reload();
  };

  const onDelete = async () => { if (!delId) return; await removePaymentAndSync(delId); toast.success("已删除"); setDelId(null); reload(); };

  const exportAll = async () => {
    const all = await paymentApi.all();
    exportCsv("payments", all, [
      { header: "流水号", value: p => p.code }, { header: "方向", value: p => p.direction === "in" ? "回款" : "付款" },
      { header: "关联单据", value: p => p.refCode }, { header: "对手方", value: p => p.partyName },
      { header: "金额", value: p => p.amount }, { header: "方式", value: p => p.method }, { header: "日期", value: p => p.paidAt },
    ]);
  };

  const refList = form.direction === "in" ? sales : purs;

  return (
    <>
      <MPageHeader title="财务收支" subtitle={`${enriched.length} 笔 · 净 ${fmtMoneyShort(totals.in - totals.out)}`}
        action={<button onClick={exportAll} className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center"><Download className="h-4 w-4" /></button>} />
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <MKpi label="回款" value={fmtMoneyShort(totals.in)} accent="mint" />
        <MKpi label="付款" value={fmtMoneyShort(totals.out)} accent="tomato" />
        <MKpi label="净流水" value={fmtMoneyShort(totals.in - totals.out)} accent="cobalt" />
      </div>
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索单号/对手方" />
      <MChipFilter value={biz} onChange={(v) => setBiz(v as any)}
        options={[{ value: "all", label: "全部业务" }, { value: "software", label: "软件" }, { value: "hardware", label: "硬件" }] as any} />
      <MFilterBar onReset={() => { setDirF("all"); setRange({ from: "", to: "" }); }}>
        <select value={dirF} onChange={e => setDirF(e.target.value as any)} className="shrink-0 h-8 px-3 rounded-full bg-card border border-foreground/10 text-xs">
          <option value="all">全部方向</option><option value="in">回款</option><option value="out">付款</option>
        </select>
      </MFilterBar>
      <MDateRange value={range} onChange={setRange} />

      <MList empty={enriched.length === 0}>
        {enriched.map(({ p, split }) => {
          const amt = pickByFilter(split, biz);
          const inDir = p.direction === "in";
          return (
            <MCard key={p.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${inDir ? "text-mint" : "text-tomato"}`}>
                      {inDir ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {inDir ? "回款" : "付款"}
                    </span>
                    <MTag variant={split.category === "software" ? "cobalt" : split.category === "hardware" ? "mint" : "mustard"}>{bizLabel[split.category]}</MTag>
                    <span className="font-mono text-[11px] text-foreground/55">{p.code}</span>
                  </div>
                  <div className="text-[12px] text-foreground/75 mt-1 truncate">{p.partyName}</div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{p.refCode} · {p.method} · {p.paidAt}</div>
                  {p.remark && <div className="text-[11px] text-foreground/55 mt-1">{p.remark}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-display font-black tabular-nums ${inDir ? "text-mint" : "text-tomato"}`}>{inDir ? "+" : "-"}{fmtMoney(amt)}</div>
                  <button onClick={e => { e.stopPropagation(); setDelId(p.id); }} className="mt-1 size-7 rounded-full bg-destructive/10 text-destructive inline-flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>

      <MFab onClick={() => { setForm({ direction: "in", refId: "", amount: 0, method: "对公转账", paidAt: today(), remark: "" }); setOpen(true); }} />

      <MSheet open={open} onOpenChange={setOpen} title="新增收支记录"
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton><MButton onClick={submit} className="flex-1">记录</MButton></div>}>
        <MGroupTitle>类型</MGroupTitle>
        <MField label="方向" required>
          <MSelect value={form.direction} onChange={v => setForm({ ...form, direction: v as any, refId: "" })}
            options={[{ value: "in", label: "客户回款" }, { value: "out", label: "供应商付款" }]} />
        </MField>
        <MField label={form.direction === "in" ? "关联销售订单" : "关联采购单"} required>
          <MSelect value={form.refId} onChange={v => setForm({ ...form, refId: v })}
            options={refList.map((o: any) => ({ value: o.id, label: `${o.code} · ${o.customerName ?? o.supplierName}` }))} placeholder="选择" />
        </MField>
        <MField label="金额" required><MInput type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></MField>
        <MField label="方式">
          <MSelect value={form.method} onChange={v => setForm({ ...form, method: v })}
            options={["对公转账", "现金", "支票", "支付宝", "微信"].map(m => ({ value: m, label: m }))} />
        </MField>
        <MField label="日期"><MInput type="date" value={form.paidAt} onChange={e => setForm({ ...form, paidAt: e.target.value })} /></MField>
        <MField label="备注"><MTextarea value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} /></MField>
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除流水" onConfirm={onDelete} danger confirmText="删除" />
    </>
  );
}
