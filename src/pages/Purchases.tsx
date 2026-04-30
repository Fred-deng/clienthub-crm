import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LineItemsEditor, LineItem } from "@/components/common/LineItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseApi, supplierApi, productApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { PurchaseOrder, Supplier, Product } from "@/types";

export default function Purchases() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(purchaseApi.list);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supplierApi.all().then(setSuppliers);
    productApi.all().then((p) => setProducts(p.filter((x) => x.category !== "software")));
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: { supplierId: "", status: "draft", createdAt: new Date().toISOString().slice(0, 10), expectedAt: "", paid: 0, remark: "" },
  });

  const openCreate = () => {
    reset({ supplierId: suppliers[0]?.id, status: "draft", createdAt: new Date().toISOString().slice(0, 10), expectedAt: "", paid: 0, remark: "" });
    setItems([]); setEditing(null); setOpen(true);
  };
  const openEdit = (o: PurchaseOrder) => {
    reset({ supplierId: o.supplierId, status: o.status, createdAt: o.createdAt, expectedAt: o.expectedAt, paid: o.paid, remark: o.remark || "" });
    setItems(o.items); setEditing(o); setOpen(true);
  };

  const onSubmit = handleSubmit(async (v) => {
    const sup = suppliers.find((s) => s.id === v.supplierId);
    const totalAmount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const payload: any = { ...v, supplierName: sup?.name ?? "-", items, totalAmount, paid: Number(v.paid) || 0, code: editing?.code ?? `PO-${Date.now().toString().slice(-6)}` };
    if (editing) await purchaseApi.update(editing.id, payload); else await purchaseApi.create(payload);
    toast.success("已保存"); setOpen(false); reload();
  });

  return (
    <>
      <PageHeader
        title="采购管理"
        meta="PROCUREMENT"
        subtitle="硬件采购入库与供应商付款跟踪。"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新建采购单</Button>}
      />
      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">采购单列表</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索单号/供应商" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
            </div>
            <Select value={query.status ?? "all"} onValueChange={(v) => setFilter({ status: v })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="ordered">已下单</SelectItem>
                <SelectItem value="received">已入库</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left">
              <tr>{["单号", "供应商", "状态", "金额", "已付款", "未付", "下单日", "预计入库", "操作"].map((h) => (
                <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={9} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {data.list.map((o) => {
                const unpaid = o.totalAmount - o.paid;
                return (
                  <tr key={o.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-mono text-xs">{o.code}</td>
                    <td className="px-5 py-3">{o.supplierName}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 font-mono text-xs">{fmtMoney(o.totalAmount)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-accent">{fmtMoney(o.paid)}</td>
                    <td className={"px-5 py-3 font-mono text-xs " + (unpaid > 0 ? "text-warning" : "text-muted-foreground")}>{fmtMoney(unpaid)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{o.createdAt}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{o.expectedAt}</td>
                    <td className="px-5 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "编辑采购单" : "新建采购单"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">供应商</Label>
                <Select value={watch("supplierId")} onValueChange={(v) => setValue("supplierId", v)}>
                  <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">状态</Label>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="ordered">已下单</SelectItem>
                    <SelectItem value="received">已入库</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">已付款</Label><Input type="number" step="0.01" {...register("paid", { valueAsNumber: true })} /></div>
              <div><Label className="text-xs">下单日</Label><Input type="date" {...register("createdAt")} /></div>
              <div><Label className="text-xs">预计入库</Label><Input type="date" {...register("expectedAt")} /></div>
              <div><Label className="text-xs">备注</Label><Input {...register("remark")} /></div>
            </div>
            <LineItemsEditor items={items} products={products} onChange={setItems} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除采购单" onConfirm={async () => {
        if (deletingId) { await purchaseApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
