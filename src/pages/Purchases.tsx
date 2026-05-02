import { useEffect, useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Paperclip, X, FileText, ArrowUpRight, Receipt, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LineItemsEditor, LineItem } from "@/components/common/LineItemsEditor";
import { InvoiceList, InvoiceRecord } from "@/components/common/InvoiceList";
import { PaymentSubList } from "@/components/common/PaymentSubList";
import { QuickPaymentDialog } from "@/components/common/QuickPaymentDialog";
import { QuickInvoiceDialog } from "@/components/common/QuickInvoiceDialog";
import { AttachmentField } from "@/components/common/AttachmentField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseApi, supplierApi, productApi, employeeApi, contractApi } from "@/services/api";
import { applyPurchaseReceive, revertPurchaseReceive, findOrCreateProductByName } from "@/services/inventory";
import { logOrderUpdate, logOrderDelete } from "@/services/orderLog";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { OrderLogDialog } from "@/components/common/OrderLogDialog";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import { splitPurchase, bizLabel, bizTone, type BizFilter } from "@/lib/biz";
import { BizTabs } from "@/components/common/BizTabs";
import { Checkbox } from "@/components/ui/checkbox";
import type { PurchaseOrder, Supplier, Product, Employee, Contract, PurchaseItem } from "@/types";

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
  applicantId: string;
  department: string;
  appliedAt: string;
  supplierId: string;
  contractTitle: string;
  signingParty: string;
  signedAt: string;
  contractExpireAt: string;
  contractAmount: number;
  linkedSalesContract: boolean;
  linkedSalesContractId: string;
  buyerId: string;
  contractAttachments: string[];
  invoiceAttachments: string[];
  invoices: InvoiceRecord[];
  status: PurchaseOrder["status"];
  paid: number;
  createdAt: string;
  expectedAt: string;
  remark: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm: FormValues = {
  applicantId: "u1", department: "集马科技", appliedAt: today(),
  supplierId: "", contractTitle: "", signingParty: "集马科技",
  signedAt: today(), contractExpireAt: "", contractAmount: 0,
  linkedSalesContract: false, linkedSalesContractId: "",
  buyerId: "", contractAttachments: [], invoiceAttachments: [], invoices: [],
  status: "draft", paid: 0, createdAt: today(), expectedAt: "", remark: "",
};

export default function Purchases() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(purchaseApi.list);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salesContracts, setSalesContracts] = useState<Contract[]>([]);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [draftScope, setDraftScope] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizFilter>("all");
  const [quickPay, setQuickPay] = useState<PurchaseOrder | null>(null);
  const [quickInv, setQuickInv] = useState<PurchaseOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<PurchaseOrder["status"] | "">("");
  const [logOpen, setLogOpen] = useState(false);
  const [logRefId, setLogRefId] = useState<string | undefined>(undefined);
  const [logRefCode, setLogRefCode] = useState<string | undefined>(undefined);
  const { current } = useCurrentUser();

  useEffect(() => {
    supplierApi.all().then(setSuppliers);
    productApi.all().then(setProducts);
    employeeApi.all().then(setEmployees);
    contractApi.all().then(setSalesContracts);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({ defaultValues: emptyForm });

  const openCreate = () => {
    reset({ ...emptyForm });
    setItems([]);
    setEditing(null);
    setDraftScope(`draft-pur-${Date.now().toString(36)}`);
    setOpen(true);
  };
  const openEdit = (o: PurchaseOrder) => {
    reset({
      applicantId: o.applicantId,
      department: o.department || "",
      appliedAt: o.appliedAt,
      supplierId: o.supplierId,
      contractTitle: o.contractTitle || "",
      signingParty: o.signingParty || "",
      signedAt: o.signedAt || "",
      contractExpireAt: o.contractExpireAt || "",
      contractAmount: o.contractAmount || 0,
      linkedSalesContract: !!o.linkedSalesContract,
      linkedSalesContractId: o.linkedSalesContractId || "",
      buyerId: o.buyerId || "",
      contractAttachments: o.contractAttachments || [],
      invoiceAttachments: o.invoiceAttachments || [],
      invoices: o.invoices || [],
      status: o.status,
      paid: o.paid,
      createdAt: o.createdAt,
      expectedAt: o.expectedAt,
      remark: o.remark || "",
    });
    setItems(o.items.map((it) => ({
      ...it,
      category: (it as any).category ?? (products.find((p) => p.id === it.productId)?.category ?? "other"),
    })));
    setEditing(o);
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (v) => {
    const sup = suppliers.find((s) => s.id === v.supplierId);
    // 1) 行明细：缺产品 → 自动建档；统一回填 productId / category
    const normalizedItems: PurchaseItem[] = items
      .filter((it) => it.productName.trim() && it.qty > 0)
      .map((it) => {
        let prodId = it.productId;
        let cat = it.category;
        if (!prodId) {
          const p = findOrCreateProductByName(it.productName, it.category, it.price, "采购订单");
          prodId = p.id;
          cat = p.category;
        }
        return { productId: prodId, productName: it.productName.trim(), category: cat, qty: it.qty, price: it.price };
      });
    const totalAmount = normalizedItems.reduce((s, it) => s + it.qty * it.price, 0);
    const payload: any = {
      ...v,
      contractAmount: Number(v.contractAmount) || 0,
      paid: Number(v.paid) || 0,
      supplierName: sup?.name ?? "-",
      items: normalizedItems,
      totalAmount,
      code: editing?.code ?? `CG-${Date.now().toString().slice(-6)}`,
    };

    // 2) 库存联动：状态切换涉及 received 时加减
    const op = current.name;
    const prevStatus = editing?.status;
    const nextStatus = payload.status as PurchaseOrder["status"];
    if (editing) {
      if (prevStatus === "received" && nextStatus !== "received") {
        revertPurchaseReceive(editing, op, "状态变更撤销入库");
      }
      if (nextStatus === "received" && prevStatus !== "received") {
        applyPurchaseReceive({ ...editing, ...payload }, op);
      }
      if (prevStatus === "received" && nextStatus === "received") {
        revertPurchaseReceive(editing, op, "明细变更回滚");
        applyPurchaseReceive({ ...editing, ...payload }, op);
      }
      // 写订单操作日志（仅修改）
      logOrderUpdate("purchase", editing, payload);
      await purchaseApi.update(editing.id, payload);
    } else {
      const created = await purchaseApi.create(payload);
      if (nextStatus === "received") applyPurchaseReceive(created, op);
    }
    toast.success("已保存");
    setOpen(false);
    reload();
    productApi.all().then(setProducts);
  });

  const handleDelete = async (id: string) => {
    const order = data.list.find((o) => o.id === id);
    if (order) {
      if (order.status === "received") revertPurchaseReceive(order, current.name, "订单删除回滚入库");
      logOrderDelete("purchase", order);
    }
    await purchaseApi.remove(id);
    toast.success("已删除");
    setDeletingId(null);
    reload();
    productApi.all().then(setProducts);
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    const op = current.name;
    for (const id of selectedIds) {
      const order = data.list.find((o) => o.id === id);
      if (!order || order.status === bulkStatus) continue;
      if (order.status === "received" && bulkStatus !== "received") {
        revertPurchaseReceive(order, op, "批量改状态回滚入库");
      }
      if (bulkStatus === "received" && order.status !== "received") {
        applyPurchaseReceive(order, op);
      }
      logOrderUpdate("purchase", order, { status: bulkStatus });
      await purchaseApi.update(id, { status: bulkStatus });
    }
    toast.success(`已将 ${selectedIds.length} 单更新为「${bulkStatus}」`);
    setSelectedIds([]);
    setBulkStatus("");
    reload();
    productApi.all().then(setProducts);
  };

  const empName = (id?: string) => employees.find((e) => e.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="采购订单"
        meta="PURCHASE ORDER"
        subtitle="采购合同与订单一体化管理：申请 → 签约 → 执行 → 入库。"
        actions={<>
          <BizTabs value={biz} onChange={setBiz} />
          <Button size="sm" variant="outline" onClick={() => { setLogRefId(undefined); setLogRefCode(undefined); setLogOpen(true); }}>
            <History className="h-4 w-4 mr-1.5" />全部日志
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新建采购订单</Button>
        </>}
      />
      <DataPanel
        title="采购订单列表"
        subtitle={`Purchase Orders · ${data.total} records`}
        accent="mustard"
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 h-9 rounded-full bg-warning/10 text-[12px]">
                <span className="text-warning font-semibold">已选 {selectedIds.length}</span>
                <Select value={bulkStatus} onValueChange={(v: any) => setBulkStatus(v)}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="改状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="ordered">已下单</SelectItem>
                    <SelectItem value="received">已入库</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-xs" disabled={!bulkStatus} onClick={applyBulkStatus}>应用</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds([])}>清空</Button>
              </div>
            )}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                placeholder="搜索单号 / 供应商 / 合同名"
                className="pl-9 h-9 w-60 text-xs rounded-full"
                onChange={(e) => setFilter({ keyword: e.target.value })}
              />
            </div>
            <Select value={query.status ?? "all"} onValueChange={(v) => setFilter({ status: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="ordered">已下单</SelectItem>
                <SelectItem value="received">已入库</SelectItem>
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
                <th className="w-10">
                  <Checkbox
                    checked={data.list.length > 0 && data.list.every((o) => selectedIds.includes(o.id))}
                    onCheckedChange={(v) => {
                      if (v) setSelectedIds(Array.from(new Set([...selectedIds, ...data.list.map((o) => o.id)])));
                      else setSelectedIds(selectedIds.filter((id) => !data.list.find((o) => o.id === id)));
                    }}
                  />
                </th>
                <th>单号</th>
                <th>合同/订单</th>
                <th>供应商</th>
                <th>业务</th>
                <th>状态</th>
                <th className="num">明细合计</th>
                <th className="num">已付</th>
                <th className="num">未付</th>
                <th className="num">发票</th>
                <th>申请人</th>
                <th>采购经理</th>
                <th>申请日期</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={14} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={14} className="empty">暂无采购订单</td></tr>
              )}
              {data.list
                .map((o) => ({ o, split: splitPurchase(o, products) }))
                .filter(({ split }) => biz === "all" || (biz === "software" ? split.software > 0 : split.hardware > 0))
                .map(({ o, split }) => {
                const unpaid = o.totalAmount - o.paid;
                const checked = selectedIds.includes(o.id);
                return (
                  <tr key={o.id} className="clickable" onDoubleClick={() => openEdit(o)} title="双击查看详情">
                    <td onDoubleClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => setSelectedIds(v ? [...selectedIds, o.id] : selectedIds.filter((x) => x !== o.id))}
                      />
                    </td>
                    <td className="mono">{o.code}</td>
                    <td>
                      <div className="font-semibold truncate max-w-[200px]">{o.contractTitle || "—"}</div>
                      <div className="text-[11px] text-foreground/45">签约：{o.signingParty || "—"}</div>
                    </td>
                    <td className="text-foreground/75">{o.supplierName}</td>
                    <td><span className={"cell-chip " + bizTone[split.category]}>{bizLabel[split.category]}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num mono">{fmtMoney(o.totalAmount)}</td>
                    <td className={"num mono " + (unpaid > 0 ? "text-tomato" : "text-foreground/55")}>{fmtMoney(o.paid)}</td>
                    <td className={"num mono " + (unpaid > 0 ? "text-warning" : "text-foreground/55")}>{fmtMoney(unpaid)}</td>
                    <td className="num mono text-[12px] text-foreground/70">{(o.invoices?.length ?? 0)} 张 / {fmtMoney((o.invoices || []).reduce((s, r) => s + (r.amount || 0), 0))}</td>
                    <td className="text-foreground/70">{empName(o.applicantId)}</td>
                    <td className="text-foreground/70">{empName(o.buyerId)}</td>
                    <td className="text-[12px] text-foreground/60 mono">{o.appliedAt}</td>
                    <td className="num" onDoubleClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex gap-1">
                        <button title="登记付款" className="size-8 rounded-full hover:bg-warning/10 text-foreground/55 hover:text-warning inline-flex items-center justify-center transition-colors" onClick={() => setQuickPay(o)}>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                        <button title="新增发票" className="size-8 rounded-full hover:bg-cobalt/10 text-foreground/55 hover:text-cobalt inline-flex items-center justify-center transition-colors" onClick={() => setQuickInv(o)}>
                          <Receipt className="h-3.5 w-3.5" />
                        </button>
                        <button title="操作日志" className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => { setLogRefId(o.id); setLogRefCode(o.code); setLogOpen(true); }}>
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button title="编辑" className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(o)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button title="删除" className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(o.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.list.length > 0 && (() => {
              const sumTotal = data.list.reduce((s, o) => s + o.totalAmount, 0);
              const sumPaid = data.list.reduce((s, o) => s + o.paid, 0);
              const sumUnpaid = data.list.reduce((s, o) => s + (o.totalAmount - o.paid), 0);
              const sumInvoice = data.list.reduce((s, o) => s + (o.invoices || []).reduce((a, r) => a + (r.amount || 0), 0), 0);
              return (
                <tfoot>
                  <tr>
                    <td colSpan={6} className="label">本页 {data.list.length} 单 / 共 {data.total} 单 · 合计</td>
                    <td className="num">{fmtMoney(sumTotal)}</td>
                    <td className="num text-tomato">{fmtMoney(sumPaid)}</td>
                    <td className="num text-warning">{fmtMoney(sumUnpaid)}</td>
                    <td className="num text-cobalt">{fmtMoney(sumInvoice)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑采购订单" : "新建采购订单"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            {/* 申请信息 */}
            <GroupTitle>申请信息</GroupTitle>
            <Field label="申请人" required>
              <Select value={watch("applicantId")} onValueChange={(v) => setValue("applicantId", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="所属部门">
              <Select value={watch("department")} onValueChange={(v) => setValue("department", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["集马科技", "集马科技 · 采购部", "集马科技 · 项目部", "集马科技 · 销售部"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="申请日期" required><Input type="date" {...register("appliedAt", { required: true })} /></Field>

            {/* 合同与签约 */}
            <GroupTitle>合同与签约</GroupTitle>
            <Field label="供应商名称" required>
              <Select value={watch("supplierId")} onValueChange={(v) => setValue("supplierId", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="合同名称"><Input placeholder="如：触摸一体机销售合同" {...register("contractTitle")} /></Field>
            <Field label="签约单位">
              <Select value={watch("signingParty")} onValueChange={(v) => setValue("signingParty", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["集马科技", "集马科技（深圳）", "集马科技（上海）"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="签订日期"><Input type="date" {...register("signedAt")} /></Field>
            <Field label="合同到期日"><Input type="date" {...register("contractExpireAt")} /></Field>
            <Field label="是否关联销售合同" required span={12}>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={watch("linkedSalesContract")}
                  onCheckedChange={(v) => { setValue("linkedSalesContract", v); if (!v) setValue("linkedSalesContractId", ""); }}
                />
                <span className="text-xs text-foreground/60">{watch("linkedSalesContract") ? "已关联" : "未关联"}</span>
                {watch("linkedSalesContract") && (
                  <div className="flex-1 max-w-md">
                    <Select value={watch("linkedSalesContractId") || ""} onValueChange={(v) => setValue("linkedSalesContractId", v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="选择销售合同" /></SelectTrigger>
                      <SelectContent>
                        {salesContracts.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Field>

            {/* 采购执行 */}
            <GroupTitle>采购执行</GroupTitle>
            <Field label="采购经理" span={4}>
              <Select value={watch("buyerId") || ""} onValueChange={(v) => setValue("buyerId", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="订单状态">
              <Select value={watch("status")} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="ordered">已下单</SelectItem>
                  <SelectItem value="received">已入库</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="预计入库"><Input type="date" {...register("expectedAt")} /></Field>
            <Field label="下单日期"><Input type="date" {...register("createdAt")} /></Field>
            <Field label="已付款">
              <Input type="number" step="0.01" className="mono text-right" {...register("paid", { valueAsNumber: true })} />
            </Field>

            {/* 采购明细（保留子表） */}
            <GroupTitle>采购明细</GroupTitle>
            <div className="col-span-12">
              <LineItemsEditor
                items={items}
                products={products}
                onChange={setItems}
                excludeCategories={["software"]}
                logModule="purchase"
                logScope={editing?.id || draftScope}
              />
            </div>

            {/* 付款记录（子表，按 refType=purchase 过滤） */}
            <GroupTitle>付款记录</GroupTitle>
            <div className="col-span-12">
              <PaymentSubList
                orderId={editing?.id}
                orderCode={editing?.code}
                partyName={suppliers.find((s) => s.id === watch("supplierId"))?.name}
                refType="purchase"
                remaining={Math.max((editing?.contractAmount ?? editing?.totalAmount ?? 0) - (editing?.paid ?? 0), 0)}
                reloadKey={open}
              />
            </div>

            {/* 附件资料 */}
            <GroupTitle>附件资料</GroupTitle>
            <Field label="采购合同附件" span={12}>
              <AttachmentField value={watch("contractAttachments") || []} onChange={(v) => setValue("contractAttachments", v)} />
            </Field>

            {/* 发票管理（子表）：供应商开给我方 */}
            <GroupTitle>发票管理（供应商开票）</GroupTitle>
            <div className="col-span-12">
              <InvoiceList
                direction="in"
                value={watch("invoices") || []}
                onChange={(v) => setValue("invoices", v)}
                defaultParty={suppliers.find((s) => s.id === watch("supplierId"))?.name}
              />
            </div>

            {/* 备注 */}
            <GroupTitle>备注</GroupTitle>
            <Field label="备注" span={12}><Textarea rows={3} placeholder="补充说明" {...register("remark")} /></Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建采购订单"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除采购订单"
        description="删除后无法恢复。"
        onConfirm={async () => {
          if (deletingId) await handleDelete(deletingId);
        }}
      />

      <QuickPaymentDialog
        open={!!quickPay}
        onOpenChange={(v) => !v && setQuickPay(null)}
        direction="out"
        refType="purchase"
        refId={quickPay?.id || ""}
        refCode={quickPay?.code || ""}
        partyName={quickPay?.supplierName || ""}
        remaining={quickPay ? Math.max((quickPay.contractAmount ?? quickPay.totalAmount) - quickPay.paid, 0) : 0}
        onSaved={() => { setQuickPay(null); reload(); }}
      />

      <QuickInvoiceDialog
        open={!!quickInv}
        onOpenChange={(v) => !v && setQuickInv(null)}
        refType="purchase"
        refId={quickInv?.id || ""}
        refCode={quickInv?.code || ""}
        partyName={quickInv?.supplierName || ""}
        existing={quickInv?.invoices || []}
        onSaved={() => { setQuickInv(null); reload(); }}
      />
      <OrderLogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        module="purchase"
        refId={logRefId}
        refCode={logRefCode}
      />
    </>
  );
}
