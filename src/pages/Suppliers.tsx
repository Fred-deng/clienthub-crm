import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { Supplier, Employee } from "@/types";

const empty: Omit<Supplier, "id"> = {
  code: "", name: "", taxNo: "",
  contact: "", phone: "", contactPosition: "",
  secondaryContact: "", secondaryContactPhone: "",
  address: "", addressDetail: "",
  buyerId: "", assistantIds: [],
  bankAccountName: "", bankName: "", bankAccountNo: "",
  remark: "", attachment: "",
  category: "工控机", payable: 0,
  createdAt: new Date().toISOString().slice(0, 10),
};

// —— 分组小标题：参考图片中的深色 chip + 长分割线 ——
function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-12 flex items-center gap-3 mt-2 first:mt-0">
      <span className="inline-flex items-center px-3 h-7 rounded-md bg-foreground text-background text-xs font-semibold tracking-wide">
        {children}
      </span>
      <div className="flex-1 h-px bg-foreground/10" />
    </div>
  );
}
function Field({ label, required, span = 4, children }: { label: string; required?: boolean; span?: number; children: ReactNode }) {
  const m: Record<number, string> = {
    3: "col-span-12 md:col-span-6 lg:col-span-3",
    4: "col-span-12 md:col-span-6 lg:col-span-4",
    6: "col-span-12 md:col-span-6",
    12: "col-span-12",
  };
  return (
    <div className={m[span]}>
      <Label className="text-xs text-foreground/70 mb-1.5 block">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function Suppliers() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(supplierApi.list);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => { employeeApi.all().then(setEmployees); }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Supplier, "id">>({ defaultValues: empty });

  const openCreate = () => {
    reset({ ...empty, code: `SUP-${Date.now().toString().slice(-6)}` });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (s: Supplier) => {
    reset({ ...empty, ...s, assistantIds: s.assistantIds ?? [] });
    setEditing(s);
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await supplierApi.update(editing.id, values);
      toast.success("供应商已更新");
    } else {
      await supplierApi.create(values);
      toast.success("供应商已创建");
    }
    setOpen(false);
    reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await supplierApi.remove(deletingId);
    toast.success("供应商已删除");
    setDeletingId(null);
    reload();
  };

  const empName = (id?: string) => employees.find((e) => e.id === id)?.name ?? "—";
  const assistantIds = watch("assistantIds") ?? [];
  const toggleAssistant = (id: string) => {
    const next = assistantIds.includes(id) ? assistantIds.filter((x) => x !== id) : [...assistantIds, id];
    setValue("assistantIds", next);
  };

  return (
    <>
      <PageHeader
        title="供应商管理"
        meta="SUPPLIER NETWORK"
        subtitle="供应商企业档案、联系人、采购归属与银行账户。"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增供应商</Button>}
      />
      <DataPanel
        title="供应商列表"
        subtitle={`Suppliers · ${data.total} records`}
        accent="cobalt"
        actions={
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input
              placeholder="搜索名称/编号/联系人"
              className="pl-9 h-9 w-60 text-xs rounded-full"
              onChange={(e) => setFilter({ keyword: e.target.value })}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>供应商</th>
                <th>分类</th>
                <th>联系人</th>
                <th>电话</th>
                <th>采购负责人</th>
                <th>开户银行</th>
                <th className="num">应付</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={9} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={9} className="empty">暂无供应商</td></tr>
              )}
              {data.list.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.code}</td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-cobalt/15 text-cobalt flex items-center justify-center font-display font-black text-sm shrink-0">
                        {s.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{s.name}</div>
                        <div className="text-[11px] text-foreground/45 truncate mono">{s.taxNo || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="cell-chip bg-foreground/5 text-foreground/75 ring-1 ring-foreground/10">{s.category}</span>
                  </td>
                  <td>
                    <div className="font-medium">{s.contact}</div>
                    <div className="text-[11px] text-foreground/45">{s.contactPosition || "—"}</div>
                  </td>
                  <td className="mono text-[12px]">{s.phone}</td>
                  <td className="text-foreground/70">{empName(s.buyerId)}</td>
                  <td className="text-[12px] text-foreground/65 truncate max-w-[180px]">{s.bankName || "—"}</td>
                  <td className="num text-tomato font-semibold">{fmtMoney(s.payable)}</td>
                  <td className="num">
                    <div className="inline-flex gap-1">
                      <button className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑供应商" : "新增供应商"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            {/* 企业档案 */}
            <GroupTitle>企业档案</GroupTitle>
            <Field label="供应商名称" required><Input placeholder="请输入供应商名称" {...register("name", { required: true })} /></Field>
            <Field label="税号"><Input placeholder="请输入税号" {...register("taxNo")} /></Field>
            <Field label="供应商编号" required><Input placeholder="请输入编号" {...register("code", { required: true })} /></Field>
            <Field label="分类">
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["工控机", "外设", "线缆", "电源", "综合", "软件", "服务"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* 联系人信息 */}
            <GroupTitle>联系人信息</GroupTitle>
            <Field label="联系人姓名"><Input {...register("contact")} /></Field>
            <Field label="联系电话"><Input {...register("phone")} /></Field>
            <Field label="联系人职务"><Input placeholder="如：销售经理" {...register("contactPosition")} /></Field>
            <Field label="次联系人"><Input {...register("secondaryContact")} /></Field>
            <Field label="次联系人电话"><Input {...register("secondaryContactPhone")} /></Field>

            {/* 地址信息 */}
            <GroupTitle>地址信息</GroupTitle>
            <Field label="地址" span={6}><Input placeholder="省/市/区" {...register("address")} /></Field>
            <Field label="详细地址" span={6}><Input placeholder="街道、楼栋、门牌号" {...register("addressDetail")} /></Field>

            {/* 采购归属 */}
            <GroupTitle>采购归属</GroupTitle>
            <Field label="采购负责人" span={6}>
              <Select value={watch("buyerId") || ""} onValueChange={(v) => setValue("buyerId", v)}>
                <SelectTrigger><SelectValue placeholder="选择采购负责人" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="采购助理（可多选）" span={6}>
              <div className="rounded-md border border-input bg-background min-h-10 px-2 py-1.5 flex flex-wrap items-center gap-1.5">
                {assistantIds.length === 0 && (
                  <span className="text-xs text-foreground/40 px-1">点击下方添加</span>
                )}
                {assistantIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 pl-2 pr-1 h-6 rounded-full bg-cobalt/12 text-cobalt text-[11px] font-medium">
                    {empName(id)}
                    <button type="button" className="hover:bg-cobalt/20 rounded-full p-0.5" onClick={() => toggleAssistant(id)}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {employees.filter((e) => !assistantIds.includes(e.id)).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleAssistant(e.id)}
                    className="text-[11px] px-2 h-6 rounded-full bg-foreground/5 hover:bg-cobalt/12 hover:text-cobalt text-foreground/60 transition-colors"
                  >
                    + {e.name}
                  </button>
                ))}
              </div>
            </Field>

            {/* 银行账户 */}
            <GroupTitle>银行账户</GroupTitle>
            <Field label="开户名称"><Input placeholder="一般为公司全称" {...register("bankAccountName")} /></Field>
            <Field label="开户银行"><Input placeholder="如：工商银行 深圳分行" {...register("bankName")} /></Field>
            <Field label="银行账号"><Input className="mono" placeholder="请输入银行账号" {...register("bankAccountNo")} /></Field>

            {/* 备注与附件 */}
            <GroupTitle>备注与附件</GroupTitle>
            <Field label="备注" span={8}><Textarea rows={3} placeholder="补充说明" {...register("remark")} /></Field>
            <Field label="附件" span={4}>
              <div className="rounded-lg border border-dashed border-foreground/20 bg-foreground/[0.02] aspect-square max-h-32 flex items-center justify-center text-foreground/35 hover:text-foreground/60 hover:border-foreground/30 transition cursor-pointer relative">
                <Plus className="h-6 w-6" />
                <Input
                  placeholder="附件链接或文件名"
                  className="absolute bottom-1 left-1 right-1 h-7 text-[11px] bg-background"
                  {...register("attachment")}
                />
              </div>
            </Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建供应商"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除供应商"
        description="删除后无法恢复，与该供应商关联的采购单不会被自动清理。"
        onConfirm={onDelete}
      />
    </>
  );
}
