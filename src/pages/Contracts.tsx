import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { contractApi, customerApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { Contract, Customer, Employee } from "@/types";

export default function Contracts() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(contractApi.list);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    customerApi.all().then((cs) => setCustomers(cs.filter((c) => c.stage === "formal")));
    employeeApi.all().then(setEmployees);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: { customerId: "", title: "", status: "draft", amount: 0, signedAt: today, startAt: today, endAt: today, ownerId: "u3", remark: "" },
  });

  const openCreate = () => { reset({ customerId: customers[0]?.id, title: "", status: "draft", amount: 0, signedAt: today, startAt: today, endAt: today, ownerId: "u3", remark: "" }); setEditing(null); setOpen(true); };
  const openEdit = (c: Contract) => { reset(c); setEditing(c); setOpen(true); };

  const onSubmit = handleSubmit(async (v) => {
    const cus = customers.find((c) => c.id === v.customerId);
    const payload: any = { ...v, customerName: cus?.name ?? "-", amount: Number(v.amount) || 0, code: editing?.code ?? `CN-${Date.now().toString().slice(-6)}` };
    if (editing) await contractApi.update(editing.id, payload); else await contractApi.create(payload);
    toast.success("已保存"); setOpen(false); reload();
  });

  return (
    <>
      <PageHeader
        title="合同管理"
        meta="CONTRACT ARCHIVE"
        subtitle="销售合同、服务合同的全生命周期跟踪。"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新建合同</Button>}
      />
      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">合同列表</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索合同号/客户/标题" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
            </div>
            <Select value={query.status ?? "all"} onValueChange={(v) => setFilter({ status: v })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="active">执行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="terminated">已终止</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{["合同号", "客户", "标题", "状态", "金额", "签订日", "起止", "负责人", "操作"].map((h) => (
                <th key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {data.list.map((c) => (
                <tr key={c.id} >
                  <td className="font-mono text-xs">{c.code}</td>
                  <td className="truncate max-w-[160px]">{c.customerName}</td>
                  <td className="text-xs truncate max-w-[180px]">{c.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="font-mono text-xs">{fmtMoney(c.amount)}</td>
                  <td className="text-xs text-muted-foreground">{c.signedAt}</td>
                  <td className="text-xs text-muted-foreground">{c.startAt} ~ {c.endAt}</td>
                  <td className="text-xs">{employees.find((e) => e.id === c.ownerId)?.name ?? "-"}</td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "编辑合同" : "新建合同"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">客户</Label>
              <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">状态</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="active">执行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="terminated">已终止</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-xs">合同标题</Label><Input {...register("title", { required: true })} /></div>
            <div><Label className="text-xs">合同金额</Label><Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} /></div>
            <div>
              <Label className="text-xs">负责人</Label>
              <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{employees.filter((e) => e.role !== "管理员").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">签订日期</Label><Input type="date" {...register("signedAt")} /></div>
            <div><Label className="text-xs">开始日期</Label><Input type="date" {...register("startAt")} /></div>
            <div><Label className="text-xs">结束日期</Label><Input type="date" {...register("endAt")} /></div>
            <div className="col-span-2"><Label className="text-xs">备注</Label><Textarea rows={2} {...register("remark")} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除合同" onConfirm={async () => {
        if (deletingId) { await contractApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
