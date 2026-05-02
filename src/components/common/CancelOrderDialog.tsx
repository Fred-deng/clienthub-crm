// 订单取消二次确认 + 必填原因
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const REASONS = ["客户取消", "供应商断货", "价格变动", "信息错误", "重复下单", "其他"];

export function CancelOrderDialog({
  open,
  onOpenChange,
  title = "确认取消订单",
  refCode,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  refCode?: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string>("客户取消");
  const [detail, setDetail] = useState("");

  useEffect(() => { if (open) { setReason("客户取消"); setDetail(""); } }, [open]);

  const submit = () => {
    const r = reason === "其他" ? (detail.trim() || "其他") : (detail.trim() ? `${reason}：${detail.trim()}` : reason);
    onConfirm(r);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}{refCode ? ` · ${refCode}` : ""}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-foreground/65">取消后将记录原因到操作日志，已过账的库存会自动回滚。</div>
          <div>
            <Label className="text-xs">取消原因</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">补充说明{reason === "其他" ? "（必填）" : "（可选）"}</Label>
            <Textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="详细说明取消原因…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>返回</Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={reason === "其他" && !detail.trim()}
            onClick={submit}
          >确认取消</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
