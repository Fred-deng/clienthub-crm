// 移动端 - 销售订单（与 PC 端 src/pages/Sales.tsx 1:1 功能对齐）
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, History, ArrowDownLeft, Receipt, FileText, X, ChevronRight } from "lucide-react";
import { salesApi, customerApi, productApi, employeeApi, paymentApi } from "@/services/api";
import { logOrderUpdate, logOrderDelete, orderLogs } from "@/services/orderLog";
import { syncSalesStock, revertSalesDeliver } from "@/services/inventory";
import { createPaymentAndSync } from "@/services/payments";
import { readCurrentOperator } from "@/context/CurrentUserContext";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, statusLabels } from "@/lib/format";
import { exportCsv } from "@/lib/csv";
import { splitSales, bizLabel, type BizFilter } from "@/lib/biz";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MSwitch, MButton, MRow, MConfirm, MGroupTitle, MAccordion, MChipFilter, MDateRange,
  MLineItemsEditor, MInvoiceList, MLogList, MBulkBar, MIconBtn, MLoadMore, MFilterBar, MAttachmentList
} from "@/mobile/components/MUI";
import type { SalesOrder, Customer, Product, Employee, Payment } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const newCode = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `XSHT${ymd}${Math.floor(Math.random() * 90 + 10)}`;
};

type FormValues = {
  customerId: string; contractTitle: string; code: string; contractAmount: number;
  salesMode: string; contractProperty: string; taxNo: string;
  applicantId: string; department: string; appliedAt: string;
  signedAt: string; contractExpireAt: string; accountManagerId: string; assistantIds: string[];
  isSettled: boolean; isPartyA: boolean;
  serviceFee: number; outsourceFee: number; salesFee: number; productStdCost: number;
  contractAttachments: string[]; stampedContractAttachments: string[]; licenseAttachments: string[]; invoiceAttachments: string[]; otherAttachments: string[];
  invoices: any[]; status: string; ownerId: string; createdAt: string; received: number; remark: string;
};

const SALES_MODES = ["普通销售", "渠道销售", "项目销售", "服务销售"];
const CONTRACT_PROPS = ["新签", "续签", "升级", "补充", "其他"];
const DEPTS = ["销售一部", "销售二部", "大客户部", "项目部"];
const STATUS_FLOW = [
  { value: "pending", label: "待发货" },
  { value: "shipped", label: "运输中" },
  { value: "delivered", label: "已送达" },
  { value: "cancelled", label: "已取消" },
];

function statusVariant(s: string): any {
  return s === "delivered" ? "mint" : s === "shipped" ? "cobalt" : s === "cancelled" ? "tomato" : "mustard";
}

export default function MSales() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(salesApi.list, { pageSize: 20 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [logRefId, setLogRefId] = useState<string | undefined>();
  const [quickPay, setQuickPay] = useState<SalesOrder | null>(null);
  const [quickPayAmt, setQuickPayAmt] = useState(0);
  const [quickPayMethod, setQuickPayMethod] = useState<Payment["method"]>("对公转账");
  const [quickPayRemark, setQuickPayRemark] = useState("");
  const [quickInv, setQuickInv] = useState<SalesOrder | null>(null);
  const [quickInvAmt, setQuickInvAmt] = useState(0);
  const [quickInvNo, setQuickInvNo] = useState("");
  const [quickInvType, setQuickInvType] = useState("增值税专用发票");
  const [quickInvTaxRate, setQuickInvTaxRate] = useState(13);
  const [quickInvStatus, setQuickInvStatus] = useState("已开具");
  const [quickInvRemark, setQuickInvRemark] = useState("");
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("shipped");
  const [draftScope, setDraftScope] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    customerApi.all().then((cs) => setCustomers(cs.filter((c) => c.stage === "formal")));
    productApi.all().then(setProducts);
    employeeApi.all().then(setEmployees);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      customerId: "", contractTitle: "", code: newCode(), contractAmount: 0,
      salesMode: "普通销售", contractProperty: "新签", taxNo: "",
      applicantId: "", department: "销售一部", appliedAt: today(),
      signedAt: "", contractExpireAt: "", accountManagerId: "", assistantIds: [],
      isSettled: false, isPartyA: false,
      serviceFee: 0, outsourceFee: 0, salesFee: 0, productStdCost: 0,
      contractAttachments: [], stampedContractAttachments: [], licenseAttachments: [], invoiceAttachments: [], otherAttachments: [],
      invoices: [], status: "pending", ownerId: "u3", createdAt: today(), received: 0, remark: "",
    },
  });

  const openCreate = () => {
    const c0 = customers[0];
    reset({
      customerId: c0?.id ?? "", contractTitle: "", code: newCode(), contractAmount: 0,
      salesMode: "普通销售", contractProperty: "新签", taxNo: c0?.taxNo ?? "",
      applicantId: "u3", department: "销售一部", appliedAt: today(),
      signedAt: "", contractExpireAt: "", accountManagerId: "u3", assistantIds: [],
      isSettled: false, isPartyA: false,
      serviceFee: 0, outsourceFee: 0, salesFee: 0, productStdCost: 0,
      contractAttachments: [], stampedContractAttachments: [], licenseAttachments: [], invoiceAttachments: [], otherAttachments: [],
      invoices: [], status: "pending", ownerId: "u3", createdAt: today(), received: 0, remark: "",
    });
    setItems([]); setEditing(null); setDraftScope(`draft-sal-${Date.now().toString(36)}`); setOpen(true);
  };

  const openEdit = async (o: SalesOrder) => {
    reset({
      customerId: o.customerId, contractTitle: o.contractTitle ?? "", code: o.code,
      contractAmount: o.contractAmount ?? 0,
      salesMode: o.salesMode ?? "普通销售", contractProperty: o.contractProperty ?? "新签", taxNo: o.taxNo ?? "",
      applicantId: o.applicantId ?? "", department: o.department ?? "销售一部", appliedAt: o.appliedAt ?? "",
      signedAt: o.signedAt ?? "", contractExpireAt: o.contractExpireAt ?? "",
      accountManagerId: o.accountManagerId ?? o.ownerId, assistantIds: o.assistantIds ?? [],
      isSettled: !!o.isSettled, isPartyA: !!o.isPartyA,
      serviceFee: o.serviceFee ?? 0, outsourceFee: o.outsourceFee ?? 0, salesFee: o.salesFee ?? 0, productStdCost: o.productStdCost ?? 0,
      contractAttachments: o.contractAttachments ?? [], stampedContractAttachments: o.stampedContractAttachments ?? [], licenseAttachments: o.licenseAttachments ?? [], invoiceAttachments: o.invoiceAttachments ?? [], otherAttachments: o.otherAttachments ?? [],
      invoices: o.invoices ?? [], status: o.status, ownerId: o.ownerId, createdAt: o.createdAt, received: o.received, remark: o.remark ?? "",
    });
    setItems(o.items.map((it) => ({
      ...it,
      category: it.category ?? (products.find((p) => p.id === it.productId)?.category ?? "other"),
    })));
    setEditing(o); setOpen(true);
    // 加载该订单的回款记录
    const all = await paymentApi.list({ pageSize: 999 });
    setOrderPayments(all.list.filter((p) => p.refType === "sales" && p.refId === o.id && p.direction === "in"));
  };

  const onSubmit = handleSubmit(async (v) => {
    const cus = customers.find((c) => c.id === v.customerId);
    if (!cus) { toast.error("请选择客户"); return; }
    const totalAmount = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const payload: any = {
      ...v, customerName: cus.name, items, totalAmount, contractAmount: totalAmount,
      received: editing ? editing.received : 0,
      serviceFee: Number(v.serviceFee) || 0, outsourceFee: Number(v.outsourceFee) || 0,
      salesFee: Number(v.salesFee) || 0, productStdCost: Number(v.productStdCost) || 0,
    };
    const op = readCurrentOperator();
    const reasonRemark = (editing && editing.status !== "cancelled" && payload.status === "cancelled" && cancelReason) ? `订单取消原因：${cancelReason}` : undefined;
    if (editing) {
      const merged = { ...editing, ...payload } as SalesOrder;
      syncSalesStock(editing, merged, op);
      logOrderUpdate("sales", editing, payload, reasonRemark);
      await salesApi.update(editing.id, payload);
    } else {
      const created = await salesApi.create(payload);
      syncSalesStock(null, created, op);
    }
    setCancelReason(""); toast.success("已保存"); setOpen(false); reload();
  });

  const handleDelete = async () => {
    if (!deletingId) return;
    const order = data.list.find((o) => o.id === deletingId);
    if (order) {
      if (order.status === "delivered") revertSalesDeliver(order, readCurrentOperator(), "订单删除回滚出库");
      logOrderDelete("sales", order);
    }
    await salesApi.remove(deletingId);
    toast.success("已删除"); setDeletingId(null); reload();
  };

  const exportAll = async () => {
    const all = await salesApi.all();
    exportCsv("sales-orders", all, [
      { header: "合同编号", value: (o) => o.code },
      { header: "合同名称", value: (o) => o.contractTitle || "" },
      { header: "客户", value: (o) => o.customerName },
      { header: "状态", value: (o) => statusLabels[o.status] || o.status },
      { header: "合同金额", value: (o) => o.totalAmount },
      { header: "已回款", value: (o) => o.received },
      { header: "未回款", value: (o) => Math.max((o.contractAmount ?? o.totalAmount) - o.received, 0) },
      { header: "签订日", value: (o) => o.signedAt || o.createdAt },
    ]);
    toast.success("已导出 CSV");
  };

  const submitQuickPay = async () => {
    if (!quickPay || quickPayAmt <= 0) return;
    await createPaymentAndSync({
      code: `RK${Date.now().toString().slice(-6)}`,
      direction: "in", refType: "sales", refId: quickPay.id, refCode: quickPay.code,
      partyName: quickPay.customerName, amount: quickPayAmt, method: quickPayMethod,
      paidAt: today(), remark: quickPayRemark,
    });
    toast.success("回款已登记");
    setQuickPay(null); setQuickPayAmt(0); setQuickPayRemark(""); reload();
  };

  const submitQuickInv = async () => {
    if (!quickInv || quickInvAmt <= 0) return toast.error("请输入价税合计");
    const rec = { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, invoiceNo: quickInvNo, invoiceType: quickInvType, invoiceDate: today(), amount: quickInvAmt, taxRate: quickInvTaxRate, taxAmount: Number(((quickInvAmt * quickInvTaxRate) / (100 + quickInvTaxRate)).toFixed(2)), buyerOrSeller: quickInv.customerName, status: quickInvStatus, remark: quickInvRemark };
    await salesApi.update(quickInv.id, { invoices: [...(quickInv.invoices || []), rec] } as any);
    toast.success("发票已新增");
    setQuickInv(null); setQuickInvAmt(0); setQuickInvNo(""); setQuickInvRemark(""); reload();
  };

  const applyBulkStatus = async () => {
    const op = readCurrentOperator();
    for (const id of selectedIds) {
      const order = data.list.find((o) => o.id === id);
      if (!order || order.status === bulkStatus) continue;
      const merged = { ...order, status: bulkStatus as any };
      syncSalesStock(order, merged, op);
      logOrderUpdate("sales", order, { status: bulkStatus });
      await salesApi.update(id, { status: bulkStatus } as any);
    }
    toast.success(`已批量更新 ${selectedIds.length} 单`);
    setSelectedIds([]); setBulkStatusOpen(false); reload();
  };

  const filtered = useMemo(
    () => data.list
      .map((o) => ({ o, split: splitSales(o, products) }))
      .filter(({ split }) => biz === "all" || (biz === "software" ? split.software > 0 : split.hardware > 0)),
    [data.list, products, biz]
  );

  const customerOpts = useMemo(() => customers.map((c) => ({ value: c.id, label: c.name })), [customers]);
  const employeeOpts = useMemo(
    () => employees.filter((e) => e.role !== "管理员").map((e) => ({ value: e.id, label: e.name })),
    [employees]
  );
  const itemsTotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const currentLogs = editing ? orderLogs.filter((l) => l.module === "sales" && l.refId === editing.id) : [];
  const allSalesLogs = orderLogs.filter((l) => l.module === "sales");
  const assistantIds = watch("assistantIds") || [];

  return (
    <>
      <MPageHeader
        title="销售订单"
        subtitle={`共 ${data.total} 单 · ${filtered.length} 显示中`}
        action={
          <button onClick={exportAll} className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center" title="导出 CSV">
            <FileText className="h-4 w-4" />
          </button>
        }
      />
      <MSearchBar
        value={query.keyword || ""}
        onChange={(v) => setFilter({ keyword: v })}
        placeholder="搜索合同号 / 客户 / 明细产品"
        trailing={
          <button onClick={() => { setLogRefId(undefined); setLogOpen(true); }} className="size-10 rounded-full bg-foreground/[0.06] flex items-center justify-center" title="全部日志">
            <FileText className="h-4 w-4" />
          </button>
        }
      />
      <MChipFilter<BizFilter>
        value={biz}
        onChange={setBiz}
        options={[
          { value: "all", label: "全部业务" },
          { value: "software", label: "软件" },
          { value: "hardware", label: "硬件" },
        ]}
      />
      <MChipFilter
        value={query.status ?? "all"}
        onChange={(v) => setFilter({ status: v })}
        options={[
          { value: "all", label: "全部状态" },
          { value: "pending", label: "待发货" },
          { value: "shipped", label: "运输中" },
          { value: "delivered", label: "已送达" },
          { value: "cancelled", label: "已取消" },
        ]}
      />
      <MFilterBar onReset={() => setFilter({ dateFrom: undefined, dateTo: undefined, status: "all", keyword: "" })}>
        <button onClick={() => { setLogRefId(undefined); setLogOpen(true); }} className="shrink-0 px-3 h-8 rounded-full bg-foreground/[0.06] text-[11px] font-semibold inline-flex items-center gap-1">
          <History className="h-3 w-3" />全部日志
        </button>
        {selectedIds.length > 0 && (
          <button onClick={() => setBulkStatusOpen(true)} className="shrink-0 px-3 h-8 rounded-full bg-foreground text-[hsl(var(--paper))] text-[11px] font-semibold">
            批量改状态
          </button>
        )}
      </MFilterBar>
      <MDateRange
        value={{ from: query.dateFrom || "", to: query.dateTo || "" }}
        onChange={(v) => setFilter({ dateFrom: v.from || undefined, dateTo: v.to || undefined })}
      />

      <MList loading={loading} empty={!loading && filtered.length === 0}>
        {filtered.map(({ o, split }) => {
          const owner = employees.find((e) => e.id === (o.accountManagerId || o.ownerId));
          const unpaid = Math.max((o.contractAmount ?? o.totalAmount) - o.received, 0);
          return (
            <MCard
              key={o.id}
              onClick={() => openEdit(o)}
              selected={selectedIds.includes(o.id)}
              onSelectChange={(s) => setSelectedIds(s ? [...selectedIds, o.id] : selectedIds.filter((x) => x !== o.id))}
              selectPosition="bottom"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <MTag variant={statusVariant(o.status)}>{statusLabels[o.status] || o.status}</MTag>
                    <MTag variant={split.category === "software" ? "cobalt" : split.category === "hardware" ? "mint" : "mustard"}>
                      {bizLabel[split.category]}
                    </MTag>
                    {o.contractProperty && <MTag variant="muted">{o.contractProperty}</MTag>}
                  </div>
                  <div className="font-display font-bold text-[14px] truncate">{o.contractTitle || o.code}</div>
                  <div className="text-[11px] text-foreground/55 truncate">{o.customerName} · {owner?.name ?? "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[15px] font-black tabular-nums">{fmtMoney(o.totalAmount)}</div>
                  <div className="text-[10px] text-foreground/45 font-mono mt-0.5">
                    已回 <span className="text-mint">{fmtMoney(o.received)}</span>
                  </div>
                  {unpaid > 0 && <div className="text-[10px] text-tomato font-mono">未 {fmtMoney(unpaid)}</div>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-foreground/5">
                <span className="font-mono text-[10px] text-foreground/45">{o.code} · {o.signedAt ?? o.createdAt}</span>
                <div className="flex gap-1">
                  <MIconBtn icon={<ArrowDownLeft className="h-3.5 w-3.5" />} variant="primary" title="登记回款" onClick={() => { setQuickPay(o); setQuickPayAmt(unpaid); }} />
                  <MIconBtn icon={<Receipt className="h-3.5 w-3.5" />} title="新增发票" onClick={() => { setQuickInv(o); setQuickInvAmt(unpaid || (o.contractAmount ?? o.totalAmount)); }} />
                  <MIconBtn icon={<History className="h-3.5 w-3.5" />} title="日志" onClick={() => { setLogRefId(o.id); setLogOpen(true); }} />
                  <MIconBtn icon={<Trash2 className="h-3.5 w-3.5" />} variant="danger" title="删除" onClick={() => setDeletingId(o.id)} />
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>
      {data.total > data.list.length && (
        <MLoadMore hasMore={query.page! * query.pageSize! < data.total} onLoad={() => setPage(query.page! + 1)} />
      )}

      <MFab onClick={openCreate} label="新建合同" />
      <MBulkBar count={selectedIds.length} onCancel={() => setSelectedIds([])}>
        <button onClick={() => setBulkStatusOpen(true)} className="px-3 h-8 rounded-full bg-mustard/90 text-foreground text-[11px] font-semibold">改状态</button>
      </MBulkBar>

      {/* ========== 编辑/新建 Sheet ========== */}
      <MSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "编辑销售合同" : "新建销售合同"}
        size="full"
        footer={
          <div className="flex gap-2">
            <MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton>
            <MButton onClick={onSubmit} className="flex-[2]">{editing ? "保存修改" : "创建合同"}</MButton>
          </div>
        }
      >
        <MGroupTitle>基础信息</MGroupTitle>
        <MField label="客户" required>
          <MSelect
            value={watch("customerId")}
            onChange={(v) => {
              setValue("customerId", v);
              const c = customers.find((x) => x.id === v);
              if (c) setValue("taxNo", c.taxNo ?? "");
            }}
            options={customerOpts}
            placeholder="选择客户"
          />
        </MField>
        <MField label="合同名称" required><MInput {...register("contractTitle")} placeholder="请输入合同名称" /></MField>
        <MField label="合同编号"><MInput {...register("code")} /></MField>
        <div className="grid grid-cols-2 gap-3">
          <MField label="销售方式" required>
            <MSelect value={watch("salesMode")} onChange={(v) => setValue("salesMode", v)} options={SALES_MODES.map((s) => ({ value: s, label: s }))} />
          </MField>
          <MField label="合同属性" required>
            <MSelect value={watch("contractProperty")} onChange={(v) => setValue("contractProperty", v)} options={CONTRACT_PROPS.map((s) => ({ value: s, label: s }))} />
          </MField>
        </div>
        <MField label="统一社会信用代码"><MInput {...register("taxNo")} /></MField>

        <MGroupTitle>申请与组织</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="申请人">
            <MSelect value={watch("applicantId")} onChange={(v) => setValue("applicantId", v)} options={employeeOpts} placeholder="选择" />
          </MField>
          <MField label="所属部门" required>
            <MSelect value={watch("department")} onChange={(v) => setValue("department", v)} options={DEPTS.map((s) => ({ value: s, label: s }))} />
          </MField>
        </div>
        <MField label="申请日期"><MInput type="date" {...register("appliedAt")} /></MField>

        <MGroupTitle>签约与结算</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="签订日"><MInput type="date" {...register("signedAt")} /></MField>
          <MField label="到期日"><MInput type="date" {...register("contractExpireAt")} /></MField>
        </div>
        <MField label="客户经理">
          <MSelect value={watch("accountManagerId")} onChange={(v) => { setValue("accountManagerId", v); setValue("ownerId", v); }} options={employeeOpts} placeholder="选择" />
        </MField>
        <MField label="协助人">
          <div className="min-h-11 px-2 py-1.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 flex flex-wrap gap-1.5 items-center">
            {assistantIds.length === 0 && <span className="text-[12px] text-foreground/40 px-1.5">未选择</span>}
            {assistantIds.map((id) => {
              const e = employees.find((x) => x.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1 text-[11px] px-2 h-6 rounded-full bg-card border border-foreground/10">
                  {e?.name ?? id}
                  <button type="button" onClick={() => setValue("assistantIds", assistantIds.filter((x) => x !== id))} className="text-foreground/45 hover:text-tomato">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <select
              value=""
              onChange={(e) => { if (e.target.value) setValue("assistantIds", [...assistantIds, e.target.value]); }}
              className="h-7 rounded-md bg-transparent text-[11px] outline-none"
            >
              <option value="">+ 添加</option>
              {employees.filter((e) => e.role !== "管理员" && !assistantIds.includes(e.id)).map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </MField>
        <div className="grid grid-cols-2 gap-3">
          <MField label="是否结算"><MSwitch checked={watch("isSettled")} onChange={(v) => setValue("isSettled", v)} label={watch("isSettled") ? "已结算" : "未结算"} /></MField>
          <MField label="是否甲方"><MSwitch checked={watch("isPartyA")} onChange={(v) => setValue("isPartyA", v)} label={watch("isPartyA") ? "甲方" : "乙方"} /></MField>
        </div>

        <MGroupTitle>费用信息</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="约定服务费"><MInput type="number" step="0.01" {...register("serviceFee", { valueAsNumber: true })} /></MField>
          <MField label="外包费用"><MInput type="number" step="0.01" {...register("outsourceFee", { valueAsNumber: true })} /></MField>
          <MField label="销售费用"><MInput type="number" step="0.01" {...register("salesFee", { valueAsNumber: true })} /></MField>
          <MField label="标准成本"><MInput type="number" step="0.01" {...register("productStdCost", { valueAsNumber: true })} /></MField>
        </div>

        <MGroupTitle>销售明细</MGroupTitle>
        <MLineItemsEditor items={items} products={products} onChange={setItems} mode="sales" logModule="sales" logScope={editing?.id || draftScope} />

        <MGroupTitle>订单执行</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="订单状态">
            <MSelect value={watch("status")} onChange={(v) => { if (v === "cancelled" && watch("status") !== "cancelled" && editing) { setCancelOpen(true); return; } setValue("status", v); }} options={STATUS_FLOW} />
            {watch("status") === "cancelled" && cancelReason && <div className="text-[11px] text-tomato mt-1">取消原因：{cancelReason}</div>}
          </MField>
          <MField label="下单日"><MInput type="date" {...register("createdAt")} /></MField>
        </div>
        <MField label="销售员">
          <MSelect value={watch("ownerId")} onChange={(v) => setValue("ownerId", v)} options={employeeOpts} />
        </MField>

        {editing && (
          <>
            <MGroupTitle>子表（折叠查看）</MGroupTitle>
            <MAccordion title="发票管理（开给客户）" badge={<MTag variant="cobalt">{(watch("invoices") || []).length} 张</MTag>}>
              <MInvoiceList
                value={watch("invoices") || []}
                onChange={(v) => setValue("invoices", v)}
                direction="out"
                defaultParty={customers.find((c) => c.id === watch("customerId"))?.name}
              />
            </MAccordion>
            <MAccordion title="回款记录" badge={<MTag variant="mint">{orderPayments.length} 笔 · {fmtMoney(orderPayments.reduce((s, p) => s + p.amount, 0))}</MTag>}>
              {orderPayments.length === 0 ? (
                <div className="text-center py-4 text-[12px] text-foreground/40">暂无回款</div>
              ) : (
                <div className="space-y-1.5">
                  {orderPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-foreground/5">
                      <div>
                        <div className="font-mono">{p.code}</div>
                        <div className="text-[10px] text-foreground/45">{p.paidAt} · {p.method}</div>
                      </div>
                      <div className="font-mono font-bold text-mint">+{fmtMoney(p.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => { setQuickPay(editing); setQuickPayAmt(Math.max((editing.contractAmount ?? editing.totalAmount) - editing.received, 0)); }} className="mt-2 w-full h-9 rounded-full bg-tomato text-[hsl(var(--paper))] text-[12px] font-semibold">+ 新增回款</button>
            </MAccordion>
            <MAccordion title="操作日志" badge={<MTag variant="muted">{currentLogs.length} 条</MTag>}>
              <MLogList logs={currentLogs} />
            </MAccordion>
          </>
        )}

        <MGroupTitle>备注</MGroupTitle>
        <MAccordion title="附件资料" badge={<MTag variant="muted">{(watch("contractAttachments") || []).length + (watch("stampedContractAttachments") || []).length + (watch("invoiceAttachments") || []).length + (watch("otherAttachments") || []).length}</MTag>}>
          <MField label="合同附件"><MAttachmentList value={watch("contractAttachments") || []} onChange={(v) => setValue("contractAttachments", v)} /></MField>
          <MField label="盖章合同扫描件"><MAttachmentList value={watch("stampedContractAttachments") || []} onChange={(v) => setValue("stampedContractAttachments", v)} /></MField>
          <MField label="开票资料"><MAttachmentList value={watch("invoiceAttachments") || []} onChange={(v) => setValue("invoiceAttachments", v)} /></MField>
          <MField label="其他附件"><MAttachmentList value={watch("otherAttachments") || []} onChange={(v) => setValue("otherAttachments", v)} /></MField>
        </MAccordion>
        <MField label="备注"><MTextarea rows={3} {...register("remark")} /></MField>

        <div className="text-center text-[11px] text-foreground/45 mt-4 pb-2">
          明细合计 <span className="font-mono font-bold text-foreground">¥{itemsTotal.toLocaleString()}</span>
        </div>
      </MSheet>

      {/* ========== 删除确认 ========== */}
      <MConfirm
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除销售合同"
        description="此操作不可撤销，已送达订单将自动回滚出库。"
        onConfirm={handleDelete}
        confirmText="删除"
        danger
      />

      {/* ========== 快速回款 Sheet ========== */}
      <MSheet
        open={!!quickPay}
        onOpenChange={(v) => !v && setQuickPay(null)}
        title={`登记回款 · ${quickPay?.code || ""}`}
        footer={
          <div className="flex gap-2">
            <MButton variant="ghost" onClick={() => setQuickPay(null)} className="flex-1">取消</MButton>
            <MButton onClick={submitQuickPay} className="flex-[2]" disabled={quickPayAmt <= 0}>确认登记</MButton>
          </div>
        }
      >
        {quickPay && (
          <>
            <MRow label="客户" value={quickPay.customerName} />
            <MRow label="合同金额" value={fmtMoney(quickPay.contractAmount ?? quickPay.totalAmount)} mono />
            <MRow label="已回款" value={fmtMoney(quickPay.received)} mono />
            <MRow label="未回款" value={fmtMoney(Math.max((quickPay.contractAmount ?? quickPay.totalAmount) - quickPay.received, 0))} mono />
            <div className="mt-4 space-y-3">
              <MField label="回款金额" required><MInput type="number" step="0.01" value={quickPayAmt} onChange={(e) => setQuickPayAmt(Number(e.target.value))} /></MField>
              <MField label="收款方式">
                <MSelect value={quickPayMethod} onChange={(v) => setQuickPayMethod(v as any)} options={[
                  { value: "对公转账", label: "对公转账" }, { value: "现金", label: "现金" }, { value: "支票", label: "支票" }, { value: "支付宝", label: "支付宝" }, { value: "微信", label: "微信" },
                ]} />
              </MField>
              <MField label="备注"><MTextarea rows={2} value={quickPayRemark} onChange={(e) => setQuickPayRemark(e.target.value)} /></MField>
            </div>
          </>
        )}
      </MSheet>

      <MSheet open={!!quickInv} onOpenChange={(v) => !v && setQuickInv(null)} title={`新增发票 · ${quickInv?.code || ""}`}
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setQuickInv(null)} className="flex-1">取消</MButton><MButton onClick={submitQuickInv} className="flex-[2]" disabled={quickInvAmt <= 0}>新增发票</MButton></div>}
      >
        {quickInv && <>
          <MRow label="购买方" value={quickInv.customerName} />
          <div className="mt-4 space-y-3">
            <MField label="发票号码"><MInput value={quickInvNo} onChange={(e) => setQuickInvNo(e.target.value)} /></MField>
            <MField label="发票类型"><MSelect value={quickInvType} onChange={setQuickInvType} options={["增值税专用发票", "增值税普通发票", "电子普通发票", "电子专用发票", "其他"].map((v) => ({ value: v, label: v }))} /></MField>
            <div className="grid grid-cols-2 gap-3"><MField label="状态"><MSelect value={quickInvStatus} onChange={setQuickInvStatus} options={["已开具", "待开具", "红冲"].map((v) => ({ value: v, label: v }))} /></MField><MField label="税率"><MSelect value={String(quickInvTaxRate)} onChange={(v) => setQuickInvTaxRate(Number(v))} options={[0,1,3,6,9,13].map((v) => ({ value: String(v), label: `${v}%` }))} /></MField></div>
            <MField label="价税合计" required><MInput type="number" step="0.01" value={quickInvAmt} onChange={(e) => setQuickInvAmt(Number(e.target.value))} /></MField>
            <MField label="备注"><MTextarea rows={2} value={quickInvRemark} onChange={(e) => setQuickInvRemark(e.target.value)} /></MField>
          </div>
        </>}
      </MSheet>

      {/* ========== 批量改状态 Sheet ========== */}
      <MSheet
        open={bulkStatusOpen}
        onOpenChange={setBulkStatusOpen}
        title={`批量改状态 (${selectedIds.length} 单)`}
        footer={<MButton onClick={applyBulkStatus} className="w-full">确认应用</MButton>}
      >
        <MField label="目标状态">
          <MSelect value={bulkStatus} onChange={setBulkStatus} options={STATUS_FLOW} />
        </MField>
        <p className="text-[11px] text-foreground/55">将更新所选 {selectedIds.length} 单为「{statusLabels[bulkStatus]}」，并联动出入库。</p>
      </MSheet>

      {/* ========== 操作日志 Sheet ========== */}
      <MSheet open={logOpen} onOpenChange={setLogOpen} title={logRefId ? `订单日志` : "全部销售日志"} size="full">
        <MLogList logs={logRefId ? allSalesLogs.filter((l) => l.refId === logRefId) : allSalesLogs} />
      </MSheet>
      <MSheet open={cancelOpen} onOpenChange={setCancelOpen} title="取消订单原因">
        <MField label="原因" required><MTextarea rows={4} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="请输入取消原因" /></MField>
        <div className="flex gap-2"><MButton variant="ghost" onClick={() => setCancelOpen(false)} className="flex-1">返回</MButton><MButton onClick={() => { if (!cancelReason.trim()) return toast.error("请输入取消原因"); setValue("status", "cancelled"); setCancelOpen(false); }} className="flex-1">确认取消</MButton></div>
      </MSheet>
    </>
  );
}
