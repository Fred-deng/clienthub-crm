import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, UserPlus, Phone, MapPin, MessageCircle, Mail, MessageSquare, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AttachmentField } from "@/components/common/AttachmentField";
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
import { followUpApi, customerApi, contactApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, customerStatusLabel } from "@/lib/format";
import type { FollowUp, Customer, Contact, Employee } from "@/types";

const empty: Omit<FollowUp, "id"> = {
  code: "", customerId: "", customerName: "", customerStatus: "",
  contactId: "", contactName: "",
  ownerId: "u3",
  subject: "", content: "",
  contactWay: "电话", salesLead: "", oppStatus: "意向初探",
  contactDate: new Date().toISOString().slice(0, 10),
  nextVisitAt: "",
  intentProduct: "", expectedAmount: 0, expectedSignAt: "",
  attachment: "", remark: "",
  createdAt: new Date().toISOString().slice(0, 10),
};

function GroupTitle({ children, tone = "tomato" }: { children: ReactNode; tone?: "tomato" | "mint" | "mustard" | "cobalt" }) {
  const toneMap: Record<string, string> = {
    tomato: "bg-tomato/15 text-tomato",
    mint: "bg-mint/30 text-foreground",
    mustard: "bg-mustard/25 text-foreground",
    cobalt: "bg-cobalt/15 text-cobalt",
  };
  return (
    <div className="col-span-12 flex items-center gap-3 mt-2 first:mt-0">
      <span className={"inline-flex items-center px-3 h-7 rounded-md text-xs font-semibold tracking-wide " + toneMap[tone]}>
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
    8: "col-span-12 md:col-span-8",
    12: "col-span-12",
  };
  return (
    <div className={m[span] || m[4]}>
      <Label className="text-xs text-foreground/70 mb-1.5 block">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

const wayIcon: Record<string, any> = {
  "电话": Phone, "拜访": MapPin, "微信": MessageCircle, "邮件": Mail, "短信": MessageSquare, "其他": MoreHorizontal,
};
const oppToneMap: Record<string, string> = {
  "意向初探": "bg-foreground/8 text-foreground/65",
  "需求确认": "bg-cobalt/12 text-cobalt",
  "方案沟通": "bg-cobalt/15 text-cobalt",
  "报价中": "bg-mustard/25 text-foreground",
  "商务谈判": "bg-mustard/35 text-foreground",
  "已签约": "bg-mint/40 text-foreground",
  "已流失": "bg-tomato/12 text-tomato",
};

const DRAFT_KEY = "followups:draftForm";

export default function FollowUps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const customerIdParam = searchParams.get("customerId") || "all";

  const { query, data, loading, reload, setFilter, setPage } = usePagedList(
    followUpApi.list,
    { customerId: customerIdParam }
  );
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contactsForCustomer, setContactsForCustomer] = useState<Contact[]>([]);

  useEffect(() => {
    customerApi.all().then(setCustomers);
    employeeApi.all().then(setEmployees);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<FollowUp, "id">>({ defaultValues: empty });

  const currentCustomerId = watch("customerId");

  // 加载该客户下的联系人
  useEffect(() => {
    if (!currentCustomerId) { setContactsForCustomer([]); return; }
    contactApi.list({ customerId: currentCustomerId, pageSize: 100 }).then((r) => setContactsForCustomer(r.list));
  }, [currentCustomerId]);

  const openCreate = () => {
    const cid = customerIdParam !== "all" ? customerIdParam : "";
    const c = customers.find((x) => x.id === cid);
    reset({
      ...empty,
      code: `GJ-${Date.now().toString().slice(-6)}`,
      customerId: cid,
      customerName: c?.name ?? "",
      customerStatus: c?.status ?? "",
      ownerId: c?.ownerId ?? "u3",
    });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (it: FollowUp) => {
    reset({ ...empty, ...it });
    setEditing(it);
    setOpen(true);
  };

  // 跨页流程：从客户页新增完客户后回跳 / 编辑指定记录 / 恢复未提交草稿
  useEffect(() => {
    if (customers.length === 0) return;

    const editId = searchParams.get("editId");
    const newCustomerId = searchParams.get("newCustomerId");
    const draftRaw = sessionStorage.getItem(DRAFT_KEY);

    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw) as Omit<FollowUp, "id">;
        const cid = newCustomerId || draft.customerId;
        const cust = customers.find((x) => x.id === cid);
        reset({ ...empty, ...draft, customerId: cid || "", customerName: cust?.name ?? draft.customerName, customerStatus: cust?.status ?? draft.customerStatus });
        setEditing(null);
        setOpen(true);
      } catch { /* ignore */ }
      sessionStorage.removeItem(DRAFT_KEY);
      const next = new URLSearchParams(searchParams);
      next.delete("newCustomerId");
      setSearchParams(next, { replace: true });
      return;
    }

    if (editId) {
      followUpApi.get(editId).then((it) => {
        if (it) { reset({ ...empty, ...it }); setEditing(it); setOpen(true); }
      });
      const next = new URLSearchParams(searchParams);
      next.delete("editId");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers]);

  const goCreateCustomer = () => {
    const draft = { ...empty, ...(editing ?? {}), ...(watch() as any) };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setOpen(false);
    const returnTo = `/follow-ups${customerIdParam !== "all" ? `?customerId=${customerIdParam}` : ""}`;
    navigate(`/customers?createNew=1&returnTo=${encodeURIComponent(returnTo)}`);
  };

  const onSubmit = handleSubmit(async (values) => {
    const c = customers.find((x) => x.id === values.customerId);
    const ct = contactsForCustomer.find((x) => x.id === values.contactId);
    const payload = {
      ...values,
      customerName: c?.name ?? values.customerName,
      customerStatus: c?.status ?? values.customerStatus,
      contactName: ct?.name ?? "",
    };
    if (editing) {
      await followUpApi.update(editing.id, payload);
      toast.success("跟进记录已更新");
    } else {
      await followUpApi.create(payload);
      toast.success("跟进记录已创建");
    }
    setOpen(false);
    reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await followUpApi.remove(deletingId);
    toast.success("跟进记录已删除");
    setDeletingId(null);
    reload();
  };

  const ownerName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";
  const currentCustomer = customers.find((c) => c.id === customerIdParam);

  return (
    <>
      <PageHeader
        title="客户跟进记录"
        meta="FOLLOW-UP LOG"
        subtitle={currentCustomer ? `当前客户：${currentCustomer.name}` : "记录销售人员对客户的每一次跟进，沉淀商机过程。"}
        actions={
          <>
            {customerIdParam !== "all" && (
              <Button variant="outline" size="sm" onClick={() => { setSearchParams({}); setFilter({ customerId: "all" }); }}>
                查看全部
              </Button>
            )}
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增跟进</Button>
          </>
        }
      />

      <DataPanel
        title="跟进记录列表"
        subtitle={`Follow-ups · ${data.total} records`}
        accent="mustard"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                placeholder="搜索主题/客户/内容"
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
            <Select value={(query.contactWay as string) ?? "all"} onValueChange={(v) => setFilter({ contactWay: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部形式</SelectItem>
                {Object.keys(wayIcon).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={(query.oppStatus as string) ?? "all"} onValueChange={(v) => setFilter({ oppStatus: v })}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部商机</SelectItem>
                {Object.keys(oppToneMap).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                <th>主题</th>
                <th>客户</th>
                <th>联系人</th>
                <th>形式</th>
                <th>商机状态</th>
                <th>联系日期</th>
                <th>下次回访</th>
                <th className="num">预计金额</th>
                <th>负责人</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={11} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={11} className="empty">暂无跟进记录</td></tr>
              )}
              {data.list.map((f) => {
                const Icon = wayIcon[f.contactWay] ?? MoreHorizontal;
                return (
                  <tr key={f.id} className="clickable" onDoubleClick={() => openEdit(f)} title="双击查看详情">
                    <td className="mono">{f.code}</td>
                    <td>
                      <div className="font-semibold text-foreground">{f.subject}</div>
                      <div className="text-[11px] text-foreground/45 truncate max-w-[260px]">{f.content}</div>
                    </td>
                    <td className="text-foreground/75">{f.customerName}</td>
                    <td className="text-foreground/70">{f.contactName || "—"}</td>
                    <td>
                      <span className="cell-chip bg-foreground/5 text-foreground/75 ring-1 ring-foreground/10 inline-flex items-center gap-1">
                        <Icon className="h-3 w-3" />{f.contactWay}
                      </span>
                    </td>
                    <td>
                      {f.oppStatus && (
                        <span className={"cell-chip ring-1 ring-foreground/8 " + (oppToneMap[f.oppStatus] || "bg-foreground/5 text-foreground/65")}>
                          {f.oppStatus}
                        </span>
                      )}
                    </td>
                    <td className="mono text-[12px]">{f.contactDate}</td>
                    <td className="mono text-[12px] text-foreground/65">{f.nextVisitAt || "—"}</td>
                    <td className="num">{f.expectedAmount ? fmtMoney(f.expectedAmount) : "—"}</td>
                    <td className="text-foreground/70">{ownerName(f.ownerId)}</td>
                    <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <button className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(f)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.list.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={8} className="label">本页 {data.list.length} 条 · 共 {data.total} 条 · 预计金额合计</td>
                  <td className="num">{fmtMoney(data.list.reduce((s, f) => s + (f.expectedAmount || 0), 0))}</td>
                  <td colSpan={2} />
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
          <DialogHeader><DialogTitle>{editing ? "编辑跟进记录" : "新增跟进记录"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            <GroupTitle tone="tomato">基本信息</GroupTitle>
            <Field label="客户名称" required span={12}>
              <div className="flex items-center gap-2 max-w-md">
                <div className="flex-1 min-w-0">
                  <Select value={watch("customerId")} onValueChange={(v) => {
                    setValue("customerId", v);
                    const c = customers.find((x) => x.id === v);
                    setValue("customerName", c?.name ?? "");
                    setValue("customerStatus", c?.status ?? "");
                    setValue("contactId", "");
                    setValue("contactName", "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="sm" className="shrink-0 h-10" onClick={goCreateCustomer}>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />新增客户
                </Button>
              </div>
            </Field>
            <Field label="客户状态">
              <Input value={customerStatusLabel[watch("customerStatus") || ""] || watch("customerStatus") || ""} disabled placeholder="跟随客户自动带出" />
            </Field>
            <Field label="联系人姓名">
              <Select value={watch("contactId") || ""} onValueChange={(v) => setValue("contactId", v)}>
                <SelectTrigger><SelectValue placeholder={contactsForCustomer.length ? "请选择" : "请先选择客户"} /></SelectTrigger>
                <SelectContent>
                  {contactsForCustomer.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}（{c.position || "联系人"}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="负责人">
              <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="主题" required span={12}>
              <Input placeholder="本次跟进主题" {...register("subject", { required: true })} />
            </Field>

            <GroupTitle tone="mint">跟进内容</GroupTitle>
            <Field label="跟进记录" required span={12}>
              <Textarea rows={4} placeholder="请详细记录本次沟通内容、客户反馈、下一步计划等" {...register("content", { required: true })} />
            </Field>
            <Field label="联系形式" required>
              <Select value={watch("contactWay")} onValueChange={(v: any) => setValue("contactWay", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {(["电话","拜访","微信","邮件","短信","其他"] as const).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="销售线索">
              <Input placeholder="如：官网、展会、介绍" {...register("salesLead")} />
            </Field>
            <Field label="商机状态">
              <Select value={watch("oppStatus") || ""} onValueChange={(v: any) => setValue("oppStatus", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(oppToneMap).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="联系日期" required><Input type="date" {...register("contactDate", { required: true })} /></Field>
            <Field label="下次回访日期"><Input type="date" {...register("nextVisitAt")} /></Field>
            <Field label="意向产品"><Input placeholder="意向产品 / 服务" {...register("intentProduct")} /></Field>
            <Field label="预计金额（元）"><Input type="number" step="0.01" {...register("expectedAmount", { valueAsNumber: true })} /></Field>
            <Field label="预计签单时间"><Input type="date" {...register("expectedSignAt")} /></Field>

            <GroupTitle tone="mustard">附件信息</GroupTitle>
            <Field label="备注" span={12}><Textarea rows={2} {...register("remark")} /></Field>
            <Field label="附件" span={12}>
              <AttachmentField singleValue={watch("attachment") || ""} onSingleChange={(v) => setValue("attachment", v)} hint="拜访照片 / 沟通纪要 / 报价单等" />
            </Field>

            <GroupTitle tone="cobalt">系统信息</GroupTitle>
            <Field label="跟进记录编号"><Input {...register("code")} /></Field>
            <Field label="客户名称"><Input value={watch("customerName")} disabled /></Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建记录"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除跟进记录"
        description="删除后无法恢复。"
        onConfirm={onDelete}
      />
    </>
  );
}
