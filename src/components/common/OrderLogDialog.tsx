import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { orderLogApi, type OrderLog, type OrderLogModule } from "@/services/orderLog";
import { employees } from "@/mock/data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  module: OrderLogModule;
  refId?: string;        // 不传则查全部
  refCode?: string;
  title?: string;
}

const actionLabel = { update: "修改", delete: "删除" } as const;
const actionTone = {
  update: "bg-cobalt/10 text-cobalt",
  delete: "bg-tomato/10 text-tomato",
} as const;

export function OrderLogDialog({ open, onOpenChange, module, refId, refCode, title }: Props) {
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [keyword, setKeyword] = useState("");
  const [operator, setOperator] = useState("all");
  const [action, setAction] = useState("all");

  useEffect(() => {
    if (!open) return;
    orderLogApi.list({ module, refId, keyword, operator, action }).then(setLogs);
  }, [open, module, refId, keyword, operator, action]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {title || (refId ? `订单操作日志 · ${refCode}` : `${module === "purchase" ? "采购订单" : "销售订单"}操作日志`)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <Input className="pl-8 h-8 w-56 text-xs" placeholder="搜索单号/操作人/字段" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          {!refId && (
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部操作人</SelectItem>
                {employees.map((e) => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部动作</SelectItem>
              <SelectItem value="update">修改</SelectItem>
              <SelectItem value="delete">删除</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-muted-foreground">共 <span className="font-bold text-foreground mono">{logs.length}</span> 条</div>
        </div>

        <div className="space-y-2">
          {logs.length === 0 && <div className="empty py-8 text-center text-xs text-muted-foreground">暂无操作记录</div>}
          {logs.map((l) => (
            <div key={l.id} className="border border-border rounded-md p-3 bg-card/40">
              <div className="flex items-center gap-2 text-xs">
                <span className={"cell-chip " + actionTone[l.action]}>{actionLabel[l.action]}</span>
                <span className="font-mono text-foreground/80">{l.refCode}</span>
                <span className="text-foreground/45">·</span>
                <span className="font-semibold">{l.operator}</span>
                <span className="ml-auto font-mono text-[11px] text-foreground/55">{l.createdAt}</span>
              </div>
              {l.action === "update" && l.changes.length > 0 && (
                <div className="mt-2 grid gap-1.5">
                  {l.changes.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 text-[12px] items-start">
                      <div className="col-span-3 text-foreground/55">{c.field}</div>
                      <div className="col-span-4 text-tomato/85 line-through truncate" title={String(c.before)}>{String(c.before)}</div>
                      <div className="col-span-1 text-center text-foreground/35">→</div>
                      <div className="col-span-4 text-mint truncate" title={String(c.after)}>{String(c.after)}</div>
                    </div>
                  ))}
                </div>
              )}
              {l.remark && <div className="mt-1 text-[11px] text-foreground/55">{l.remark}</div>}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
