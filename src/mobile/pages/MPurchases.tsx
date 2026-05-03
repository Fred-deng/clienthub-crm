// 移动端 - 采购订单（与 PC 端 src/pages/Purchases.tsx 1:1 功能对齐）
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Trash2, History, ArrowUpRight, FileText, Receipt } from "lucide-react";
import { purchaseApi, supplierApi, productApi, employeeApi, contractApi, paymentApi } from "@/services/api";
import { syncPurchaseStock, applyPurchaseReceive, revertPurchaseReceive, findOrCreateProductByName } from "@/services/inventory";
import { logOrderUpdate, logOrderDelete, orderLogs } from "@/services/orderLog";
import { createPaymentAndSync } from "@/services/payments";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, statusLabels } from "@/lib/format";
import { exportCsv } from "@/lib/csv";
import { splitPurchase, bizLabel, type BizFilter } from "@/lib/biz";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MSwitch, MButton, MRow, MConfirm, MGroupTitle, MAccordion, MChipFilter, MDateRange,
  MLineItemsEditor, MInvoiceList, MLogList, MBulkBar, MIconBtn, MLoadMore, MFilterBar, MAttachmentList
} from "@/mobile/components/MUI";
import type { PurchaseOrder, Supplier, Product, Employee, PurchaseItem, Contract, Payment } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
const STATUS_OPTS = [
  { value: "draft", label: "草稿" },
  { value: "ordered", label: "已下单" },
  { value: "received", label: "已入库" },
  { value: "cancelled", label: "已取消" },
];
function statusVariant(s: string): any {
  return s === "received" ? "mint" : s === "ordered" ? "cobalt" : s === "cancelled" ? "tomato" : "muted";
}

type FormValues = {
  applicantId: string; department: string; appliedAt: string;
  supplierId: string; contractTitle: string; signingParty: string;
  signedAt: string; contractExpireAt: string;
  linkedSalesContract: boolean; linkedSalesContractId: string;
  buyerId: string; status: PurchaseOrder["status"];
  expectedAt: string; createdAt: string; remark: string;
  invoices: any[]; contractAttachments: string[];
};

export default function MPurchases() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(purchaseApi.list, { pageSize: 20 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salesContracts, setSalesContracts] = useState<Contract[]>([]);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [biz, setBiz] = useState<BizFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<PurchaseOrder["status"]>("ordered");
  const [logOpen, setLogOpen] = useState(false);
  const [logRefId, setLogRefId] = useState<string | undefined>();
  const [quickPay, setQuickPay] = useState<PurchaseOrder | null>(null);
  const [quickPayAmt, setQuickPayAmt] = useState(0);
  const [quickPayMethod, setQuickPayMethod] = useState<Payment["method"]>("对公转账");
  const [quickPayRemark, setQuickPayRemark] = useState("");
  const [quickInv, setQuickInv] = useState<PurchaseOrder | null>(null);
  const [quickInvAmt, setQuickInvAmt] = useState(0);
  const [quickInvNo, setQuickInvNo] = useState("");
  const [quickInvType, setQuickInvType] = useState("增值税专用发票");
  const [quickInvTaxRate, setQuickInvTaxRate] = useState(13);
  const [quickInvStatus, setQuickInvStatus] = useState("已收到");
  const [quickInvRemark, setQuickInvRemark] = useState("");
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [draftScope, setDraftScope] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { current } = useCurrentUser();

  useEffect(() => {
    supplierApi.all().then(setSuppliers);
    productApi.all().then(setProducts);
    employeeApi.all().then(setEmployees);
    contractApi.all().then(setSalesContracts);
  }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      applicantId: "u1", department: "集马科技", appliedAt: today(),
      supplierId: "", contractTitle: "", signingParty: "集马科技",
      signedAt: today(), contractExpireAt: "",
      linkedSalesContract: false, linkedSalesContractId: "",
      buyerId: "", status: "draft", expectedAt: "", createdAt: today(), remark: "",
      invoices: [], contractAttachments: [],
    },
  });

  const openCreate = () => {
    reset({
      applicantId: "u1", department: "集马科技", appliedAt: today(),
      supplierId: suppliers[0]?.id ?? "", contractTitle: "", signingParty: "集马科技",
      signedAt: today(), contractExpireAt: "",
      linkedSalesContract: false, linkedSalesContractId: "",
      buyerId: "", status: "draft", expectedAt: "", createdAt: today(), remark: "",
      invoices: [], contractAttachments: [],
    });
    setItems([]); setEditing(null); setDraftScope(`draft-pur-${Date.now().toString(36)}`); setOpen(true);
  };

  const openEdit = async (o: PurchaseOrder) => {
    reset({
      applicantId: o.applicantId, department: o.department || "集马科技", appliedAt: o.appliedAt,
      supplierId: o.supplierId, contractTitle: o.contractTitle || "", signingParty: o.signingParty || "集马科技",
      signedAt: o.signedAt || "", contractExpireAt: o.contractExpireAt || "",
      linkedSalesContract: !!o.linkedSalesContract, linkedSalesContractId: o.linkedSalesContractId || "",
      buyerId: o.buyerId || "", status: o.status, expectedAt: o.expectedAt, createdAt: o.createdAt, remark: o.remark || "",
      invoices: o.invoices || [], contractAttachments: o.contractAttachments || [],
    });
    setItems(o.items.map((it) => ({
      ...it, category: (it as any).category ?? (products.find((p) => p.id === it.productId)?.category ?? "other"),
    })));
    setEditing(o); setOpen(true);
    const all = await paymentApi.list({ pageSize: 999 });
    setOrderPayments(all.list.filter((p) => p.refType === "purchase" && p.refId === o.id && p.direction === "out"));
  };

  const onSubmit = handleSubmit(async (v) => {
    const sup = suppliers.find((s) => s.id === v.supplierId);
    const normalizedItems: PurchaseItem[] = items
      .filter((it) => it.productName.trim() && it.qty > 0)
      .map((it) => {
        let prodId = it.productId; let cat = it.category;
        if (!prodId) {
          const p = findOrCreateProductByName(it.productName, it.category, it.price, "采购订单");
          prodId = p.id; cat = p.category;
        }
        return { productId: prodId, productName: it.productName.trim(), category: cat, qty: it.qty, price: it.price };
      });
    const totalAmount = normalizedItems.reduce((s, it) => s + it.qty * it.price, 0);
    const payload: any = {
      ...v, contractAmount: totalAmount,
      paid: editing ? editing.paid : 0,
      supplierName: sup?.name ?? "-",
      items: normalizedItems, totalAmount,
      code: editing?.code ?? `CG-${Date.now().toString().slice(-6)}`,
    };
    const op = current.name;
    const reasonRemark = (editing && editing.status !== "cancelled" && payload.status === "cancelled" && cancelReason) ? `订单取消原因：${cancelReason}` : undefined;
    if (editing) {
      const merged = { ...editing, ...payload } as PurchaseOrder;
      syncPurchaseStock(editing, merged, op);
      logOrderUpdate("purchase", editing, payload, reasonRemark);
      await purchaseApi.update(editing.id, payload);
    } else {
      const created = await purchaseApi.create(payload);
      syncPurchaseStock(null, created, op);
    }
    setCancelReason(""); toast.success("已保存"); setOpen(false); reload(); productApi.all().then(setProducts);
  });

  const handleDelete = async () => {
    if (!deletingId) return;
    const order = data.list.find((o) => o.id === deletingId);
    if (order) {
      if (order.status === "received") revertPurchaseReceive(order, current.name, "订单删除回滚入库");
      logOrderDelete("purchase", order);
    }
    await purchaseApi.remove(deletingId);
    toast.success("已删除"); setDeletingId(null); reload(); productApi.all().then(setProducts);
  };

  const exportAll = async () => {
    const all = await purchaseApi.all();
    exportCsv("purchase-orders", all, [
      { header: "单号", value: (o) => o.code },
      { header: "供应商", value: (o) => o.supplierName },
      { header: "状态", value: (o) => statusLabels[o.status] || o.status },
      { header: "明细合计", value: (o) => o.totalAmount },
      { header: "已付", value: (o) => o.paid },
      { header: "未付", value: (o) => Math.max(o.totalAmount - o.paid, 0) },
      { header: "申请日期", value: (o) => o.appliedAt },
    ]);
    toast.success("已导出 CSV");
  };

  const submitQuickPay = async () => {
    if (!quickPay || quickPayAmt <= 0) return;
    await createPaymentAndSync({
      code: `FK${Date.now().toString().slice(-6)}`,
      direction: "out", refType: "purchase", refId: quickPay.id, refCode: quickPay.code,
      partyName: quickPay.supplierName, amount: quickPayAmt, method: quickPayMethod,
      paidAt: today(), remark: quickPayRemark,
    });
    toast.success("付款已登记");
    setQuickPay(null); setQuickPayAmt(0); setQuickPayRemark(""); reload();
  };

  const submitQuickInv = async () => {
    if (!quickInv || quickInvAmt <= 0) return toast.error("请输入价税合计");
    const rec = { id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, invoiceNo: quickInvNo, invoiceType: quickInvType, invoiceDate: today(), amount: quickInvAmt, taxRate: quickInvTaxRate, taxAmount: Number(((quickInvAmt * quickInvTaxRate) / (100 + quickInvTaxRate)).toFixed(2)), buyerOrSeller: quickInv.supplierName, status: quickInvStatus, remark: quickInvRemark };
    await purchaseApi.update(quickInv.id, { invoices: [...(quickInv.invoices || []), rec] } as any);
    toast.success("发票已新增");
    setQuickInv(null); setQuickInvAmt(0); setQuickInvNo(""); setQuickInvRemark(""); reload();
  };

  const applyBulkStatus = async () => {
    const op = current.name;
    for (const id of selectedIds) {
      const order = data.list.find((o) => o.id === id);
      if (!order || order.status === bulkStatus) continue;
      if (order.status === "received" && bulkStatus !== "received") revertPurchaseReceive(order, op, "批量改状态回滚");
      if (bulkStatus === "received" && order.status !== "received") applyPurchaseReceive(order, op);
      logOrderUpdate("purchase", order, { status: bulkStatus });
      await purchaseApi.update(id, { status: bulkStatus });
    }
    toast.success(`已批量更新 ${selectedIds.length} 单`);
    setSelectedIds([]); setBulkStatusOpen(false); reload(); productApi.all().then(setProducts);
  };

  const filtered = useMemo(
    () => data.list
      .map((o) => ({ o, split: splitPurchase(o, products) }))
      .filter(({ split }) => biz === "all" || (biz === "software" ? split.software > 0 : split.hardware > 0)),
    [data.list, products, biz]
  );
  const supplierOpts = useMemo(() => suppliers.map((s) => ({ value: s.id, label: s.name })), [suppliers]);
  const employeeOpts = useMemo(() => employees.map((e) => ({ value: e.id, label: `${e.name}（${e.role}）` })), [employees]);
  const contractOpts = useMemo(() => salesContracts.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` })), [salesContracts]);
  const itemsTotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const currentLogs = editing ? orderLogs.filter((l) => l.module === "purchase" && l.refId === editing.id) : [];
  const allLogs = orderLogs.filter((l) => l.module === "purchase");

  return (
    <>
      <MPageHeader
        title="采购订单"
        subtitle={`共 ${data.total} 单 · ${filtered.length} 显示中`}
        action={
          <button onClick={exportAll} className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center" title="导出">
            <FileText className="h-4 w-4" />
          </button>
        }
      />
      <MSearchBar value={query.keyword || ""} onChange={(v) => setFilter({ keyword: v })} placeholder="搜索单号 / 供应商 / 合同名" />
      <MChipFilter<BizFilter>
        value={biz} onChange={setBiz}
        options={[{ value: "all", label: "全部业务" }, { value: "software", label: "软件" }, { value: "hardware", label: "硬件" }]}
      />
      <MChipFilter
        value={query.status ?? "all"} onChange={(v) => setFilter({ status: v })}
        options={[{ value: "all", label: "全部" }, ...STATUS_OPTS]}
      />
      <MFilterBar onReset={() => setFilter({ dateFrom: undefined, dateTo: undefined, status: "all", keyword: "" })}>
        <button onClick={() => { setLogRefId(undefined); setLogOpen(true); }} className="shrink-0 px-3 h-8 rounded-full bg-foreground/[0.06] text-[11px] font-semibold inline-flex items-center gap-1">
          <History className="h-3 w-3" />全部日志
        </button>
      </MFilterBar>
      <MDateRange
        value={{ from: query.dateFrom || "", to: query.dateTo || "" }}
        onChange={(v) => setFilter({ dateFrom: v.from || undefined, dateTo: v.to || undefined })}
      />

      <MList loading={loading} empty={!loading && filtered.length === 0}>
        {filtered.map(({ o, split }) => {
          const buyer = employees.find((e) => e.id === o.buyerId);
          const unpaid = Math.max(o.totalAmount - o.paid, 0);
          return (
            <MCard
              key={o.id}
              onClick={() => openEdit(o)}
              selected={selectedIds.includes(o.id)}
              onSelectChange={(s) => setSelectedIds(s ? [...selectedIds, o.id] : selectedIds.filter((x) => x !== o.id))}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1 pr-7">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <MTag variant={statusVariant(o.status)}>{statusLabels[o.status] || o.status}</MTag>
                    <MTag variant={split.category === "software" ? "cobalt" : split.category === "hardware" ? "mint" : "mustard"}>
                      {bizLabel[split.category]}
                    </MTag>
                    {o.linkedSalesContract && <MTag variant="cobalt">关联销售</MTag>}
                  </div>
                  <div className="font-display font-bold text-[14px] truncate">{o.contractTitle || o.code}</div>
                  <div className="text-[11px] text-foreground/55 truncate">{o.supplierName} · {buyer?.name ?? "—"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[15px] font-black tabular-nums">{fmtMoney(o.totalAmount)}</div>
                  <div className="text-[10px] text-foreground/45 font-mono mt-0.5">已付 <span className="text-tomato">{fmtMoney(o.paid)}</span></div>
                  {unpaid > 0 && <div className="text-[10px] text-mustard font-mono">未 {fmtMoney(unpaid)}</div>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-foreground/5">
                <span className="font-mono text-[10px] text-foreground/45">{o.code} · {o.appliedAt}</span>
                <div className="flex gap-1">
                  <MIconBtn icon={<ArrowUpRight className="h-3.5 w-3.5" />} variant="primary" title="登记付款" onClick={() => { setQuickPay(o); setQuickPayAmt(unpaid); }} />
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

      <MFab onClick={openCreate} label="新建采购单" />
      <MBulkBar count={selectedIds.length} onCancel={() => setSelectedIds([])}>
        <button onClick={() => setBulkStatusOpen(true)} className="px-3 h-8 rounded-full bg-mustard/90 text-foreground text-[11px] font-semibold">改状态</button>
      </MBulkBar>

      {/* 编辑 Sheet */}
      <MSheet
        open={open} onOpenChange={setOpen} size="full"
        title={editing ? "编辑采购订单" : "新建采购订单"}
        footer={
          <div className="flex gap-2">
            <MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton>
            <MButton onClick={onSubmit} className="flex-[2]">{editing ? "保存修改" : "创建采购单"}</MButton>
          </div>
        }
      >
        <MGroupTitle>申请信息</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="申请人" required><MSelect value={watch("applicantId")} onChange={(v) => setValue("applicantId", v)} options={employeeOpts} /></MField>
          <MField label="所属部门"><MSelect value={watch("department")} onChange={(v) => setValue("department", v)} options={["集马科技", "集马科技 · 采购部", "集马科技 · 项目部", "集马科技 · 销售部"].map((d) => ({ value: d, label: d }))} /></MField>
        </div>
        <MField label="申请日期" required><MInput type="date" {...register("appliedAt", { required: true })} /></MField>

        <MGroupTitle>合同与签约</MGroupTitle>
        <MField label="供应商" required><MSelect value={watch("supplierId")} onChange={(v) => setValue("supplierId", v)} options={supplierOpts} placeholder="选择供应商" /></MField>
        <MField label="合同名称"><MInput {...register("contractTitle")} placeholder="如：触摸一体机销售合同" /></MField>
        <MField label="签约单位">
          <MSelect value={watch("signingParty")} onChange={(v) => setValue("signingParty", v)} options={["集马科技", "集马科技（深圳）", "集马科技（上海）"].map((n) => ({ value: n, label: n }))} />
        </MField>
        <div className="grid grid-cols-2 gap-3">
          <MField label="签订日期"><MInput type="date" {...register("signedAt")} /></MField>
          <MField label="到期日期"><MInput type="date" {...register("contractExpireAt")} /></MField>
        </div>
        <MField label="关联销售合同">
          <div className="flex items-center gap-2">
            <MSwitch checked={watch("linkedSalesContract")} onChange={(v) => { setValue("linkedSalesContract", v); if (!v) setValue("linkedSalesContractId", ""); }} />
            <span className="text-[12px] text-foreground/60">{watch("linkedSalesContract") ? "已关联" : "未关联"}</span>
          </div>
          {watch("linkedSalesContract") && (
            <div className="mt-2">
              <MSelect value={watch("linkedSalesContractId")} onChange={(v) => setValue("linkedSalesContractId", v)} options={contractOpts} placeholder="选择销售合同" />
            </div>
          )}
        </MField>

        <MGroupTitle>采购执行</MGroupTitle>
        <div className="grid grid-cols-2 gap-3">
          <MField label="采购经理"><MSelect value={watch("buyerId")} onChange={(v) => setValue("buyerId", v)} options={employeeOpts} placeholder="选择" /></MField>
          <MField label="订单状态"><MSelect value={watch("status")} onChange={(v) => { if (v === "cancelled" && watch("status") !== "cancelled" && editing) { setCancelOpen(true); return; } setValue("status", v as any); }} options={STATUS_OPTS} />{watch("status") === "cancelled" && cancelReason && <div className="text-[11px] text-tomato mt-1">取消原因：{cancelReason}</div>}</MField>
          <MField label="预计入库"><MInput type="date" {...register("expectedAt")} /></MField>
          <MField label="下单日期"><MInput type="date" {...register("createdAt")} /></MField>
        </div>

        <MGroupTitle>采购明细</MGroupTitle>
        <MLineItemsEditor items={items} products={products.filter((p) => p.category !== "software")} onChange={setItems} mode="purchase" logModule="purchase" logScope={editing?.id || draftScope} />

        {editing && (
          <>
            <MGroupTitle>子表（折叠查看）</MGroupTitle>
            <MAccordion title="发票管理（供应商开票）" badge={<MTag variant="cobalt">{(watch("invoices") || []).length} 张</MTag>}>
              <MInvoiceList value={watch("invoices") || []} onChange={(v) => setValue("invoices", v)} direction="in" defaultParty={suppliers.find((s) => s.id === watch("supplierId"))?.name} />
            </MAccordion>
            <MAccordion title="付款记录" badge={<MTag variant="mustard">{orderPayments.length} 笔 · {fmtMoney(orderPayments.reduce((s, p) => s + p.amount, 0))}</MTag>}>
              {orderPayments.length === 0 ? (
                <div className="text-center py-4 text-[12px] text-foreground/40">暂无付款</div>
              ) : (
                <div className="space-y-1.5">
                  {orderPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[12px] py-1.5 border-b border-foreground/5">
                      <div>
                        <div className="font-mono">{p.code}</div>
                        <div className="text-[10px] text-foreground/45">{p.paidAt} · {p.method}</div>
                      </div>
                      <div className="font-mono font-bold text-tomato">-{fmtMoney(p.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => { setQuickPay(editing); setQuickPayAmt(Math.max((editing.contractAmount ?? editing.totalAmount) - editing.paid, 0)); }} className="mt-2 w-full h-9 rounded-full bg-tomato text-[hsl(var(--paper))] text-[12px] font-semibold">+ 新增付款</button>
            </MAccordion>
            <MAccordion title="操作日志" badge={<MTag variant="muted">{currentLogs.length} 条</MTag>}>
              <MLogList logs={currentLogs} />
            </MAccordion>
          </>
        )}

        <MGroupTitle>备注</MGroupTitle>
        <MAccordion title="附件资料" badge={<MTag variant="muted">{(watch("contractAttachments") || []).length}</MTag>}>
          <MField label="采购合同附件"><MAttachmentList value={watch("contractAttachments") || []} onChange={(v) => setValue("contractAttachments", v)} /></MField>
        </MAccordion>
        <MField label="备注"><MTextarea rows={3} {...register("remark")} /></MField>
        <div className="text-center text-[11px] text-foreground/45 mt-4 pb-2">明细合计 <span className="font-mono font-bold text-foreground">¥{itemsTotal.toLocaleString()}</span></div>
      </MSheet>

      <MConfirm open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除采购订单" description="已入库订单将自动回滚库存。" onConfirm={handleDelete} confirmText="删除" danger />

      <MSheet open={!!quickPay} onOpenChange={(v) => !v && setQuickPay(null)} title={`登记付款 · ${quickPay?.code || ""}`}
        footer={
          <div className="flex gap-2">
            <MButton variant="ghost" onClick={() => setQuickPay(null)} className="flex-1">取消</MButton>
            <MButton onClick={submitQuickPay} className="flex-[2]" disabled={quickPayAmt <= 0}>确认登记</MButton>
          </div>
        }
      >
        {quickPay && (
          <>
            <MRow label="供应商" value={quickPay.supplierName} />
            <MRow label="合同金额" value={fmtMoney(quickPay.contractAmount ?? quickPay.totalAmount)} mono />
            <MRow label="已付" value={fmtMoney(quickPay.paid)} mono />
            <MRow label="未付" value={fmtMoney(Math.max((quickPay.contractAmount ?? quickPay.totalAmount) - quickPay.paid, 0))} mono />
            <div className="mt-4 space-y-3">
              <MField label="付款金额" required><MInput type="number" step="0.01" value={quickPayAmt} onChange={(e) => setQuickPayAmt(Number(e.target.value))} /></MField>
              <MField label="付款方式">
                <MSelect value={quickPayMethod} onChange={(v) => setQuickPayMethod(v as any)} options={[
                  { value: "对公转账", label: "对公转账" }, { value: "现金", label: "现金" }, { value: "支票", label: "支票" }, { value: "支付宝", label: "支付宝" }, { value: "微信", label: "微信" },
                ]} />
              </MField>
              <MField label="备注"><MTextarea rows={2} value={quickPayRemark} onChange={(e) => setQuickPayRemark(e.target.value)} /></MField>
            </div>
          </>
        )}
      </MSheet>

      <MSheet open={bulkStatusOpen} onOpenChange={setBulkStatusOpen} title={`批量改状态 (${selectedIds.length} 单)`}
        footer={<MButton onClick={applyBulkStatus} className="w-full">确认应用</MButton>}>
        <MField label="目标状态"><MSelect value={bulkStatus} onChange={(v) => setBulkStatus(v as any)} options={STATUS_OPTS} /></MField>
        <p className="text-[11px] text-foreground/55">将更新所选 {selectedIds.length} 单为「{statusLabels[bulkStatus]}」，并联动出入库。</p>
      </MSheet>

      <MSheet open={logOpen} onOpenChange={setLogOpen} title={logRefId ? "订单日志" : "全部采购日志"} size="full">
        <MLogList logs={logRefId ? allLogs.filter((l) => l.refId === logRefId) : allLogs} />
      </MSheet>
    </>
  );
}
