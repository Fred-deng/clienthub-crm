import { useState, useEffect } from "react";
import { paymentApi, salesApi, purchaseApi, productApi } from "@/services/api";
import { useInfiniteList } from "../hooks/useInfiniteList";
import { useToast } from "@/hooks/use-toast";
import type { Payment, SalesOrder, PurchaseOrder, Product } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine, Download } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import { splitPayment, pickByFilter, matchFilter, bizLabel, bizTone, type BizFilter } from "@/lib/biz";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MConfirm, MRow, MDateRange, MBizTabs, MIconBtn, MLoadMore } from "../components/MUI";

const DIR_OPTS = [{ value: "all", label: "全部" }, { value: "in", label: "回款" }, { value: "out", label: "付款" }];
const METHODS = ["对公转账", "现金", "支票", "支付宝", "微信"] as const;

export default function MPayments() {
  const { toast } = useToast();
  const { items, total, loading, hasMore, setFilter, loadMore, reload } = useInfiniteList<Payment>(paymentApi.list, { pageSize: 15 });
  const [keyword, setKeyword] = useState(""); const [dir, setDir] = useState("all");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [date, setDate] = useState({ from: "", to: "" });
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Payment> | null>(null);
  const [view, setView] = useState<Payment | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  useEffect(() => { salesApi.all().then(setSales); purchaseApi.all().then(setPurs); productApi.all().then(setProducts); }, []);

  const openCreate = () => { setEditing({ direction: "in", refType: "sales", refId: "", refCode: "", partyName: "", amount: 0, method: "对公转账", paidAt: new Date().toISOString().slice(0, 10), code: "" }); setEditOpen(true); };
  const save = async () => {
    if (!editing?.refId || !editing.amount) return toast({ title: "请选择关联单据并填写金额" });
    if (editing.id) await paymentApi.update(editing.id, editing);
    else await paymentApi.create({ ...editing, code: `PAY-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await paymentApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };
  const applyDate = (v: { from: string; to: string }) => { setDate(v); setFilter({ dateFrom: v.from, dateTo: v.to }); };

  const doExport = async () => {
    const all = await paymentApi.all();
    exportCsv("payments", all, [
      { header: "流水号", value: (p) => p.code }, { header: "方向", value: (p) => p.direction === "in" ? "回款" : "付款" },
      { header: "关联单据", value: (p) => p.refCode }, { header: "对手方", value: (p) => p.partyName },
      { header: "金额", value: (p) => p.amount }, { header: "方式", value: (p) => p.method },
      { header: "日期", value: (p) => p.paidAt }, { header: "备注", value: (p) => p.remark || "" },
    ]);
    toast({ title: "已导出 CSV" });
  };

  const refOptions = editing?.refType === "sales"
    ? sales.map(s => ({ value: s.id, label: `${s.code} · ${s.customerName}`, party: s.customerName, code: s.code }))
    : purs.map(p => ({ value: p.id, label: `${p.code} · ${p.supplierName}`, party: p.supplierName, code: p.code }));

  const enriched = items.map((p) => ({ p, split: splitPayment(p, { sales, purchases: purs }, products) })).filter(({ split }) => matchFilter(split, biz));

  return (
    <div>
      <MPageHeader title="账务收支" subtitle={`共 ${total} 笔`} action={<MIconBtn icon={Download} onClick={doExport} title="导出" />} />
      <MBizTabs value={biz} onChange={setBiz} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="单号 / 客户 / 供应商" />
      <MChipFilter value={dir} onChange={(v) => { setDir(v); setFilter({ direction: v }); }} options={DIR_OPTS} />
      <MDateRange value={date} onChange={applyDate} />

      <MList loading={loading && !enriched.length} empty={!loading && !enriched.length}>
        {enriched.map(({ p, split }) => {
          const isIn = p.direction === "in";
          const amt = pickByFilter(split, biz);
          return (
            <MCard key={p.id} onClick={() => setView(p)}>
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${isIn ? "bg-mint/20 text-foreground" : "bg-tomato/12 text-tomato"}`}>
                  {isIn ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-semibold text-sm truncate flex-1">{p.partyName}</div>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${bizTone[split.category]}`}>{bizLabel[split.category]}</span>
                  </div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{p.code} · {p.refCode}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MTag variant="muted">{p.method}</MTag>
                    <span className="text-[11px] text-foreground/55">{p.paidAt}</span>
                  </div>
                </div>
                <div className={`font-mono font-bold tabular-nums text-sm ${isIn ? "text-mint" : "text-tomato"}`}>{isIn ? "+" : "-"}¥{amt.toLocaleString()}</div>
              </div>
            </MCard>
          );
        })}
        {items.length > 0 && <MLoadMore hasMore={hasMore} loading={loading} onLoad={loadMore} />}
      </MList>

      <MFab onClick={openCreate} label="登记" />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title="收支详情"
        footer={view && (<div className="flex gap-2"><MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton><MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton></div>)}
      >
        {view && <div>
          <MRow label="单号" value={view.code} mono />
          <MRow label="方向" value={view.direction === "in" ? "回款" : "付款"} />
          <MRow label="关联单据" value={view.refCode} mono />
          <MRow label="对手方" value={view.partyName} />
          <MRow label="金额" value={`¥${view.amount.toLocaleString()}`} mono />
          <MRow label="方式" value={view.method} />
          <MRow label="日期" value={view.paidAt} />
          <MRow label="备注" value={view.remark} />
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑收支" : "登记收支"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="方向" required><MSelect value={editing.direction ?? "in"} onChange={(v) => setEditing({ ...editing, direction: v as any, refType: v === "in" ? "sales" : "purchase", refId: "", refCode: "", partyName: "" })} options={[{ value: "in", label: "回款 (客户付我们)" }, { value: "out", label: "付款 (我们付供应商)" }]} /></MField>
          <MField label="关联单据" required>
            <MSelect value={editing.refId ?? ""} onChange={(v) => { const r = refOptions.find(o => o.value === v); setEditing({ ...editing, refId: v, refCode: r?.code ?? "", partyName: r?.party ?? "" }); }}
              options={[{ value: "", label: "请选择" }, ...refOptions.map(o => ({ value: o.value, label: o.label }))]} />
          </MField>
          <MField label="金额" required><MInput type="number" value={editing.amount ?? 0} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></MField>
          <MField label="方式"><MSelect value={editing.method ?? "对公转账"} onChange={(v) => setEditing({ ...editing, method: v as any })} options={METHODS.map(m => ({ value: m, label: m }))} /></MField>
          <MField label="日期"><MInput type="date" value={editing.paidAt ?? ""} onChange={(e) => setEditing({ ...editing, paidAt: e.target.value })} /></MField>
          <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除该收支记录？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
