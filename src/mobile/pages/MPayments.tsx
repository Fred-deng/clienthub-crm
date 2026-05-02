import { useState, useEffect } from "react";
import { paymentApi, salesApi, purchaseApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import type { Payment, SalesOrder, PurchaseOrder } from "@/types";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MConfirm, MRow, MDateRange } from "../components/MUI";

const DIR_OPTS = [{ value: "all", label: "全部" }, { value: "in", label: "回款" }, { value: "out", label: "付款" }];
const METHODS = ["对公转账", "现金", "支票", "支付宝", "微信"] as const;

export default function MPayments() {
  const { toast } = useToast();
  const { data, loading, setFilter, reload } = usePagedList<Payment>(paymentApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState(""); const [dir, setDir] = useState("all");
  const [date, setDate] = useState({ from: "", to: "" });
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Payment> | null>(null);
  const [view, setView] = useState<Payment | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  useEffect(() => { salesApi.all().then(setSales); purchaseApi.all().then(setPurs); }, []);

  const openCreate = () => { setEditing({ direction: "in", refType: "sales", refId: "", refCode: "", partyName: "", amount: 0, method: "对公转账", paidAt: new Date().toISOString().slice(0, 10), code: "" }); setEditOpen(true); };
  const save = async () => {
    if (!editing?.refId || !editing.amount) return toast({ title: "请选择关联单据并填写金额" });
    if (editing.id) await paymentApi.update(editing.id, editing);
    else await paymentApi.create({ ...editing, code: `PAY-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await paymentApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };
  const applyDate = (v: { from: string; to: string }) => { setDate(v); setFilter({ dateFrom: v.from, dateTo: v.to }); };

  const refOptions = editing?.refType === "sales"
    ? sales.map(s => ({ value: s.id, label: `${s.code} · ${s.customerName}`, party: s.customerName, code: s.code }))
    : purs.map(p => ({ value: p.id, label: `${p.code} · ${p.supplierName}`, party: p.supplierName, code: p.code }));

  return (
    <div>
      <MPageHeader title="账务收支" subtitle={`共 ${data.total} 笔`} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="单号 / 客户 / 供应商" />
      <MChipFilter value={dir} onChange={(v) => { setDir(v); setFilter({ direction: v }); }} options={DIR_OPTS} />
      <MDateRange value={date} onChange={applyDate} />

      <MList loading={loading && !data.list.length} empty={!loading && !data.list.length}>
        {data.list.map((p) => {
          const isIn = p.direction === "in";
          return (
            <MCard key={p.id} onClick={() => setView(p)}>
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${isIn ? "bg-mint/20 text-foreground" : "bg-tomato/12 text-tomato"}`}>
                  {isIn ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.partyName}</div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{p.code} · {p.refCode}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <MTag variant="muted">{p.method}</MTag>
                    <span className="text-[11px] text-foreground/55">{p.paidAt}</span>
                  </div>
                </div>
                <div className={`font-mono font-bold tabular-nums text-sm ${isIn ? "text-mint" : "text-tomato"}`}>{isIn ? "+" : "-"}¥{p.amount.toLocaleString()}</div>
              </div>
            </MCard>
          );
        })}
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
