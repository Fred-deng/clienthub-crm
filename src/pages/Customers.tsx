import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Download, Users as UsersIcon, Star, ArrowLeft, ClipboardList, Phone, MapPin, MessageCircle, Mail, MessageSquare, MoreHorizontal } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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
import { customerApi, contactApi, followUpApi, employeeApi, salesApi, productApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, customerStageLabel, customerStatusLabel, customerStatusTone, deriveCustomerStage } from "@/lib/format";
import type { Customer, Contact, FollowUp, Employee, SalesOrder, Product } from "@/types";
import { useEffect, ReactNode } from "react";

const emptyCustomer: Omit<Customer, "id"> = {
  code: "", name: "", taxNo: "", status: "potential", region: "",
  stage: "lead", level: "B",
  contact: "", phone: "", email: "",
  registeredAddress: "", businessScope: "", address: "",
  legalPerson: "", companyNature: "民营", industry: "",
  registeredAt: "", registeredCapital: 0, paidInCapital: 0,
  scale: "", insuredCount: 0,
  firstCooperationAt: "", cooperationProducts: "",
  ownerId: "u3",
  category: "潜在客户", source: "电话开发", seaStatus: "私海",
  lastVisitAt: "", nextVisitAt: "",
  invoiceInfo: "", introducer: "",
  totalAmount: 0, receivable: 0,
  createdAt: new Date().toISOString().slice(0, 10), remark: "",
};

// —— 分组小标题（参考截图：深色 chip + 长分割线） ——
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
  const spanClass: Record<number, string> = {
    3: "col-span-12 md:col-span-6 lg:col-span-3",
    4: "col-span-12 md:col-span-6 lg:col-span-4",
    6: "col-span-12 md:col-span-6",
    12: "col-span-12",
  };
  return (
    <div className={spanClass[span] || spanClass[4]}>
      <Label className="text-xs text-foreground/70 mb-1.5 block">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function Customers() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(customerApi.list);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customerContacts, setCustomerContacts] = useState<Contact[]>([]);
  const [customerFollowUps, setCustomerFollowUps] = useState<FollowUp[]>([]);
  // 新增客户时暂存（提交客户后批量写入）
  const [draftContacts, setDraftContacts] = useState<Omit<Contact, "id">[]>([]);
  const [draftFollowUps, setDraftFollowUps] = useState<Omit<FollowUp, "id">[]>([]);
  const [miniContactOpen, setMiniContactOpen] = useState(false);
  const [miniFollowUpOpen, setMiniFollowUpOpen] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { employeeApi.all().then(setEmployees); }, []);


  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Customer, "id">>({ defaultValues: emptyCustomer });

  const openCreate = () => {
    reset({ ...emptyCustomer, code: `CUS-${Date.now().toString().slice(-6)}` });
    setEditing(null);
    setCustomerContacts([]);
    setCustomerFollowUps([]);
    setDraftContacts([]);
    setDraftFollowUps([]);
    setOpen(true);
  };
  const openEdit = async (c: Customer) => {
    reset({ ...emptyCustomer, ...c });
    setEditing(c);
    setOpen(true);
    const [cl, fl] = await Promise.all([
      contactApi.list({ customerId: c.id, pageSize: 100 }),
      followUpApi.list({ customerId: c.id, pageSize: 100 }),
    ]);
    setCustomerContacts(cl.list);
    setCustomerFollowUps(fl.list);
  };

  // —— 跨页流程：从「联系人」过来新增客户 ——
  useEffect(() => {
    if (searchParams.get("createNew") === "1") {
      openCreate();
      // 不立即移除 createNew，留待保存时根据 returnTo 跳转
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = handleSubmit(async (raw) => {
    // 自动从「客户状态」推导阶段（潜在/意向 = lead，否则 formal）
    const values = { ...raw, stage: deriveCustomerStage(raw.status) } as Omit<Customer, "id">;
    if (editing) {
      await customerApi.update(editing.id, values);
      toast.success("客户已更新");
      setOpen(false);
      reload();
    } else {
      const created = await customerApi.create(values);
      // 批量写入草稿子记录
      if (draftContacts.length) {
        await Promise.all(draftContacts.map((c) =>
          contactApi.create({ ...c, customerId: created.id, customerName: created.name })
        ));
      }
      if (draftFollowUps.length) {
        await Promise.all(draftFollowUps.map((f) =>
          followUpApi.create({ ...f, customerId: created.id, customerName: created.name, customerStatus: created.status })
        ));
      }
      toast.success(`客户已创建${draftContacts.length ? `，含 ${draftContacts.length} 位联系人` : ""}${draftFollowUps.length ? `，含 ${draftFollowUps.length} 条跟进` : ""}`);
      setOpen(false);
      reload();
      // 如果是从联系人页跳转过来的，回跳并带上新建的客户ID
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        const sep = returnTo.includes("?") ? "&" : "?";
        navigate(`${returnTo}${sep}newCustomerId=${created.id}`);
      }
    }
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await customerApi.remove(deletingId);
    toast.success("客户已删除");
    setDeletingId(null);
    reload();
  };

  const ownerName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";

  const reloadCustomerContacts = async () => {
    if (!editing) return;
    const list = await contactApi.list({ customerId: editing.id, pageSize: 100 });
    setCustomerContacts(list.list);
  };
  const reloadCustomerFollowUps = async () => {
    if (!editing) return;
    const list = await followUpApi.list({ customerId: editing.id, pageSize: 100 });
    setCustomerFollowUps(list.list);
  };

  const wayIcon: Record<string, any> = {
    "电话": Phone, "拜访": MapPin, "微信": MessageCircle, "邮件": Mail, "短信": MessageSquare, "其他": MoreHorizontal,
  };

  return (
    <>
      <PageHeader
        title="客户管理"
        meta="CUSTOMER REGISTRY"
        subtitle="软件客户与硬件客户档案，区分潜在与正式客户。"
        actions={
          <>
            {searchParams.get("returnTo") && (
              <Button variant="outline" size="sm" onClick={() => navigate(searchParams.get("returnTo")!)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />返回联系人
              </Button>
            )}
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
            <Select value={query.status ?? "all"} onValueChange={(v) => setFilter({ status: v })}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(customerStatusLabel).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
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
                <th>状态</th>
                <th>类别</th>
                <th>区域</th>
                <th>负责人</th>
                <th>联系人</th>
                <th>电话</th>
                <th className="num">应收</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={10} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={10} className="empty">暂无客户数据</td></tr>
              )}
              {data.list.map((c) => {
                return (
                  <tr key={c.id} className="clickable" onDoubleClick={() => openEdit(c)} title="双击查看详情">
                    <td className="mono">{c.code}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0 bg-foreground/10 text-foreground">
                          {c.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{c.name}</div>
                          <div className="text-[11px] text-foreground/45 truncate">{c.industry || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const tone = customerStatusTone[c.status || "potential"] || "muted";
                        const toneCls: Record<string, string> = {
                          leaf: "bg-leaf/15 text-leaf ring-leaf/25",
                          mustard: "bg-mustard/25 text-foreground ring-mustard/40",
                          tomato: "bg-tomato/15 text-tomato ring-tomato/25",
                          muted: "bg-foreground/5 text-foreground/70 ring-foreground/15",
                        };
                        return (
                          <span className={`cell-chip ring-1 ${toneCls[tone]}`}>
                            {customerStatusLabel[c.status || "potential"] || "—"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-foreground/70">{c.category || "—"}</td>
                    <td className="text-foreground/70">{c.region || "—"}</td>
                    <td className="text-foreground/70">{ownerName(c.ownerId)}</td>
                    <td>{c.contact}</td>
                    <td className="mono">{c.phone}</td>
                    <td className="num">{fmtMoney(c.receivable)}</td>
                    <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <Link to={`/contacts?customerId=${c.id}`} title="查看联系人" className="size-8 rounded-full hover:bg-cobalt/10 text-foreground/55 hover:text-cobalt inline-flex items-center justify-center transition-colors">
                          <UsersIcon className="h-3.5 w-3.5" />
                        </Link>
                        <Link to={`/follow-ups?customerId=${c.id}`} title="查看跟进记录" className="size-8 rounded-full hover:bg-mustard/25 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors">
                          <ClipboardList className="h-3.5 w-3.5" />
                        </Link>
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
            {data.list.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={9} className="label">本页合计 · {data.list.length} 条 / 共 {data.total} 条</td>
                  <td className="num">{fmtMoney(data.list.reduce((s, c) => s + (c.receivable || 0), 0))}</td>
                  <td />
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

      {/* —— 客户表单（按业务字段分组） —— */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            {/* 基础信息 */}
            <GroupTitle>基础信息</GroupTitle>
            <Field label="客户全称" required><Input placeholder="请输入客户全称" {...register("name", { required: true })} /></Field>
            <Field label="客户编号"><Input placeholder="请输入客户编号" {...register("code", { required: true })} /></Field>
            <Field label="税号"><Input placeholder="请输入税号" {...register("taxNo")} /></Field>
            <Field label="客户状态">
              <Select value={watch("status") || ""} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(customerStatusLabel).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="归属区域"><Input placeholder="请输入归属区域" {...register("region")} /></Field>

            {/* 工商信息 */}
            <GroupTitle>工商信息</GroupTitle>
            <Field label="法定代表人"><Input placeholder="请输入法定代表人" {...register("legalPerson")} /></Field>
            <Field label="公司性质">
              <Select value={watch("companyNature") || ""} onValueChange={(v: any) => setValue("companyNature", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["国企","民营","外资","合资","上市公司","事业单位","其他"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="所属行业">
              <Select value={watch("industry") || ""} onValueChange={(v: any) => setValue("industry", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["制造业","能源","物流","金融","教育","医疗","政府","电力"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="注册时间"><Input type="date" {...register("registeredAt")} /></Field>
            <Field label="注册资金（万元）"><Input type="number" step="0.01" {...register("registeredCapital", { valueAsNumber: true })} /></Field>
            <Field label="实缴资金（万元）"><Input type="number" step="0.01" {...register("paidInCapital", { valueAsNumber: true })} /></Field>
            <Field label="客户规模"><Input placeholder="请输入客户规模" {...register("scale")} /></Field>
            <Field label="参保人数"><Input type="number" {...register("insuredCount", { valueAsNumber: true })} /></Field>
            <Field label="注册地址" span={6}><Input placeholder="请输入注册地址" {...register("registeredAddress")} /></Field>
            <Field label="通讯地址" span={6}><Input {...register("address")} /></Field>
            <Field label="经营范围" span={12}>
              <Textarea rows={2} placeholder="请输入经营范围" {...register("businessScope")} />
            </Field>

            {/* 合作信息 */}
            <GroupTitle>合作信息</GroupTitle>
            <Field label="首次合作时间"><Input type="date" {...register("firstCooperationAt")} /></Field>
            {/* 合作状态已合并至顶部「客户状态」，此处不再单独展示 */}
            <Field label="合作产品/服务"><Input placeholder="请输入合作产品/服务" {...register("cooperationProducts")} /></Field>
            <Field label="销售负责人">
              <Select value={watch("ownerId")} onValueChange={(v: any) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue placeholder="选择销售负责人" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* 客户管理 */}
            <GroupTitle>客户管理</GroupTitle>
            <Field label="客户类别">
              <Select value={watch("category") || ""} onValueChange={(v: any) => setValue("category", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["战略客户","重点客户","普通客户","潜在客户"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="客户来源">
              <Select value={watch("source") || ""} onValueChange={(v: any) => setValue("source", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["电话开发","网络推广","客户介绍","展会","陌拜","其他"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="公海状态">
              <Select value={watch("seaStatus") || ""} onValueChange={(v: any) => setValue("seaStatus", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="私海">私海</SelectItem>
                  <SelectItem value="公海">公海</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="最近拜访时间"><Input type="date" {...register("lastVisitAt")} /></Field>
            <Field label="下次拜访日期"><Input type="date" {...register("nextVisitAt")} /></Field>
            <Field label="客户等级">
              <Select value={watch("level")} onValueChange={(v: any) => setValue("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A 重点</SelectItem>
                  <SelectItem value="B">B 普通</SelectItem>
                  <SelectItem value="C">C 一般</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* 其他信息 */}
            <GroupTitle>其他信息</GroupTitle>
            <Field label="开票信息" span={4}><Input placeholder="请输入开票信息" {...register("invoiceInfo")} /></Field>
            <Field label="介绍人" span={4}><Input placeholder="请输入介绍人" {...register("introducer")} /></Field>
            <Field label="备注" span={12}>
              <Textarea rows={2} placeholder="请输入备注信息" {...register("remark")} />
            </Field>

            {/* 客户联系人子表（仅编辑现有客户时显示） */}
            {/* 客户联系人子表（编辑：真实数据 / 新增：草稿） */}
            <GroupTitle>客户联系人</GroupTitle>
            <div className="col-span-12 rounded-xl border border-foreground/10 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-foreground/[0.03] border-b border-foreground/8">
                <div className="text-xs text-foreground/60">
                  共 <span className="font-bold text-foreground">{editing ? customerContacts.length : draftContacts.length}</span> 位联系人
                  {!editing && <span className="ml-2 text-foreground/40">（保存客户时一并创建）</span>}
                </div>
                <div className="flex items-center gap-2">
                  {editing && (
                    <Link
                      to={`/contacts?customerId=${editing.id}`}
                      className="text-[11px] text-cobalt hover:underline"
                    >
                      前往联系人页 →
                    </Link>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => setMiniContactOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />新增联系人
                  </Button>
                </div>
              </div>
              {(editing ? customerContacts.length : draftContacts.length) === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-foreground/45">暂无联系人，点击右上角新增。</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>职位</th>
                      <th>手机号</th>
                      <th>邮箱</th>
                      <th>负责人</th>
                      <th className="num">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editing ? customerContacts : draftContacts).map((ct, idx) => (
                      <tr key={(ct as any).id ?? `draft-${idx}`}>
                        <td>
                          <div className="flex items-center gap-1.5 font-semibold">
                            {ct.name}
                            {ct.isPrimary && <Star className="h-3 w-3 fill-tomato text-tomato" />}
                          </div>
                        </td>
                        <td className="text-foreground/70">{ct.position || "—"}</td>
                        <td className="mono">{ct.phone}</td>
                        <td className="text-foreground/65 text-[12px]">{ct.email || "—"}</td>
                        <td className="text-foreground/70">{ownerName(ct.ownerId)}</td>
                        <td className="num">
                          {editing ? (
                            <Link
                              to={`/contacts?customerId=${editing.id}&editId=${(ct as any).id}`}
                              className="text-[11px] text-cobalt hover:underline"
                            >
                              编辑
                            </Link>
                          ) : (
                            <button
                              type="button"
                              className="text-[11px] text-tomato hover:underline"
                              onClick={() => setDraftContacts((arr) => arr.filter((_, i) => i !== idx))}
                            >
                              移除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <GroupTitle>跟进记录</GroupTitle>
            <div className="col-span-12 rounded-xl border border-foreground/10 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-foreground/[0.03] border-b border-foreground/8">
                <div className="text-xs text-foreground/60">
                  共 <span className="font-bold text-foreground">{editing ? customerFollowUps.length : draftFollowUps.length}</span> 条跟进
                  {!editing && <span className="ml-2 text-foreground/40">（保存客户时一并创建）</span>}
                </div>
                <div className="flex items-center gap-2">
                  {editing && (
                    <Link
                      to={`/follow-ups?customerId=${editing.id}`}
                      className="text-[11px] text-cobalt hover:underline"
                    >
                      前往跟进记录页 →
                    </Link>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => setMiniFollowUpOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />新增跟进
                  </Button>
                </div>
              </div>
              {(editing ? customerFollowUps.length : draftFollowUps.length) === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-foreground/45">暂无跟进记录，点击右上角新增。</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>主题</th>
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
                    {(editing ? customerFollowUps : draftFollowUps).map((f, idx) => {
                      const Icon = wayIcon[f.contactWay] ?? MoreHorizontal;
                      return (
                        <tr key={(f as any).id ?? `draft-${idx}`}>
                          <td>
                            <div className="font-semibold">{f.subject}</div>
                            <div className="text-[11px] text-foreground/45 truncate max-w-[260px]">{f.content}</div>
                          </td>
                          <td>
                            <span className="cell-chip bg-foreground/5 text-foreground/75 ring-1 ring-foreground/10 inline-flex items-center gap-1">
                              <Icon className="h-3 w-3" />{f.contactWay}
                            </span>
                          </td>
                          <td className="text-foreground/70">{f.oppStatus || "—"}</td>
                          <td className="mono text-[12px]">{f.contactDate}</td>
                          <td className="mono text-[12px] text-foreground/65">{f.nextVisitAt || "—"}</td>
                          <td className="num">{f.expectedAmount ? fmtMoney(f.expectedAmount) : "—"}</td>
                          <td className="text-foreground/70">{ownerName(f.ownerId)}</td>
                          <td className="num">
                            {editing ? (
                              <Link
                                to={`/follow-ups?customerId=${editing.id}&editId=${(f as any).id}`}
                                className="text-[11px] text-cobalt hover:underline"
                              >
                                编辑
                              </Link>
                            ) : (
                              <button
                                type="button"
                                className="text-[11px] text-tomato hover:underline"
                                onClick={() => setDraftFollowUps((arr) => arr.filter((_, i) => i !== idx))}
                              >
                                移除
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建客户"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 在客户编辑窗口内快速新增联系人（新增模式则加入草稿） */}
      <MiniContactDialog
        open={miniContactOpen}
        onOpenChange={setMiniContactOpen}
        customer={editing ?? {
          id: "", name: watch("name") || "（未保存客户）",
          ownerId: watch("ownerId") || "u3",
        } as Customer}
        employees={employees}
        onCreated={editing ? reloadCustomerContacts : undefined}
        onDraft={editing ? undefined : (draft) => setDraftContacts((arr) => [...arr, draft])}
      />

      <MiniFollowUpDialog
        open={miniFollowUpOpen}
        onOpenChange={setMiniFollowUpOpen}
        customer={editing ?? {
          id: "", name: watch("name") || "（未保存客户）",
          status: watch("status") || "potential",
          ownerId: watch("ownerId") || "u3",
        } as Customer}
        contacts={editing ? customerContacts : (draftContacts as unknown as Contact[])}
        employees={employees}
        onCreated={editing ? reloadCustomerFollowUps : undefined}
        onDraft={editing ? undefined : (draft) => setDraftFollowUps((arr) => [...arr, draft])}
      />


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

// —— 客户详情内：快速新增联系人对话框 ——
function MiniContactDialog({
  open, onOpenChange, customer, employees, onCreated, onDraft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer;
  employees: Employee[];
  onCreated?: () => void;
  onDraft?: (draft: Omit<Contact, "id">) => void;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Contact, "id">>({
    defaultValues: {
      code: "", customerId: customer.id, customerName: customer.name,
      name: "", phone: "", position: "", email: "", address: "", birthday: "",
      ownerId: customer.ownerId || "u3", isPrimary: false, remark: "", attachment: "",
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: `LXR-${Date.now().toString().slice(-6)}`,
        customerId: customer.id, customerName: customer.name,
        name: "", phone: "", position: "", email: "", address: "", birthday: "",
        ownerId: customer.ownerId || "u3", isPrimary: false, remark: "", attachment: "",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, customer.id, customer.name, customer.ownerId, reset]);

  const submit = handleSubmit(async (values) => {
    if (onDraft) {
      onDraft({ ...values, customerId: customer.id, customerName: customer.name });
      toast.success("已加入草稿，将在保存客户时一起创建");
    } else {
      await contactApi.create({ ...values, customerId: customer.id, customerName: customer.name });
      toast.success("联系人已新增");
      onCreated?.();
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增联系人 · {customer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
          <Field label="姓名" required><Input {...register("name", { required: true })} /></Field>
          <Field label="手机号" required><Input {...register("phone", { required: true })} /></Field>
          <Field label="职位"><Input {...register("position")} /></Field>
          <Field label="邮箱"><Input {...register("email")} /></Field>
          <Field label="生日"><Input type="date" {...register("birthday")} /></Field>
          <Field label="销售负责人">
            <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="首要联系人" span={6}>
            <div className="h-10 flex items-center">
              <Switch checked={watch("isPrimary")} onCheckedChange={(v) => setValue("isPrimary", v)} />
              <span className="ml-2 text-xs text-foreground/60">设为该客户首要联系人</span>
            </div>
          </Field>
          <Field label="地址" span={6}><Input {...register("address")} /></Field>
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

// —— 客户详情内：快速新增跟进记录对话框 ——
function MiniFollowUpDialog({
  open, onOpenChange, customer, contacts, employees, onCreated, onDraft,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer;
  contacts: Contact[];
  employees: Employee[];
  onCreated?: () => void;
  onDraft?: (draft: Omit<FollowUp, "id">) => void;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<FollowUp, "id">>({
    defaultValues: {
      code: "", customerId: customer.id, customerName: customer.name, customerStatus: customer.status,
      contactId: "", contactName: "",
      ownerId: customer.ownerId || "u3",
      subject: "", content: "",
      contactWay: "电话", salesLead: "", oppStatus: "意向初探",
      contactDate: new Date().toISOString().slice(0, 10),
      nextVisitAt: "", intentProduct: "", expectedAmount: 0, expectedSignAt: "",
      attachment: "", remark: "",
      createdAt: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        code: `GJ-${Date.now().toString().slice(-6)}`,
        customerId: customer.id, customerName: customer.name, customerStatus: customer.status,
        contactId: "", contactName: "",
        ownerId: customer.ownerId || "u3",
        subject: "", content: "",
        contactWay: "电话", salesLead: "", oppStatus: "意向初探",
        contactDate: new Date().toISOString().slice(0, 10),
        nextVisitAt: "", intentProduct: "", expectedAmount: 0, expectedSignAt: "",
        attachment: "", remark: "",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, customer.id, customer.name, customer.ownerId, customer.status, reset]);

  const submit = handleSubmit(async (values) => {
    const ct = contacts.find((x) => x.id === values.contactId);
    const payload = {
      ...values,
      customerId: customer.id,
      customerName: customer.name,
      customerStatus: customer.status,
      contactName: ct?.name ?? "",
    };
    if (onDraft) {
      onDraft(payload);
      toast.success("已加入草稿，将在保存客户时一起创建");
    } else {
      await followUpApi.create(payload);
      toast.success("跟进记录已新增");
      onCreated?.();
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增跟进记录 · {customer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
          <Field label="主题" required span={6}>
            <Input placeholder="本次跟进主题" {...register("subject", { required: true })} />
          </Field>
          <Field label="联系形式" required>
            <Select value={watch("contactWay")} onValueChange={(v: any) => setValue("contactWay", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["电话","拜访","微信","邮件","短信","其他"].map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="联系日期" required><Input type="date" {...register("contactDate", { required: true })} /></Field>

          <Field label="联系人">
            <Select value={watch("contactId") || ""} onValueChange={(v) => setValue("contactId", v)}>
              <SelectTrigger><SelectValue placeholder={contacts.length ? "请选择" : "暂无联系人"} /></SelectTrigger>
              <SelectContent>
                {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}（{c.position || "联系人"}）</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="商机状态">
            <Select value={watch("oppStatus") || ""} onValueChange={(v: any) => setValue("oppStatus", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["意向初探","需求确认","方案沟通","报价中","商务谈判","已签约","已流失"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

          <Field label="跟进记录" required span={12}>
            <Textarea rows={3} placeholder="请详细记录本次沟通内容" {...register("content", { required: true })} />
          </Field>

          <Field label="意向产品"><Input {...register("intentProduct")} /></Field>
          <Field label="预计金额（元）"><Input type="number" step="0.01" {...register("expectedAmount", { valueAsNumber: true })} /></Field>
          <Field label="下次回访日期"><Input type="date" {...register("nextVisitAt")} /></Field>

          <Field label="销售线索"><Input {...register("salesLead")} /></Field>
          <Field label="预计签单时间"><Input type="date" {...register("expectedSignAt")} /></Field>
          <Field label="跟进编号"><Input {...register("code")} /></Field>

          <Field label="备注" span={12}><Textarea rows={2} {...register("remark")} /></Field>

          <DialogFooter className="col-span-12 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit">创建跟进</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
