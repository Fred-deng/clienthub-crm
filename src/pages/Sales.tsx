import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LineItemsEditor, LineItem } from "@/components/common/LineItemsEditor";
import { InvoiceList, InvoiceRecord } from "@/components/common/InvoiceList";
import { AttachmentField } from "@/components/common/AttachmentField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salesApi, customerApi, productApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import { splitSales, bizLabel, bizTone, type BizFilter } from "@/lib/biz";
import { BizTabs } from "@/components/common/BizTabs";
import type { SalesOrder, Customer, Product, Employee } from "@/types";

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

type FormValues = {
  customerId: string;
  contractTitle: string;
  code: string;
  contractExpireDate: string;
  contractAmount: number;
  salesMode: string;
  contractProperty: string;
  taxNo: string;
  applicantId: string;
  department: string;
  appliedAt: string;
  signedAt: string;
  contractExpireAt: string;
  accountManagerId: string;
  assistantIds: string[];
  isSettled: boolean;
  isPartyA: boolean;
  serviceFee: number;
  outsourceFee: number;
  salesFee: number;
  productStdCost: number;
  contractAttachments: string[];
  stampedContractAttachments: string[];
  licenseAttachments: string[];
  invoiceAttachments: string[];
  otherAttachments: string[];
  invoices: InvoiceRecord[];
  status: string;
  ownerId: string;
  createdAt: string;
  received: number;
  remark: string;
};

const newCode = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `XSHT${ymd}${Math.floor(Math.random() * 90 + 10)}`;
};

export default function Sales() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(salesApi.list);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizFilter>("all");

  useEffect(() => {
    customerApi.all().then((cs) => setCustomers(cs.filter((c) => c.stage === "formal")));
    productApi.all().then(setProducts);
    employeeApi.all().then(setEmployees);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      customerId: "", contractTitle: "", code: newCode(), contractExpireDate: "", contractAmount: 0,
      salesMode: "普通销售", contractProperty: "新签", taxNo: "",
      applicantId: "", department: "", appliedAt: "",
      signedAt: "", contractExpireAt: "", accountManagerId: "", assistantIds: [],
      isSettled: false, isPartyA: false,
      serviceFee: 0, outsourceFee: 0, salesFee: 0, productStdCost: 0,
      contractAttachments: [], stampedContractAttachments: [], licenseAttachments: [], invoiceAttachments: [], otherAttachments: [], invoices: [],
      status: "pending", ownerId: "u3", createdAt: new Date().toISOString().slice(0, 10), received: 0, remark: "",
    },
  });

  const openCreate = () => {
    reset({
      customerId: customers[0]?.id ?? "", contractTitle: "", code: newCode(), contractExpireDate: "", contractAmount: 0,
      salesMode: "普通销售", contractProperty: "新签", taxNo: customers[0]?.taxNo ?? "",
      applicantId: "u3", department: "销售一部", appliedAt: new Date().toISOString().slice(0, 10),
      signedAt: "", contractExpireAt: "", accountManagerId: "u3", assistantIds: [],
      isSettled: false, isPartyA: false,
      serviceFee: 0, outsourceFee: 0, salesFee: 0, productStdCost: 0,
      contractAttachments: [], stampedContractAttachments: [], licenseAttachments: [], invoiceAttachments: [], otherAttachments: [], invoices: [],
      status: "pending", ownerId: "u3", createdAt: new Date().toISOString().slice(0, 10), received: 0, remark: "",
    });
    setItems([]); setEditing(null); setOpen(true);
  };
  const openEdit = (o: SalesOrder) => {
    reset({
      customerId: o.customerId, contractTitle: o.contractTitle ?? "", code: o.code,
      contractExpireDate: o.contractExpireDate ?? "", contractAmount: o.contractAmount ?? 0,
      salesMode: o.salesMode ?? "普通销售", contractProperty: o.contractProperty ?? "新签", taxNo: o.taxNo ?? "",
      applicantId: o.applicantId ?? "", department: o.department ?? "", appliedAt: o.appliedAt ?? "",
      signedAt: o.signedAt ?? "", contractExpireAt: o.contractExpireAt ?? "",
      accountManagerId: o.accountManagerId ?? o.ownerId, assistantIds: o.assistantIds ?? [],
      isSettled: !!o.isSettled, isPartyA: !!o.isPartyA,
      serviceFee: o.serviceFee ?? 0, outsourceFee: o.outsourceFee ?? 0, salesFee: o.salesFee ?? 0, productStdCost: o.productStdCost ?? 0,
      contractAttachments: o.contractAttachments ?? [], stampedContractAttachments: o.stampedContractAttachments ?? [],
      licenseAttachments: o.licenseAttachments ?? [], invoiceAttachments: o.invoiceAttachments ?? [], otherAttachments: o.otherAttachments ?? [], invoices: o.invoices ?? [],
      status: o.status, ownerId: o.ownerId, createdAt: o.createdAt, received: o.received, remark: o.remark ?? "",
    });
    setItems(o.items); setEditing(o); setOpen(true);
  };

  const onSubmit = handleSubmit(async (v) => {
    const cus = customers.find((c) => c.id === v.customerId);
    if (!cus) { toast.error("请选择客户"); return; }
    const totalAmount = items.reduce((s, it) => s + it.qty * it.price, 0);
    const payload: any = {
      ...v,
      customerName: cus.name,
      items,
      totalAmount,
      contractAmount: Number(v.contractAmount) || totalAmount,
      received: Number(v.received) || 0,
      serviceFee: Number(v.serviceFee) || 0,
      outsourceFee: Number(v.outsourceFee) || 0,
      salesFee: Number(v.salesFee) || 0,
      productStdCost: Number(v.productStdCost) || 0,
    };
    if (editing) await salesApi.update(editing.id, payload); else await salesApi.create(payload);
    toast.success("已保存"); setOpen(false); reload();
  });

  const assistantIds = watch("assistantIds") || [];
  const toggleAssistant = (id: string) => {
    if (assistantIds.includes(id)) setValue("assistantIds", assistantIds.filter((x) => x !== id));
    else setValue("assistantIds", [...assistantIds, id]);
  };

  return (
    <>
      <PageHeader
        title="销售订单"
        meta="SALES PIPELINE"
        subtitle="销售合同 / 订单：从签约、申请、结算到交付的全流程档案。"
        actions={<><BizTabs value={biz} onChange={setBiz} /><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新建销售合同</Button></>}
      />
      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">合同列表</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索合同号/客户" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
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
              <tr>
                <th>合同编号</th>
                <th>合同名称</th>
                <th>客户</th>
                <th>业务</th>
                <th>属性</th>
                <th>状态</th>
                <th className="num">合同金额</th>
                <th className="num">已回款</th>
                <th className="num">已开票</th>
                <th>客户经理</th>
                <th>签订日</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={12} className="empty">加载中…</td></tr>}
              {data.list
                .map((o) => ({ o, split: splitSales(o, products) }))
                .filter(({ split }) => biz === "all" || (biz === "software" ? split.software > 0 : split.hardware > 0))
                .map(({ o, split }) => {
                const owner = employees.find((e) => e.id === (o.accountManagerId || o.ownerId));
                return (
                  <tr key={o.id} className="clickable" onDoubleClick={() => openEdit(o)} title="双击查看详情">
                    <td className="mono">{o.code}</td>
                    <td className="bold"><span className="block max-w-[200px] truncate">{o.contractTitle ?? "—"}</span></td>
                    <td><span className="block max-w-[180px] truncate">{o.customerName}</span></td>
                    <td><span className={"cell-chip " + bizTone[split.category]}>{bizLabel[split.category]}</span></td>
                    <td className="text-xs">{o.contractProperty ?? "—"}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num">{fmtMoney(o.contractAmount ?? o.totalAmount)}</td>
                    <td className={"num " + (o.received > 0 ? "!text-mint" : "!text-foreground/40")}>{fmtMoney(o.received)}</td>
                    <td className="num text-xs"><span className="mono">{(o.invoices?.length ?? 0)}</span> 张<div className="text-[10px] text-foreground/55 mono">{fmtMoney((o.invoices || []).reduce((s, r) => s + (r.amount || 0), 0))}</div></td>
                    <td className="text-xs">{owner?.name ?? "—"}</td>
                    <td className="mono">{o.signedAt ?? o.createdAt}</td>
                    <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <button className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(o.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.list.length > 0 && (() => {
              const sumContract = data.list.reduce((s, o) => s + (o.contractAmount ?? o.totalAmount), 0);
              const sumReceived = data.list.reduce((s, o) => s + o.received, 0);
              const sumInvoice = data.list.reduce((s, o) => s + (o.invoices || []).reduce((a, r) => a + (r.amount || 0), 0), 0);
              return (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="label">本页 {data.list.length} 单 / 共 {data.total} 单 · 合计</td>
                    <td className="num">{fmtMoney(sumContract)}</td>
                    <td className="num text-mint">{fmtMoney(sumReceived)}</td>
                    <td className="num text-cobalt">{fmtMoney(sumInvoice)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑销售合同" : "新建销售合同"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3">
            <GroupTitle>基础信息</GroupTitle>
            <Field label="客户名称" required span={4}>
              <Select value={watch("customerId")} onValueChange={(v) => {
                setValue("customerId", v);
                const c = customers.find((x) => x.id === v);
                if (c) setValue("taxNo", c.taxNo ?? "");
              }}>
                <SelectTrigger><SelectValue placeholder="选择关联客户" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="合同名称" required span={4}><Input {...register("contractTitle")} placeholder="请输入合同名称" /></Field>
            <Field label="合同编号" span={4}><Input {...register("code")} /></Field>
            <Field label="销售方式" required span={3}>
              <Select value={watch("salesMode")} onValueChange={(v) => setValue("salesMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通销售">普通销售</SelectItem>
                  <SelectItem value="渠道销售">渠道销售</SelectItem>
                  <SelectItem value="项目销售">项目销售</SelectItem>
                  <SelectItem value="服务销售">服务销售</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="合同属性" required span={3}>
              <Select value={watch("contractProperty")} onValueChange={(v) => setValue("contractProperty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="新签">新签</SelectItem>
                  <SelectItem value="续签">续签</SelectItem>
                  <SelectItem value="升级">升级</SelectItem>
                  <SelectItem value="补充">补充</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="统一社会信用代码" span={4}><Input {...register("taxNo")} /></Field>

            <GroupTitle>申请与组织</GroupTitle>
            <Field label="申请人" span={4}>
              <Select value={watch("applicantId")} onValueChange={(v) => setValue("applicantId", v)}>
                <SelectTrigger><SelectValue placeholder="选择申请人" /></SelectTrigger>
                <SelectContent>{employees.filter((e) => e.role !== "管理员").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="所属部门" required span={4}>
              <Select value={watch("department")} onValueChange={(v) => setValue("department", v)}>
                <SelectTrigger><SelectValue placeholder="选择所属部门" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="销售一部">销售一部</SelectItem>
                  <SelectItem value="销售二部">销售二部</SelectItem>
                  <SelectItem value="大客户部">大客户部</SelectItem>
                  <SelectItem value="项目部">项目部</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="申请日期" span={4}><Input type="date" {...register("appliedAt")} /></Field>

            <GroupTitle>签约与结算</GroupTitle>
            <Field label="合同签订日" span={3}><Input type="date" {...register("signedAt")} /></Field>
            <Field label="合同到期日" span={3}><Input type="date" {...register("contractExpireAt")} /></Field>
            <Field label="客户经理" span={3}>
              <Select value={watch("accountManagerId")} onValueChange={(v) => { setValue("accountManagerId", v); setValue("ownerId", v); }}>
                <SelectTrigger><SelectValue placeholder="选择客户经理" /></SelectTrigger>
                <SelectContent>{employees.filter((e) => e.role !== "管理员").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="协助人" span={3}>
              <div className="min-h-9 border border-input rounded-md px-2 py-1 flex items-center flex-wrap gap-1">
                {assistantIds.length === 0 && <span className="text-xs text-muted-foreground px-1">选择协助人</span>}
                {assistantIds.map((id) => {
                  const e = employees.find((x) => x.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1 text-xs px-2 h-6 rounded bg-foreground/[0.06]">
                      {e?.name ?? id}
                      <button type="button" onClick={() => toggleAssistant(id)} className="text-foreground/50 hover:text-tomato"><X className="h-3 w-3" /></button>
                    </span>
                  );
                })}
                <Select value="" onValueChange={(v) => v && toggleAssistant(v)}>
                  <SelectTrigger className="h-6 w-20 border-0 px-1 text-xs"><SelectValue placeholder="+ 添加" /></SelectTrigger>
                  <SelectContent>
                    {employees.filter((e) => e.role !== "管理员" && !assistantIds.includes(e.id)).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
            <Field label="是否结算" span={6}>
              <div className="h-9 flex items-center"><Switch checked={watch("isSettled")} onCheckedChange={(v) => setValue("isSettled", v)} /></div>
            </Field>
            <Field label="是否甲方" span={6}>
              <div className="h-9 flex items-center"><Switch checked={watch("isPartyA")} onCheckedChange={(v) => setValue("isPartyA", v)} /></div>
            </Field>

            <GroupTitle>费用信息</GroupTitle>
            <Field label="约定服务费" span={3}><Input type="number" step="0.01" {...register("serviceFee", { valueAsNumber: true })} /></Field>
            <Field label="外包费用" span={3}><Input type="number" step="0.01" {...register("outsourceFee", { valueAsNumber: true })} /></Field>
            <Field label="销售费用" span={3}><Input type="number" step="0.01" {...register("salesFee", { valueAsNumber: true })} /></Field>
            <Field label="产品标准成本" span={3}><Input type="number" step="0.01" {...register("productStdCost", { valueAsNumber: true })} /></Field>

            <GroupTitle>销售明细</GroupTitle>
            <div className="col-span-12">
              <LineItemsEditor items={items} products={products} onChange={setItems} />
            </div>

            <GroupTitle>回款记录</GroupTitle>
            <div className="col-span-12">
              <PaymentSubList orderId={editing?.id} reloadKey={open} />
            </div>

            <GroupTitle>订单执行</GroupTitle>
            <Field label="订单状态" span={3}>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待发货</SelectItem>
                  <SelectItem value="shipped">运输中</SelectItem>
                  <SelectItem value="delivered">已送达</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="下单日" span={3}><Input type="date" {...register("createdAt")} /></Field>
            <Field label="已回款" span={3}><Input type="number" step="0.01" {...register("received", { valueAsNumber: true })} /></Field>
            <Field label="销售员" span={3}>
              <Select value={watch("ownerId")} onValueChange={(v) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{employees.filter((e) => e.role !== "管理员").map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>

            <GroupTitle>发票管理（开给客户）</GroupTitle>
            <div className="col-span-12">
              <InvoiceList direction="out" value={watch("invoices") || []} onChange={(v) => setValue("invoices", v)} />
            </div>

            <GroupTitle>附件与备注</GroupTitle>
            <Field label="合同附件" span={4}><AttachmentField value={watch("contractAttachments") || []} onChange={(v) => setValue("contractAttachments", v)} /></Field>
            <Field label="双方盖章合同扫描件" span={4}><AttachmentField value={watch("stampedContractAttachments") || []} onChange={(v) => setValue("stampedContractAttachments", v)} /></Field>
            <Field label="营业执照" span={4}><AttachmentField value={watch("licenseAttachments") || []} onChange={(v) => setValue("licenseAttachments", v)} /></Field>
            <Field label="开票资料" span={4}><AttachmentField value={watch("invoiceAttachments") || []} onChange={(v) => setValue("invoiceAttachments", v)} /></Field>
            <Field label="其他附件" span={4}><AttachmentField value={watch("otherAttachments") || []} onChange={(v) => setValue("otherAttachments", v)} /></Field>
            <Field label="备注" span={4}><Textarea rows={3} {...register("remark")} /></Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存" : "创建合同"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除合同" onConfirm={async () => {
        if (deletingId) { await salesApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
