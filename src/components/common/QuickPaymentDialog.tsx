// 快捷登记 收/付款 对话框（可在订单列表行内、订单编辑表单内复用）
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentApi } from "@/services/api";
import { fmtMoney } from "@/lib/format";

export type PaymentDir = "in" | "out";

export function QuickPaymentDialog({
  open,
  onOpenChange,
  direction,
  refType,
  refId,
  refCode,
  partyName,
  remaining,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  direction: PaymentDir;
  refType: "sales" | "purchase";
  refId: string;
  refCode: string;
  partyName: string;
  remaining?: number;
  onSaved?: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("对公转账");
  const [paidAt, setPaidAt] = useState(today);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(remaining && remaining > 0 ? remaining : 0);
      setMethod("对公转账");
      setPaidAt(today);
      setRemark("");
    }
  }, [open]);

  const submit = async () => {
    if (!refId) return toast.error("缺少关联单据");
    if (!amount || amount <= 0) return toast.error("请输入金额");
    setSaving(true);
    try {
      await paymentApi.create({
        direction,
        refType,
        refId,
        refCode,
        partyName,
        amount: Number(amount),
        method: method as any,
        paidAt,
        remark,
        code: `${direction === "in" ? "RC" : "PY"}-${Date.now().toString().slice(-6)}`,
      } as any);
      toast.success(direction === "in" ? "回款已登记" : "付款已登记");
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{direction === "in" ? "登记回款" : "登记付款"} · {refCode}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2 px-3 py-2 rounded bg-foreground/[0.04] text-xs text-foreground/70">
            对手方：<span className="font-semibold text-foreground">{partyName || "—"}</span>
            {typeof remaining === "number" && (
              <span className="ml-3">未{direction === "in" ? "收" : "付"}：<span className="mono font-semibold text-tomato">{fmtMoney(Math.max(remaining, 0))}</span></span>
            )}
          </div>
          <div className="col-span-2">
            <Label className="text-xs">金额</Label>
            <Input type="number" step="0.01" className="mono text-right" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">方式</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["对公转账", "现金", "支票", "支付宝", "微信"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">日期</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">备注</Label>
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="可选" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="button" onClick={submit} disabled={saving}>{saving ? "保存中…" : "登记"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
