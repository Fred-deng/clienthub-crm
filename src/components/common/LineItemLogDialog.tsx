import { useEffect, useMemo, useState } from "react";
import { History, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listLineItemLogs, type LineItemLog, type LineItemLogModule } from "@/services/lineItemLog";
import { fmtMoney } from "@/lib/format";

interface Props {
  module: LineItemLogModule;
  scope: string;
  /** 透传给按钮的可见性 / 样式 */
  buttonClassName?: string;
  /** 对外暴露的「刷新计数」依赖：传入会触发重新读取，例如行变更时间戳 */
  refreshKey?: any;
}

const actionMeta: Record<LineItemLog["action"], { label: string; cls: string; Icon: any }> = {
  add:    { label: "新增", cls: "bg-mint/25 text-foreground ring-mint/40",       Icon: Plus },
  update: { label: "修改", cls: "bg-cobalt/12 text-cobalt ring-cobalt/25",       Icon: Pencil },
  delete: { label: "删除", cls: "bg-tomato/15 text-tomato ring-tomato/30",       Icon: Trash2 },
};

export function LineItemLogButton({ module, scope, buttonClassName, refreshKey }: Props) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LineItemLog[]>([]);

  const reload = () => setLogs(listLineItemLogs(module, scope));

  useEffect(() => { reload(); }, [open, scope, refreshKey]); // eslint-disable-line

  const count = useMemo(
    () => listLineItemLogs(module, scope).length,
    [scope, refreshKey, open],
  );

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={buttonClassName ?? "h-7 text-xs"}
        onClick={() => setOpen(true)}
        title="查看明细操作日志"
      >
        <History className="h-3 w-3 mr-1" />明细日志
        {count > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-foreground/10 text-[10px] font-semibold">
            {count}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>明细操作日志（共 {logs.length} 条）</DialogTitle>
          </DialogHeader>

          {logs.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              暂无明细日志，添加 / 修改 / 删除产品行时会自动记录。
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => {
                const m = actionMeta[l.action];
                const Icon = m.Icon;
                return (
                  <div key={l.id} className="rounded-lg border border-border bg-card p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`cell-chip ring-1 inline-flex items-center gap-1 ${m.cls}`}>
                        <Icon className="h-3 w-3" />{m.label}
                      </span>
                      <span className="font-semibold text-foreground">{l.productName}</span>
                      <span className="ml-auto text-foreground/55 mono text-[11px]">{l.createdAt}</span>
                      <span className="text-foreground/65">· {l.operator}</span>
                    </div>

                    {l.action === "update" && l.changes && (
                      <div className="space-y-1 pl-1">
                        {l.changes.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-[12px]">
                            <span className="text-foreground/55 min-w-[48px]">{c.field}：</span>
                            <span className="line-through text-foreground/45">{String(c.before ?? "—")}</span>
                            <span className="text-foreground/40">→</span>
                            <span className="font-semibold">{String(c.after ?? "—")}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {(l.action === "add" || l.action === "delete") && l.snapshot && (
                      <div className="grid grid-cols-4 gap-2 text-[12px] pl-1 text-foreground/75">
                        <div>分类：<span className="font-semibold text-foreground">{l.snapshot.category}</span></div>
                        <div>数量：<span className="font-semibold text-foreground">{l.snapshot.qty}</span></div>
                        <div>单价：<span className="font-semibold text-foreground">{fmtMoney(l.snapshot.price ?? 0)}</span></div>
                        <div>小计：<span className="font-semibold text-foreground">{fmtMoney((l.snapshot.qty ?? 0) * (l.snapshot.price ?? 0))}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
