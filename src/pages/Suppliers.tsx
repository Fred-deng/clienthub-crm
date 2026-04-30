import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supplierApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { Supplier } from "@/types";

const empty: Omit<Supplier, "id"> = { code: "", name: "", contact: "", phone: "", category: "工控机", payable: 0, createdAt: new Date().toISOString().slice(0, 10) };

export default function Suppliers() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(supplierApi.list);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<Omit<Supplier, "id">>({ defaultValues: empty });

  return (
    <>
      <PageHeader
        title="供应商管理"
        meta="SUPPLIER NETWORK"
        actions={<Button size="sm" onClick={() => { reset({ ...empty, code: `SUP-${Date.now().toString().slice(-6)}` }); setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1.5" />新增供应商</Button>}
      />
      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">供应商列表</h3>}
        actions={
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索名称/编号" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left">
              <tr>{["编号", "名称", "分类", "联系人", "电话", "应付", "建档日期", "操作"].map((h) => (
                <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {data.list.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-mono text-xs">{s.code}</td>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-xs">{s.category}</td>
                  <td className="px-5 py-3 text-xs">{s.contact}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.phone}</td>
                  <td className="px-5 py-3 font-mono text-xs text-warning">{fmtMoney(s.payable)}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{s.createdAt}</td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { reset(s); setEditing(s); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "编辑供应商" : "新增供应商"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(async (v) => {
            if (editing) await supplierApi.update(editing.id, v); else await supplierApi.create(v);
            toast.success("操作成功"); setOpen(false); reload();
          })} className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs">编号</Label><Input {...register("code", { required: true })} /></div>
            <div><Label className="text-xs">名称</Label><Input {...register("name", { required: true })} /></div>
            <div><Label className="text-xs">分类</Label><Input {...register("category")} /></div>
            <div><Label className="text-xs">联系人</Label><Input {...register("contact")} /></div>
            <div><Label className="text-xs">电话</Label><Input {...register("phone")} /></div>
            <div><Label className="text-xs">建档日期</Label><Input type="date" {...register("createdAt")} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除供应商" onConfirm={async () => {
        if (deletingId) { await supplierApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
