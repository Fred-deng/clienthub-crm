// 产品与库存（移动端）— 1:1 复刻 PC Products
import { useEffect, useState } from "react";
import { Trash2, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput,
  MSelect, MButton, MConfirm, MGroupTitle, MChipFilter, MLogList, MAccordion,
} from "../components/MUI";
import { productApi, salesApi, purchaseApi } from "@/services/api";
import { adjustStock, logProductChange, stockLogApi } from "@/services/inventory";
import { fmtMoney } from "@/lib/format";
import { useCategories, categoryStore } from "@/services/categories";
import type { Product } from "@/types";

const empty: Omit<Product, "id"> = { code: "", name: "", category: "ipc", unit: "台", price: 0, cost: 0, stock: 0, safetyStock: 10, spec: "" };

export default function MProducts() {
  const cats = useCategories();
  const [list, setList] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [catF, setCatF] = useState<"all" | string>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);
  const [delId, setDelId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  const reload = async () => setList(await productApi.all());
  useEffect(() => { reload(); }, []);

  const filtered = list.filter(p => {
    if (catF !== "all" && p.category !== catF) return false;
    if (lowOnly && (p.category === "software" || p.stock > p.safetyStock)) return false;
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    return p.name.toLowerCase().includes(k) || p.code.toLowerCase().includes(k);
  });

  const openCreate = () => { setForm({ ...empty, code: `PRD-${Date.now().toString().slice(-6)}` }); setEditing(null); setLogs([]); setOpen(true); };
  const openEdit = async (p: Product) => {
    setForm(p); setEditing(p); setOpen(true);
    const r = await stockLogApi.list({ productId: p.id, pageSize: 30 });
    setLogs(r.list);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("请输入名称");
    if (editing) {
      const stockDiff = (Number(form.stock) || 0) - editing.stock;
      const updated = await productApi.update(editing.id, form);
      if (updated) {
        if (stockDiff !== 0) {
          updated.stock = editing.stock;
          adjustStock({ productId: updated.id, delta: stockDiff, action: "adjust", refType: "manual", remark: "手工修改库存" });
        }
        const fieldChanged = Object.keys(form).some(k => k !== "stock" && (form as any)[k] !== (editing as any)[k]);
        if (fieldChanged) logProductChange(updated, "update", "编辑产品资料");
      }
      toast.success("已更新");
    } else {
      const created = await productApi.create(form);
      logProductChange(created, "create" as any, "新增产品");
      if ((Number(form.stock) || 0) > 0) {
        created.stock = 0;
        adjustStock({ productId: created.id, delta: Number(form.stock) || 0, action: "in", refType: "manual", remark: "新增产品初始库存" });
      }
      toast.success("已创建");
    }
    setOpen(false); reload();
  };

  const onDelete = async () => {
    if (!delId) return;
    const p = list.find(x => x.id === delId);
    const [s, pu] = await Promise.all([salesApi.all(), purchaseApi.all()]);
    if (s.some(o => o.items.some(it => it.productId === delId)) || pu.some(o => o.items.some(it => it.productId === delId))) {
      toast.error("产品已被订单引用，无法删除"); setDelId(null); return;
    }
    if (p) logProductChange(p, "delete", "删除产品");
    await productApi.remove(delId); toast.success("已删除"); setDelId(null); reload();
  };

  const total = filtered.reduce((s, p) => s + p.stock * p.cost, 0);

  return (
    <>
      <MPageHeader title="产品与库存" subtitle={`共 ${filtered.length} 个 · 库存价值 ${fmtMoney(total)}`} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索名称/编号" />
      <MChipFilter value={catF as any} onChange={setCatF as any}
        options={[{ value: "all", label: "全部" }, ...cats.map(c => ({ value: c.id, label: c.label }))]} />
      <div className="px-4 pb-3">
        <button onClick={() => setLowOnly(!lowOnly)} className={`px-3 h-8 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${lowOnly ? "bg-tomato text-[hsl(var(--paper))]" : "bg-foreground/[0.06] text-foreground/65"}`}>
          <AlertTriangle className="h-3 w-3" />仅看低库存
        </button>
      </div>

      <MList empty={filtered.length === 0}>
        {filtered.map(p => {
          const low = p.stock <= p.safetyStock && p.category !== "software";
          return (
            <MCard key={p.id} onClick={() => openEdit(p)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[14px] truncate">{p.name}</span>
                    <MTag variant="muted">{categoryStore.labelOf(p.category)}</MTag>
                    {low && <MTag variant="tomato">低</MTag>}
                  </div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{p.code} · {p.spec || "—"}</div>
                  <div className="text-[12px] text-foreground/70 mt-1 font-mono">售 {fmtMoney(p.price)} · 成本 {fmtMoney(p.cost)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-display font-black tabular-nums ${low ? "text-tomato" : ""}`}>{p.stock}</div>
                  <div className="text-[10px] text-foreground/45 font-mono">/ {p.safetyStock} {p.unit}</div>
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>

      <MFab onClick={openCreate} />

      <MSheet open={open} onOpenChange={setOpen} size="full" title={editing ? "编辑产品" : "新增产品"}
        footer={<div className="flex gap-2">
          {editing && <MButton variant="danger" onClick={() => { setDelId(editing.id); setOpen(false); }}><Trash2 className="h-3.5 w-3.5" /></MButton>}
          <MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton>
          <MButton onClick={submit} className="flex-1">{editing ? "保存" : "创建"}</MButton>
        </div>}>
        <MGroupTitle>产品信息</MGroupTitle>
        <MField label="编号" required><MInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></MField>
        <MField label="名称" required><MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></MField>
        <MField label="分类">
          <MSelect value={form.category} onChange={v => setForm({ ...form, category: v as any })}
            options={cats.map(c => ({ value: c.id, label: c.label }))} />
        </MField>
        <MField label="单位"><MInput value={form.unit || ""} onChange={e => setForm({ ...form, unit: e.target.value })} /></MField>
        <MField label="规格"><MInput value={form.spec || ""} onChange={e => setForm({ ...form, spec: e.target.value })} /></MField>
        <MGroupTitle>价格</MGroupTitle>
        <MField label="售价"><MInput type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></MField>
        <MField label="成本"><MInput type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></MField>
        <MGroupTitle>库存</MGroupTitle>
        <MField label="当前库存" hint={editing ? "调整后会自动写入库存日志" : undefined}><MInput type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></MField>
        <MField label="安全库存">
          <MInput type="number" disabled={form.category === "software"} value={form.safetyStock} onChange={e => setForm({ ...form, safetyStock: Number(e.target.value) })} />
        </MField>

        {editing && (
          <MAccordion title="库存日志" badge={<MTag variant="muted">{logs.length}</MTag>} defaultOpen>
            <MLogList logs={logs.map((l: any) => ({ id: l.id, action: l.action, refCode: l.refCode, operator: l.operator, createdAt: l.createdAt, remark: `${l.delta > 0 ? "+" : ""}${l.delta} → ${l.afterStock}${l.remark ? "（" + l.remark + "）" : ""}` }))} />
          </MAccordion>
        )}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除产品" onConfirm={onDelete} danger confirmText="删除" />
    </>
  );
}
