// 快捷新增发票对话框（销售/采购订单列表行内可用）
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salesApi, purchaseApi } from "@/services/api";
import type { InvoiceRecord } from "@/types";

const TYPE_OPTS = ["增值税专用发票", "增值税普通发票", "电子普通发票", "电子专用发票", "其他"];
const TAX_OPTS = [0, 1, 3, 6, 9, 13];

export function QuickInvoiceDialog({
  open,
  onOpenChange,
  refType,        // sales=我方开给客户(out)，purchase=供应商开给我方(in)
  refId,
  refCode,
  partyName,      // 客户名 或 供应商名
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  refType: "sales" | "purchase";
  refId: string;
  refCode: string;
  partyName: string;
  existing: InvoiceRecord[];
  onSaved?: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceType, setInvoiceType] = useState(TYPE_OPTS[0]);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [amount, setAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(13);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const isOut = refType === "sales";
  const partyLabel = isOut ? "购买方（客户）" : "销售方（供应商）";
  const statusOpts = isOut ? ["已开具", "待开具", "红冲"] : ["已收到", "未收到", "红冲"];
  const [status, setStatus] = useState(statusOpts[0]);

  useEffect(() => {
    if (open) {
      setInvoiceNo("");
      setInvoiceType(TYPE_OPTS[0]);
      setInvoiceDate(today);
      setAmount(0);
      setTaxRate(13);
      setStatus(statusOpts[0]);
      setRemark("");
    }
  }, [open]);

  const submit = async () => {
    if (!refId) return toast.error("缺少关联单据");
    if (!amount || amount <= 0) return toast.error("请输入价税合计");
    const taxAmount = Number(((amount * taxRate) / (100 + taxRate)).toFixed(2));
    const rec: InvoiceRecord = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      invoiceNo,
      invoiceType,
      invoiceDate,
      amount: Number(amount),
      taxRate: Number(taxRate),
      taxAmount,
      buyerOrSeller: partyName,
      status,
      remark,
    };
    setSaving(true);
    try {
      const next = [...(existing || []), rec];
      if (isOut) await salesApi.update(refId, { invoices: next } as any);
      else await purchaseApi.update(refId, { invoices: next } as any);
      toast.success("发票已新增");
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>新增发票 · {refCode}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2 px-3 py-2 rounded bg-foreground/[0.04] text-xs text-foreground/70">
            {partyLabel}：<span className="font-semibold text-foreground">{partyName || "—"}</span>
          </div>
          <div>
            <Label className="text-xs">发票号码</Label>
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">发票类型</Label>
            <Select value={invoiceType} onValueChange={setInvoiceType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPE_OPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">开票日期</Label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">状态</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statusOpts.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">税率（%）</Label>
            <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TAX_OPTS.map((t) => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">价税合计</Label>
            <Input type="number" step="0.01" className="mono text-right" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">备注</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" onClick={submit} disabled={saving}>{saving ? "保存中…" : "新增发票"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
