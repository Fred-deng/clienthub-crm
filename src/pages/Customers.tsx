import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { customerApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, customerStageLabel, customerTypeLabel } from "@/lib/format";
import type { Customer } from "@/types";

const emptyCustomer: Omit<Customer, "id"> = {
  code: "", name: "", type: "software", stage: "lead", level: "B",
  contact: "", phone: "", email: "", industry: "", address: "",
  ownerId: "u3", totalAmount: 0, receivable: 0,
  createdAt: new Date().toISOString().slice(0, 10), remark: "",
};

export default function Customers() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(customerApi.list);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Customer, "id">>({ defaultValues: emptyCustomer });

  const openCreate = () => {
    reset({ ...emptyCustomer, code: `CUS-${Date.now().toString().slice(-6)}` });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Customer) => {
    reset(c);
    setEditing(c);
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await customerApi.update(editing.id, values);
      toast.success("客户已更新");
    } else {
      await customerApi.create(values);
      toast.success("客户已创建");
    }
    setOpen(false);
    reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await customerApi.remove(deletingId);
    toast.success("客户已删除");
    setDeletingId(null);
    reload();
  };

  return (
    <>
      <PageHeader
        title="客户管理"
        meta="CUSTOMER REGISTRY"
        subtitle="软件客户与硬件客户档案，区分潜在与正式客户。"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />导出</Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增客户</Button>
          </>
        }
      />

      <DataPanel
        title="客户列表"
        subtitle={`Customer registry · ${data.total} records`}
        accent="tomato"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                placeholder="搜索名称 / 编号 / 联系人"
                className="pl-9 h-9 w-60 text-xs rounded-full"
                onChange={(e) => setFilter({ keyword: e.target.value })}
              />
            </div>
            <Select value={query.type ?? "all"} onValueChange={(v) => setFilter({ type: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="software">软件客户</SelectItem>
                <SelectItem value="hardware">硬件客户</SelectItem>
              </SelectContent>
            </Select>
            <Select value={query.stage ?? "all"} onValueChange={(v) => setFilter({ stage: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="lead">潜在客户</SelectItem>
                <SelectItem value="formal">正式客户</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>客户</th>
                <th>类型</th>
                <th>阶段</th>
                <th>等级</th>
                <th>联系人</th>
                <th>电话</th>
                <th className="num">应收</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={9} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={9} className="empty">暂无客户数据</td></tr>
              )}
              {data.list.map((c) => {
                const avatarTone = c.type === "software" ? "bg-cobalt text-white" : "bg-mint text-foreground";
                return (
                  <tr key={c.id}>
                    <td className="mono">{c.code}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={"size-8 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0 " + avatarTone}>
                          {c.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{c.name}</div>
                          <div className="text-[11px] text-foreground/45 truncate">{c.industry || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={"cell-chip " + (c.type === "software" ? "bg-cobalt/10 text-cobalt ring-1 ring-cobalt/20" : "bg-mint/20 text-foreground ring-1 ring-mint/40")}>
                        {customerTypeLabel(c.type)}
                      </span>
                    </td>
                    <td>
                      <span className={"cell-chip " + (c.stage === "formal" ? "bg-foreground text-background" : "bg-mustard/25 text-foreground ring-1 ring-mustard/50")}>
                        {customerStageLabel(c.stage)}
                      </span>
                    </td>
                    <td>
                      <span className={"inline-flex items-center justify-center size-6 rounded-md font-mono text-[11px] font-bold " + (c.level === "A" ? "bg-tomato text-white" : c.level === "B" ? "bg-foreground/10 text-foreground" : "bg-foreground/[0.06] text-foreground/60")}>
                        {c.level}
                      </span>
                    </td>
                    <td>{c.contact}</td>
                    <td className="mono">{c.phone}</td>
                    <td className="num">{fmtMoney(c.receivable)}</td>
                    <td className="num">
                      <div className="inline-flex gap-1">
                        <button className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={query.page!}
          pageSize={query.pageSize!}
          total={data.total}
          onPageChange={setPage}
        />
      </DataPanel>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs">客户编号</Label>
              <Input {...register("code", { required: true })} />
            </div>
            <div>
              <Label className="text-xs">客户名称</Label>
              <Input {...register("name", { required: true })} />
            </div>
            <div>
              <Label className="text-xs">类型</Label>
              <Select value={watch("type")} onValueChange={(v: any) => setValue("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">软件客户</SelectItem>
                  <SelectItem value="hardware">硬件客户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">阶段</Label>
              <Select value={watch("stage")} onValueChange={(v: any) => setValue("stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">潜在客户</SelectItem>
                  <SelectItem value="formal">正式客户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">等级</Label>
              <Select value={watch("level")} onValueChange={(v: any) => setValue("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A 重点</SelectItem>
                  <SelectItem value="B">B 普通</SelectItem>
                  <SelectItem value="C">C 一般</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">行业</Label>
              <Input {...register("industry")} />
            </div>
            <div>
              <Label className="text-xs">联系人</Label>
              <Input {...register("contact")} />
            </div>
            <div>
              <Label className="text-xs">电话</Label>
              <Input {...register("phone")} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">邮箱</Label>
              <Input {...register("email")} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">地址</Label>
              <Input {...register("address")} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">备注</Label>
              <Textarea rows={2} {...register("remark")} />
            </div>
            <DialogFooter className="col-span-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建客户"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除客户"
        description="删除后无法恢复，与该客户关联的合同/订单不会被自动清理。"
        onConfirm={onDelete}
      />
    </>
  );
}
