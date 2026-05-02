import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { contactApi, customerApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import type { Contact, Customer, Employee } from "@/types";

const empty: Omit<Contact, "id"> = {
  code: "", customerId: "", customerName: "", name: "", phone: "",
  position: "", email: "", address: "", birthday: "",
  ownerId: "u3", isPrimary: false, remark: "", attachment: "",
  createdAt: new Date().toISOString().slice(0, 10),
};

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

const DRAFT_KEY = "contacts:draftForm";

export default function Contacts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const customerIdParam = searchParams.get("customerId") || "all";

  const { query, data, loading, reload, setFilter, setPage } = usePagedList(
    contactApi.list,
    { customerId: customerIdParam }
  );
  const [editing, setEditing] = useState<Contact | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    customerApi.all().then(setCustomers);
    employeeApi.all().then(setEmployees);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Contact, "id">>({ defaultValues: empty });

  const openCreate = () => {
    const cid = customerIdParam !== "all" ? customerIdParam : "";
    const c = customers.find((x) => x.id === cid);
    reset({
      ...empty,
      code: `LXR-${Date.now().toString().slice(-6)}`,
      customerId: cid,
      customerName: c?.name ?? "",
      ownerId: c?.ownerId ?? "u3",
    });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (it: Contact) => {
    reset({ ...empty, ...it });
    setEditing(it);
    setOpen(true);
  };

  // 跨页流程：从客户页新增完客户后回跳 / 编辑指定联系人 / 恢复未提交草稿
  useEffect(() => {
    if (customers.length === 0) return;

    const editId = searchParams.get("editId");
    const newCustomerId = searchParams.get("newCustomerId");
    const draftRaw = sessionStorage.getItem(DRAFT_KEY);

    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as Omit<Contact, "id">;
        const cid = newCustomerId || draft.customerId;
        const cust = customers.find((x) => x.id === cid);
        reset({ ...empty, ...draft, customerId: cid || "", customerName: cust?.name ?? draft.customerName });
        setEditing(null);
        setOpen(true);
      } catch { /* ignore */ }
      sessionStorage.removeItem(DRAFT_KEY);
      // 清掉 newCustomerId 参数，保留 customerId
      const next = new URLSearchParams(searchParams);
      next.delete("newCustomerId");
      setSearchParams(next, { replace: true });
      return;
    }

    if (editId) {
      contactApi.get(editId).then((it) => {
        if (it) { reset({ ...empty, ...it }); setEditing(it); setOpen(true); }
      });
      const next = new URLSearchParams(searchParams);
      next.delete("editId");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers]);

  const goCreateCustomer = () => {
    // 把当前正在编辑/新增的联系人草稿存起来
    const draft = { ...empty, ...(editing ?? {}), ...(watch() as any) };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setOpen(false);
    const returnTo = `/contacts${customerIdParam !== "all" ? `?customerId=${customerIdParam}` : ""}`;
    navigate(`/customers?createNew=1&returnTo=${encodeURIComponent(returnTo)}`);
  };

  const onSubmit = handleSubmit(async (values) => {
    const c = customers.find((x) => x.id === values.customerId);
    const payload = { ...values, customerName: c?.name ?? values.customerName };
    if (editing) {
      await contactApi.update(editing.id, payload);
      toast.success("联系人已更新");
    } else {
      await contactApi.create(payload);
      toast.success("联系人已创建");
    }
    setOpen(false);
    reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await contactApi.remove(deletingId);
    toast.success("联系人已删除");
    setDeletingId(null);
    reload();
  };

  const ownerName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";
  const currentCustomer = customers.find((c) => c.id === customerIdParam);

  return (
    <>
      <PageHeader
        title="联系人管理"
        meta="CONTACT DIRECTORY"
        subtitle={currentCustomer ? `当前客户：${currentCustomer.name}` : "客户联系人统一管理，一个客户可关联多个联系人。"}
        actions={
          <>
            {customerIdParam !== "all" && (
              <Button variant="outline" size="sm" onClick={() => { setSearchParams({}); setFilter({ customerId: "all" }); }}>
                查看全部
              </Button>
            )}
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增联系人</Button>
          </>
        }
      />

      <DataPanel
        title="联系人列表"
        subtitle={`Contacts · ${data.total} records`}
        accent="cobalt"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                placeholder="搜索姓名/手机/客户"
                className="pl-9 h-9 w-60 text-xs rounded-full"
                onChange={(e) => setFilter({ keyword: e.target.value })}
              />
            </div>
            <Select
              value={(query.customerId as string) ?? "all"}
              onValueChange={(v) => {
                if (v === "all") setSearchParams({});
                else setSearchParams({ customerId: v });
                setFilter({ customerId: v });
              }}
            >
              <SelectTrigger className="h-9 w-48 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部客户</SelectItem>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
                <th>姓名</th>
                <th>所属客户</th>
                <th>职位</th>
                <th>手机号</th>
                <th>邮箱</th>
                <th>负责人</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={8} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={8} className="empty">暂无联系人</td></tr>
              )}
              {data.list.map((c) => (
                <tr key={c.id} className="clickable" onDoubleClick={() => openEdit(c)} title="双击查看详情">
                  <td className="mono">{c.code}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-mustard/30 text-foreground flex items-center justify-center font-display font-black text-sm shrink-0">
                        {c.name.slice(0, 1)}
                      </div>
                      <div className="font-semibold flex items-center gap-1.5">
                        {c.name}
                        {c.isPrimary && (
                          <span title="首要联系人" className="inline-flex items-center text-tomato">
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-foreground/75">{c.customerName}</td>
                  <td className="text-foreground/70">{c.position || "—"}</td>
                  <td className="mono">{c.phone}</td>
                  <td className="text-foreground/65 text-[12px]">{c.email || "—"}</td>
                  <td className="text-foreground/70">{ownerName(c.ownerId)}</td>
                  <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
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
              ))}
            </tbody>
            {data.list.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={8} className="label">
                    本页 {data.list.length} 位 · 共 {data.total} 位 · 首要联系人 {data.list.filter((c) => c.isPrimary).length}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <PaginationBar
          page={query.page!}
          pageSize={query.pageSize!}
          total={data.total}
          onPageChange={setPage}
        />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑联系人" : "新增联系人"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            <GroupTitle>基础信息</GroupTitle>
            <Field label="客户" required span={12}>
              <div className="flex items-center gap-2 max-w-md">
                <div className="flex-1 min-w-0">
                  <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v)}>
                    <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-10"
                  onClick={goCreateCustomer}
                  title="找不到客户？去新增"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />新增客户
                </Button>
              </div>
            </Field>
            <Field label="联系人姓名" required><Input {...register("name", { required: true })} /></Field>
            <Field label="手机号" required><Input {...register("phone", { required: true })} /></Field>
            <Field label="职位"><Input {...register("position")} /></Field>

            <GroupTitle>联系信息</GroupTitle>
            <Field label="邮箱"><Input {...register("email")} /></Field>
            <Field label="地址"><Input {...register("address")} /></Field>
            <Field label="生日"><Input type="date" {...register("birthday")} /></Field>

            <GroupTitle>业务信息</GroupTitle>
            <Field label="销售负责人">
              <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue placeholder="选择销售负责人" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="首要联系人">
              <div className="h-10 flex items-center">
                <Switch checked={watch("isPrimary")} onCheckedChange={(v) => setValue("isPrimary", v)} />
                <span className="ml-2 text-xs text-foreground/60">设为该客户的首要联系人</span>
              </div>
            </Field>

            <GroupTitle>其他信息</GroupTitle>
            <Field label="备注" span={12}><Textarea rows={3} {...register("remark")} /></Field>
            <Field label="附件" span={12}>
              <AttachmentField singleValue={watch("attachment") || ""} onSingleChange={(v) => setValue("attachment", v)} hint="名片 / 合同 / 资质等" />
            </Field>

            <GroupTitle>系统信息</GroupTitle>
            <Field label="联系人编号"><Input {...register("code")} /></Field>
            <Field label="客户名称"><Input value={watch("customerName")} disabled /></Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建联系人"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除联系人"
        description="删除后无法恢复。"
        onConfirm={onDelete}
      />
    </>
  );
}
