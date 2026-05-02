import { useState } from "react";
import { productApi } from "@/services/api";
import { useInfiniteList } from "../hooks/useInfiniteList";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductCategory } from "@/types";
import { Package, AlertTriangle } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MLoadMore, MCard, MTag, MFab, MSheet, MField, MInput, MSelect, MButton, MChipFilter, MConfirm, MRow } from "../components/MUI";

const CATS: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "全部" }, { value: "software", label: "软件" }, { value: "ipc", label: "工控机" }, { value: "pda", label: "PDA" }, { value: "mouse", label: "鼠标" }, { value: "cable", label: "线材" }, { value: "power", label: "电源" }, { value: "other", label: "其他" },
];

export default function MProducts() {
  const { toast } = useToast();
  const { items, total, loading, hasMore, setFilter, loadMore, reload } = useInfiniteList<Product>(productApi.list, { pageSize: 15 });
  const [keyword, setKeyword] = useState(""); const [cat, setCat] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [view, setView] = useState<Product | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const openCreate = () => { setEditing({ category: "ipc", unit: "台", price: 0, cost: 0, stock: 0, safetyStock: 0, name: "", code: "" }); setEditOpen(true); };
  const save = async () => {
    if (!editing?.name) return toast({ title: "请填写产品名称" });
    if (editing.id) await productApi.update(editing.id, editing);
    else await productApi.create({ ...editing, code: `PRD-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await productApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };

  return (
    <div>
      <MPageHeader title="产品库" subtitle={`共 ${total} 个 SKU`} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="名称 / 编号 / 规格" />
      <MChipFilter value={cat} onChange={(v) => { setCat(v); setFilter({ category: v }); }} options={CATS} />
      <MList loading={loading && !items.length} empty={!loading && !items.length}>
        {items.map((p) => {
          const low = p.stock <= p.safetyStock && p.category !== "software";
          return (
            <MCard key={p.id} onClick={() => setView(p)}>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-mint/20 flex items-center justify-center"><Package className="h-5 w-5 text-foreground/65" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate flex-1">{p.name}</span>
                    {low && <MTag variant="tomato"><AlertTriangle className="h-3 w-3 mr-0.5" />低库存</MTag>}
                  </div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{p.code} · {p.spec ?? "—"}</div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[11px] text-foreground/55">库存 {p.stock} {p.unit}</span>
                    <span className="font-mono font-bold tabular-nums text-sm">¥{p.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </MCard>
          );
        })}
        {items.length > 0 && <MLoadMore hasMore={hasMore} loading={loading} onLoad={loadMore} />}
      </MList>
      <MFab onClick={openCreate} />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title={view?.name ?? "产品"}
        footer={view && (<div className="flex gap-2"><MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton><MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton></div>)}
      >
        {view && <div>
          <MRow label="编号" value={view.code} mono />
          <MRow label="类别" value={CATS.find(c => c.value === view.category)?.label} />
          <MRow label="规格" value={view.spec} />
          <MRow label="单位" value={view.unit} />
          <MRow label="售价" value={`¥${view.price.toLocaleString()}`} mono />
          <MRow label="成本" value={`¥${view.cost.toLocaleString()}`} mono />
          <MRow label="库存" value={`${view.stock} ${view.unit}`} mono />
          <MRow label="安全库存" value={view.safetyStock} mono />
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑产品" : "新建产品"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="名称" required><MInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></MField>
          <MField label="类别"><MSelect value={editing.category ?? "ipc"} onChange={(v) => setEditing({ ...editing, category: v as any })} options={CATS.filter(c => c.value !== "all").map(c => ({ value: c.value as string, label: c.label }))} /></MField>
          <MField label="规格"><MInput value={editing.spec ?? ""} onChange={(e) => setEditing({ ...editing, spec: e.target.value })} /></MField>
          <MField label="单位"><MInput value={editing.unit ?? ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></MField>
          <div className="grid grid-cols-2 gap-3">
            <MField label="售价"><MInput type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></MField>
            <MField label="成本"><MInput type="number" value={editing.cost ?? 0} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })} /></MField>
            <MField label="库存"><MInput type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></MField>
            <MField label="安全库存"><MInput type="number" value={editing.safetyStock ?? 0} onChange={(e) => setEditing({ ...editing, safetyStock: Number(e.target.value) })} /></MField>
          </div>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除产品？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
