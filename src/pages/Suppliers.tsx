import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, X, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AttachmentField } from "@/components/common/AttachmentField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierApi, supplierContactApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import { useCategories, categoryStore } from "@/services/categories";
import type { Supplier, SupplierContact, Employee } from "@/types";

const empty: Omit<Supplier, "id"> = {
  code: "", name: "", taxNo: "",
  contact: "", phone: "", contactPosition: "",
  secondaryContact: "", secondaryContactPhone: "",
  address: "", addressDetail: "",
  buyerId: "", assistantIds: [],
  bankAccountName: "", bankName: "", bankAccountNo: "",
  remark: "", attachment: "",
  category: "ipc", payable: 0,
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
  const categories = useCategories();
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(supplierApi.list);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>([]);
  const [draftContacts, setDraftContacts] = useState<Omit<SupplierContact, "id">[]>([]);
  const [miniContactOpen, setMiniContactOpen] = useState(false);

  useEffect(() => { employeeApi.all().then(setEmployees); }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Supplier, "id">>({ defaultValues: empty });

  const openCreate = () => {
    reset({ ...empty, code: `SUP-${Date.now().toString().slice(-6)}` });
    setEditing(null);
    setSupplierContacts([]);
    setDraftContacts([]);
    setOpen(true);
  };
  const openEdit = async (s: Supplier) => {
    reset({ ...empty, ...s, assistantIds: s.assistantIds ?? [] });
    setEditing(s);
    setOpen(true);
    const list = await supplierContactApi.list({ supplierId: s.id, pageSize: 100 });
    setSupplierContacts(list.list);
  };
  const reloadSupplierContacts = async () => {
    if (!editing) return;
    const list = await supplierContactApi.list({ supplierId: editing.id, pageSize: 100 });
    setSupplierContacts(list.list);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await supplierApi.update(editing.id, values);
      toast.success("供应商已更新");
    } else {
      const created = await supplierApi.create(values);
      if (draftContacts.length) {
        await Promise.all(draftContacts.map((c) =>
          supplierContactApi.create({ ...c, supplierId: created.id, supplierName: created.name })
        ));
      }
      toast.success(`供应商已创建${draftContacts.length ? `，含 ${draftContacts.length} 位联系人` : ""}`);
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
                <tr key={s.id} className="clickable" onDoubleClick={() => openEdit(s)} title="双击查看详情">
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
                    <span className="cell-chip bg-foreground/5 text-foreground/75 ring-1 ring-foreground/10">{categoryStore.labelOf(s.category)}</span>
                  </td>
                  <td>
                    <div className="font-medium">{s.contact}</div>
                    <div className="text-[11px] text-foreground/45">{s.contactPosition || "—"}</div>
                  </td>
                  <td className="mono text-[12px]">{s.phone}</td>
                  <td className="text-foreground/70">{empName(s.buyerId)}</td>
                  <td className="text-[12px] text-foreground/65 truncate max-w-[180px]">{s.bankName || "—"}</td>
                  <td className="num text-tomato font-semibold">{fmtMoney(s.payable)}</td>
                  <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
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
            {data.list.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7} className="label">本页 {data.list.length} 家 · 共 {data.total} 家 · 应付合计</td>
                  <td className="num text-tomato">{fmtMoney(data.list.reduce((s, x) => s + (x.payable || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            )}
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
              <Select value={categoryStore.normalize(watch("category"))} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

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
            <Field label="备注" span={12}><Textarea rows={3} placeholder="补充说明" {...register("remark")} /></Field>
            <Field label="附件" span={12}>
              <AttachmentField singleValue={watch("attachment") || ""} onSingleChange={(v) => setValue("attachment", v)} hint="供应商相关合同 / 资质 / 其他文件" />
            </Field>

            <GroupTitle>供应商联系人</GroupTitle>
            <div className="col-span-12 rounded-xl border border-foreground/10 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-foreground/[0.03] border-b border-foreground/8">
                <div className="text-xs text-foreground/60">
                  共 <span className="font-bold text-foreground">{editing ? supplierContacts.length : draftContacts.length}</span> 位联系人
                  {!editing && <span className="ml-2 text-foreground/40">（保存供应商时一并创建）</span>}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setMiniContactOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />新增联系人
                </Button>
              </div>
              {(editing ? supplierContacts.length : draftContacts.length) === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-foreground/45">暂无联系人，点击右上角新增。</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>职务</th>
                      <th>电话</th>
                      <th>邮箱</th>
                      <th>微信</th>
                      <th className="num">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editing ? supplierContacts : draftContacts).map((sc, idx) => (
                      <tr key={(sc as any).id ?? `draft-${idx}`}>
                        <td>
                          <div className="flex items-center gap-1.5 font-semibold">
                            {sc.name}
                            {sc.isPrimary && <Star className="h-3 w-3 fill-tomato text-tomato" />}
                          </div>
                        </td>
                        <td className="text-foreground/70">{sc.position || "—"}</td>
                        <td className="mono">{sc.phone}</td>
                        <td className="text-foreground/65 text-[12px]">{sc.email || "—"}</td>
                        <td className="text-foreground/65 text-[12px]">{sc.wechat || "—"}</td>
                        <td className="num">
                          <button
                            type="button"
                            className="text-[11px] text-tomato hover:underline"
                            onClick={async () => {
                              if (editing) {
                                await supplierContactApi.remove((sc as any).id);
                                toast.success("联系人已删除");
                                reloadSupplierContacts();
                              } else {
                                setDraftContacts((arr) => arr.filter((_, i) => i !== idx));
                              }
                            }}
                          >
                            {editing ? "删除" : "移除"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建供应商"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MiniSupplierContactDialog
        open={miniContactOpen}
        onOpenChange={setMiniContactOpen}
        supplier={editing ?? ({ id: "", name: watch("name") || "（未保存供应商）" } as Supplier)}
        onCreated={editing ? reloadSupplierContacts : undefined}
        onDraft={editing ? undefined : (d) => setDraftContacts((arr) => [...arr, d])}
      />

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

// —— 供应商详情内：快速新增联系人对话框 ——
function MiniSupplierContactDialog({
  open, onOpenChange, supplier, onCreated, onDraft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier;
  onCreated?: () => void;
  onDraft?: (d: Omit<SupplierContact, "id">) => void;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<SupplierContact, "id">>({
    defaultValues: {
      code: "", supplierId: supplier.id, supplierName: supplier.name,
      name: "", phone: "", position: "", email: "", wechat: "",
      isPrimary: false, remark: "",
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: `GLXR-${Date.now().toString().slice(-6)}`,
        supplierId: supplier.id, supplierName: supplier.name,
        name: "", phone: "", position: "", email: "", wechat: "",
        isPrimary: false, remark: "",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, supplier.id, supplier.name, reset]);

  const submit = handleSubmit(async (values) => {
    const payload = { ...values, supplierId: supplier.id, supplierName: supplier.name };
    if (onDraft) {
      onDraft(payload);
      toast.success("已加入草稿，将在保存供应商时一起创建");
    } else {
      await supplierContactApi.create(payload);
      toast.success("联系人已新增");
      onCreated?.();
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增联系人 · {supplier.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
          <Field label="姓名" required><Input {...register("name", { required: true })} /></Field>
          <Field label="电话" required><Input {...register("phone", { required: true })} /></Field>
          <Field label="职务"><Input placeholder="如：销售经理" {...register("position")} /></Field>
          <Field label="邮箱"><Input {...register("email")} /></Field>
          <Field label="微信"><Input {...register("wechat")} /></Field>
          <Field label="主联系人">
            <div className="h-10 flex items-center">
              <Switch checked={watch("isPrimary")} onCheckedChange={(v) => setValue("isPrimary", v)} />
              <span className="ml-2 text-xs text-foreground/60">设为该供应商主联系人</span>
            </div>
          </Field>
          <Field label="备注" span={12}><Textarea rows={2} {...register("remark")} /></Field>
          <DialogFooter className="col-span-12 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit">创建联系人</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
