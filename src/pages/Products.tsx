import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StockLogDialog } from "@/components/common/StockLogDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productApi } from "@/services/api";
import { adjustStock, logProductChange } from "@/services/inventory";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import { useCategories, categoryStore } from "@/services/categories";
import type { Product } from "@/types";

const empty: Omit<Product, "id"> = {
  code: "", name: "", category: "ipc", unit: "台", price: 0, cost: 0, stock: 0, safetyStock: 10, spec: "",
};

export default function Products() {
  const [searchParams] = useSearchParams();
  const initialLow = searchParams.get("lowStock") === "1";
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(productApi.list, { lowStock: initialLow });
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logProduct, setLogProduct] = useState<Product | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const categories = useCategories();
  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Product, "id">>({ defaultValues: empty });

  const openCreate = () => { reset({ ...empty, code: `PRD-${Date.now().toString().slice(-6)}` }); setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { reset(p); setEditing(p); setOpen(true); };

  const onSubmit = handleSubmit(async (v) => {
    if (editing) {
      const stockDiff = (Number(v.stock) || 0) - editing.stock;
      const updated = await productApi.update(editing.id, v);
      if (updated) {
        // 数量变化 → 写入 adjust 日志（且实际库存已通过 update 写入，这里仅补记录）
        if (stockDiff !== 0) {
          // update 已把 stock 设到目标值，但 adjustStock 会再次叠加，所以先回退再调用
          updated.stock = editing.stock;
          adjustStock({
            productId: updated.id,
            delta: stockDiff,
            action: "adjust",
            refType: "manual",
            remark: "手工修改库存",
          });
        }
        // 其他字段变更
        const fieldChanged = Object.keys(v).some((k) => k !== "stock" && (v as any)[k] !== (editing as any)[k]);
        if (fieldChanged) logProductChange(updated, "update", "编辑产品资料");
      }
      toast.success("已更新");
    } else {
      const created = await productApi.create(v);
      logProductChange(created, "create" as any, "新增产品");
      if ((Number(v.stock) || 0) > 0) {
        created.stock = 0;
        adjustStock({ productId: created.id, delta: Number(v.stock) || 0, action: "in", refType: "manual", remark: "新增产品初始库存" });
      }
      toast.success("已创建");
    }
    setOpen(false); reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    const p = data.list.find((x) => x.id === deletingId);
    if (p) logProductChange(p, "delete", "删除产品");
    await productApi.remove(deletingId);
    toast.success("已删除"); setDeletingId(null); reload();
  };

  return (
    <>
      <PageHeader
        title="产品与库存"
        meta="INVENTORY · SKU"
        subtitle="软件产品授权与硬件 SKU 库存管理。"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setLogProduct(null); setLogOpen(true); }}>
              <History className="h-4 w-4 mr-1.5" />库存日志
            </Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增产品</Button>
          </div>
        }
      />

      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">产品列表</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索名称/编号" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
            </div>
            <Select value={query.category ?? "all"} onValueChange={(v) => setFilter({ category: v })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {Object.entries(productCategoryLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={query.lowStock ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilter({ lowStock: !query.lowStock })}
>
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> 仅看低库存
            </Button>
          </div>
        }
>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {["编号", "名称", "分类", "规格", "单位", "售价", "成本", "库存", "安全库存", "操作"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {!loading && data.list.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">暂无数据</td></tr>}
              {data.list.map((p) => {
                const low = p.stock <= p.safetyStock && p.category !== "software";
                return (
                  <tr key={p.id} className="clickable" onDoubleClick={() => openEdit(p)} title="双击查看详情">
                    <td className="font-mono text-xs">{p.code}</td>
                    <td className="font-medium">{p.name}</td>
                    <td className="text-xs text-muted-foreground">{productCategoryLabel[p.category]}</td>
                    <td className="text-xs text-muted-foreground">{p.spec || "-"}</td>
                    <td className="text-xs">{p.unit}</td>
                    <td className="font-mono text-xs">{fmtMoney(p.price)}</td>
                    <td className="font-mono text-xs text-muted-foreground">{fmtMoney(p.cost)}</td>
                    <td className={"px-5 py-3 font-mono text-xs " + (low ? "text-warning font-bold" : "")}>{p.stock}</td>
                    <td className="font-mono text-xs text-muted-foreground">{p.safetyStock}</td>
                    <td className="px-5 py-3" onDoubleClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="库存日志" onClick={() => { setLogProduct(p); setLogOpen(true); }}><History className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.list.length > 0 && (() => {
              const stockTotal = data.list.reduce((s, p) => s + p.stock, 0);
              const valueTotal = data.list.reduce((s, p) => s + p.stock * p.cost, 0);
              const lowCount = data.list.filter((p) => p.stock <= p.safetyStock && p.category !== "software").length;
              return (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="label">本页 {data.list.length} 个 / 共 {data.total} 个 · 库存价值 <span className="mono font-bold text-foreground ml-1">{fmtMoney(valueTotal)}</span></td>
                    <td colSpan={2} />
                    <td className="num">{stockTotal}</td>
                    <td colSpan={2} className="text-[11px] text-warning">低库存 {lowCount} 个</td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "编辑产品" : "新增产品"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs">编号</Label><Input {...register("code", { required: true })} /></div>
            <div><Label className="text-xs">名称</Label><Input {...register("name", { required: true })} /></div>
            <div>
              <Label className="text-xs">分类</Label>
              <Select value={watch("category")} onValueChange={(v: any) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(productCategoryLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">单位</Label><Input {...register("unit")} /></div>
            <div><Label className="text-xs">售价</Label><Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} /></div>
            <div><Label className="text-xs">成本</Label><Input type="number" step="0.01" {...register("cost", { valueAsNumber: true })} /></div>
            <div><Label className="text-xs">库存</Label><Input type="number" {...register("stock", { valueAsNumber: true })} /></div>
            <div><Label className="text-xs">安全库存</Label><Input type="number" {...register("safetyStock", { valueAsNumber: true })} /></div>
            <div className="col-span-2"><Label className="text-xs">规格</Label><Input {...register("spec")} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除产品" onConfirm={onDelete} />
      <StockLogDialog open={logOpen} onOpenChange={setLogOpen} productId={logProduct?.id} productName={logProduct?.name} />
    </>
  );
}
