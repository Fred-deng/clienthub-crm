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
import { salesApi, customerApi, productApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { SalesOrder, Customer, Product, Employee } from "@/types";

export default function Sales() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(salesApi.list);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    customerApi.all().then((cs) => setCustomers(cs.filter((c) => c.stage === "formal")));
    productApi.all().then(setProducts);
    employeeApi.all().then(setEmployees);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: { customerId: "", status: "pending", ownerId: "u3", createdAt: new Date().toISOString().slice(0, 10), received: 0, remark: "" },
  });

  const openCreate = () => {
    reset({ customerId: customers[0]?.id, status: "pending", ownerId: "u3", createdAt: new Date().toISOString().slice(0, 10), received: 0, remark: "" });
    setItems([]); setEditing(null); setOpen(true);
  };
  const openEdit = (o: SalesOrder) => {
    reset({ customerId: o.customerId, status: o.status, ownerId: o.ownerId, createdAt: o.createdAt, received: o.received, remark: o.remark || "" });
    setItems(o.items); setEditing(o); setOpen(true);
  };

  const onSubmit = handleSubmit(async (v) => {
    const cus = customers.find((c) => c.id === v.customerId);
    const totalAmount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const payload: any = {
      ...v,
      customerName: cus?.name ?? "-",
      items,
      totalAmount,
      received: Number(v.received) || 0,
      code: editing?.code ?? `SO-${Date.now().toString().slice(-6)}`,
    };
    if (editing) await salesApi.update(editing.id, payload); else await salesApi.create(payload);
    toast.success("已保存"); setOpen(false); reload();
  });

  return (
    <>
      <PageHeader
        title="销售订单"
        meta="SALES PIPELINE"
        subtitle="销售订单全流程：下单、发货、回款。"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新建订单</Button>}
      />
      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">订单列表</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索订单号/客户" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
            </div>
            <Select value={query.status ?? "all"} onValueChange={(v) => setFilter({ status: v })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待发货</SelectItem>
                <SelectItem value="shipped">运输中</SelectItem>
                <SelectItem value="delivered">已送达</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{["订单号", "客户", "明细", "状态", "金额", "已回款", "未收", "销售员", "下单日", "操作"].map((h) => (
                <th key={h}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={10} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {data.list.map((o) => {
                const owner = employees.find((e) => e.id === o.ownerId);
                const unpaid = o.totalAmount - o.received;
                return (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.code}</td>
                    <td className="text-foreground/90 truncate max-w-[180px]">{o.customerName}</td>
                    <td className="text-xs text-muted-foreground truncate max-w-[200px]">{o.items.map((i) => `${i.productName}×${i.qty}`).join(", ")}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="font-mono text-xs">{fmtMoney(o.totalAmount)}</td>
                    <td className="font-mono text-xs text-accent">{fmtMoney(o.received)}</td>
                    <td className={"px-5 py-3 font-mono text-xs " + (unpaid> 0 ? "text-warning" : "text-muted-foreground")}>{fmtMoney(unpaid)}</td>
                    <td className="text-xs">{owner?.name ?? "-"}</td>
                    <td className="text-xs text-muted-foreground">{o.createdAt}</td>
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
          <DialogHeader><DialogTitle>{editing ? "编辑销售订单" : "新建销售订单"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">客户</Label>
                <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
                  <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">状态</Label>
                <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待发货</SelectItem>
                    <SelectItem value="shipped">运输中</SelectItem>
                    <SelectItem value="delivered">已送达</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">销售员</Label>
                <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {employees.filter((e) => e.role !== "管理员").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">下单日</Label><Input type="date" {...register("createdAt")} /></div>
              <div><Label className="text-xs">已回款</Label><Input type="number" step="0.01" {...register("received", { valueAsNumber: true })} /></div>
              <div><Label className="text-xs">备注</Label><Input {...register("remark")} /></div>
            </div>
            <LineItemsEditor items={items} products={products} onChange={setItems} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建订单"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除订单" onConfirm={async () => {
        if (deletingId) { await salesApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
