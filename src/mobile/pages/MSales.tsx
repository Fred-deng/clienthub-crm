import { useState, useEffect } from "react";
import { salesApi, customerApi, productApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import type { SalesOrder, Customer, Product, SalesStatus } from "@/types";
import { Trash2, Plus } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MConfirm, MRow, MDateRange } from "../components/MUI";

const STATUS_OPTS = [
  { value: "all", label: "全部" }, { value: "pending", label: "待发货" }, { value: "shipped", label: "已发货" }, { value: "delivered", label: "已交付" }, { value: "cancelled", label: "已取消" },
];
const STATUS_LABEL: Record<string, string> = { pending: "待发货", shipped: "已发货", delivered: "已交付", cancelled: "已取消" };
const STATUS_VARIANT: Record<string, "mustard" | "cobalt" | "mint" | "muted"> = { pending: "mustard", shipped: "cobalt", delivered: "mint", cancelled: "muted" };

export default function MSales() {
  const { current } = useCurrentUser();
  const { toast } = useToast();
  const { data, loading, setFilter, reload } = usePagedList<SalesOrder>(salesApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState(""); const [status, setStatus] = useState("all");
  const [date, setDate] = useState({ from: "", to: "" });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<SalesOrder> | null>(null);
  const [view, setView] = useState<SalesOrder | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  useEffect(() => { customerApi.all().then(setCustomers); productApi.all().then(setProducts); }, []);

  const openCreate = () => { setEditing({ status: "pending", items: [], totalAmount: 0, received: 0, ownerId: current.id, createdAt: new Date().toISOString().slice(0, 10), code: "" }); setEditOpen(true); };
  const recalc = (items: any[]) => items.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
  const updateItem = (i: number, patch: any) => {
    const items = [...(editing?.items ?? [])]; items[i] = { ...items[i], ...patch };
    setEditing({ ...editing!, items, totalAmount: recalc(items) });
  };
  const addItem = () => { const p = products[0]; if (!p) return; const items = [...(editing?.items ?? []), { productId: p.id, productName: p.name, category: p.category, qty: 1, price: p.price }]; setEditing({ ...editing!, items, totalAmount: recalc(items) }); };
  const removeItem = (i: number) => { const items = [...(editing?.items ?? [])]; items.splice(i, 1); setEditing({ ...editing!, items, totalAmount: recalc(items) }); };

  const save = async () => {
    if (!editing?.customerId) return toast({ title: "请选择客户" });
    if (!editing.items?.length) return toast({ title: "至少添加一项" });
    const cus = customers.find(c => c.id === editing.customerId);
    const payload = { ...editing, customerName: cus?.name ?? "" };
    if (editing.id) await salesApi.update(editing.id, payload);
    else await salesApi.create({ ...payload, code: `SO-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await salesApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };
  const applyDate = (v: { from: string; to: string }) => { setDate(v); setFilter({ dateFrom: v.from, dateTo: v.to }); };

  return (
    <div>
      <MPageHeader title="销售订单" subtitle={`共 ${data.total} 单`} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="订单号 / 客户" />
      <MChipFilter value={status} onChange={(v) => { setStatus(v); setFilter({ status: v }); }} options={STATUS_OPTS} />
      <MDateRange value={date} onChange={applyDate} />

      <MList loading={loading && !data.list.length} empty={!loading && !data.list.length}>
        {data.list.map((o) => {
          const amt = o.contractAmount ?? o.totalAmount;
          const out = Math.max(amt - o.received, 0);
          return (
            <MCard key={o.id} onClick={() => setView(o)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{o.customerName}</div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{o.code} · {o.createdAt}</div>
                </div>
                <MTag variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</MTag>
              </div>
              <div className="flex justify-between items-end mt-2.5">
                <span className="text-[11px] text-foreground/55">{o.items.length} 项 · 未收 ¥{out.toLocaleString()}</span>
                <span className="font-mono font-bold tabular-nums">¥{amt.toLocaleString()}</span>
              </div>
            </MCard>
          );
        })}
      </MList>

      <MFab onClick={openCreate} />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title="销售订单详情"
        footer={view && (<div className="flex gap-2"><MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton><MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton></div>)}
      >
        {view && <div>
          <MRow label="订单号" value={view.code} mono />
          <MRow label="客户" value={view.customerName} />
          <MRow label="状态" value={<MTag variant={STATUS_VARIANT[view.status]}>{STATUS_LABEL[view.status]}</MTag>} />
          <MRow label="下单日" value={view.createdAt} />
          <MRow label="交付日" value={view.deliveredAt} />
          <MRow label="合同金额" value={view.contractAmount ? `¥${view.contractAmount.toLocaleString()}` : "—"} mono />
          <MRow label="明细金额" value={`¥${view.totalAmount.toLocaleString()}`} mono />
          <MRow label="已收款" value={`¥${view.received.toLocaleString()}`} mono />
          <MRow label="未收款" value={`¥${Math.max((view.contractAmount ?? view.totalAmount) - view.received, 0).toLocaleString()}`} mono />
          <div className="mt-3 text-[11px] font-mono uppercase tracking-wider text-foreground/45 mb-2">明细</div>
          {view.items.map((it, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-foreground/5 text-[12px]">
              <div className="flex-1 min-w-0 truncate">{it.productName}</div>
              <div className="font-mono tabular-nums">{it.qty} × ¥{it.price.toLocaleString()}</div>
            </div>
          ))}
          <MRow label="备注" value={view.remark} />
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑销售单" : "新建销售单"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="客户" required><MSelect value={editing.customerId ?? ""} onChange={(v) => setEditing({ ...editing, customerId: v })} options={[{ value: "", label: "请选择" }, ...customers.map(c => ({ value: c.id, label: c.name }))]} /></MField>
          <MField label="状态"><MSelect value={editing.status ?? "pending"} onChange={(v) => setEditing({ ...editing, status: v as SalesStatus })} options={STATUS_OPTS.filter(s => s.value !== "all")} /></MField>
          <MField label="下单日"><MInput type="date" value={editing.createdAt ?? ""} onChange={(e) => setEditing({ ...editing, createdAt: e.target.value })} /></MField>
          <MField label="合同金额"><MInput type="number" value={editing.contractAmount ?? ""} onChange={(e) => setEditing({ ...editing, contractAmount: Number(e.target.value) })} /></MField>
          <MField label="已收款"><MInput type="number" value={editing.received ?? 0} onChange={(e) => setEditing({ ...editing, received: Number(e.target.value) })} /></MField>

          <div className="mt-2 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground/65">明细 ({(editing.items ?? []).length})</span>
            <MButton variant="ghost" onClick={addItem} className="!h-8 !px-3 text-xs"><Plus className="h-3 w-3" />添加</MButton>
          </div>
          {(editing.items ?? []).map((it, i) => (
            <div key={i} className="bg-foreground/[0.04] rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <select value={it.productId} onChange={(e) => { const p = products.find(pp => pp.id === e.target.value); updateItem(i, { productId: e.target.value, productName: p?.name, category: p?.category }); }} className="flex-1 h-9 px-2 rounded-lg bg-card border border-foreground/10 text-sm">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={() => removeItem(i)} className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-sm" placeholder="数量" />
                <input type="number" value={it.price} onChange={(e) => updateItem(i, { price: Number(e.target.value) })} className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-sm" placeholder="单价" />
              </div>
            </div>
          ))}
          <div className="text-right text-sm font-bold mt-2">合计：¥{(editing.totalAmount ?? 0).toLocaleString()}</div>
          <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除销售单？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
