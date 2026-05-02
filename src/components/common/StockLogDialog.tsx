import { useEffect, useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { stockLogApi } from "@/services/inventory";
import type { StockLog, StockLogAction } from "@/types";

const actionLabel: Record<StockLogAction, string> = {
  create: "新建",
  update: "信息修改",
  delete: "删除",
  in: "入库",
  out: "出库",
  adjust: "手工调整",
};
const actionTone: Record<StockLogAction, string> = {
  create: "bg-cobalt/10 text-cobalt",
  update: "bg-foreground/10 text-foreground",
  delete: "bg-tomato/10 text-tomato",
  in: "bg-mint/15 text-mint",
  out: "bg-warning/10 text-warning",
  adjust: "bg-foreground/10 text-foreground/70",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 不传则显示全部产品的日志 */
  productId?: string;
  productName?: string;
}

export function StockLogDialog({ open, onOpenChange, productId, productName }: Props) {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [keyword, setKeyword] = useState("");
  const [action, setAction] = useState<string>("all");

  useEffect(() => {
    if (!open) return;
    stockLogApi.list({ productId, keyword, action, page: 1, pageSize: 200 }).then((r) => setLogs(r.list));
  }, [open, productId, keyword, action]);

  const total = useMemo(() => logs.reduce((s, l) => s + l.delta, 0), [logs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            库存变动日志{productName ? ` · ${productName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input className="pl-8 h-8 w-60 text-xs" placeholder="搜索产品/单号/备注" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部动作</SelectItem>
              {Object.entries(actionLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">
            共 <span className="font-bold text-foreground mono">{logs.length}</span> 条 · 累计变动 <span className={"font-bold mono " + (total >= 0 ? "text-mint" : "text-tomato")}>{total >= 0 ? "+" : ""}{total}</span>
          </div>
        </div>
        <div className="overflow-x-auto border border-border rounded-md">
          <table className="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>产品</th>
                <th>动作</th>
                <th className="num">变动</th>
                <th className="num">变动前</th>
                <th className="num">变动后</th>
                <th>来源单据</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={9} className="empty py-8 text-center text-xs text-muted-foreground">暂无日志</td></tr>}
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="text-[11px] mono text-foreground/60 whitespace-nowrap">{l.createdAt}</td>
                  <td className="text-xs">{l.productName}</td>
                  <td><span className={"cell-chip " + actionTone[l.action]}>{actionLabel[l.action]}</span></td>
                  <td className={"num mono font-bold " + (l.delta > 0 ? "text-mint" : l.delta < 0 ? "text-tomato" : "text-foreground/40")}>
                    {l.delta > 0 ? "+" : ""}{l.delta}
                  </td>
                  <td className="num mono text-foreground/60">{l.beforeStock}</td>
                  <td className="num mono">{l.afterStock}</td>
                  <td className="text-[11px] mono text-foreground/60">{l.refCode || "—"}</td>
                  <td className="text-xs text-foreground/70">{l.operator || "—"}</td>
                  <td className="text-[11px] text-foreground/60">{l.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
