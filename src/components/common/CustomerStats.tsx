// 客户统计：按客户状态 + 公海/私海 维度展示
import { useMemo } from "react";
import type { Customer } from "@/types";
import { customerStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  potential: "bg-cobalt/12 text-cobalt ring-cobalt/25",
  intent: "bg-mustard/25 text-foreground ring-mustard/40",
  active: "bg-mint/25 text-foreground ring-mint/40",
  paused: "bg-mustard/15 text-foreground/70 ring-mustard/30",
  inactive: "bg-foreground/5 text-foreground/65 ring-foreground/15",
  lost: "bg-tomato/12 text-tomato ring-tomato/30",
};

export function CustomerStats({
  list,
  activeStatus = "all",
  activeSea = "all",
  onStatusClick,
  onSeaClick,
  variant = "pc",
}: {
  list: Customer[];
  activeStatus?: string;
  activeSea?: string;
  onStatusClick?: (s: string) => void;
  onSeaClick?: (s: string) => void;
  variant?: "pc" | "mobile";
}) {
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    let pub = 0, priv = 0;
    list.forEach((c) => {
      const s = c.status || "potential";
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (c.seaStatus === "公海") pub++;
      else priv++;
    });
    return { byStatus, pub, priv, total: list.length };
  }, [list]);

  const Chip = ({ active, label, count, tone, onClick }: { active: boolean; label: string; count: number; tone?: string; onClick?: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-8 rounded-full ring-1 transition-all whitespace-nowrap",
        active
          ? "bg-foreground text-[hsl(var(--paper))] ring-foreground shadow-sm"
          : tone || "bg-card ring-foreground/10 text-foreground/75 hover:bg-foreground/5"
      )}
    >
      <span className={variant === "mobile" ? "text-[11px] font-semibold" : "text-[12px] font-semibold"}>{label}</span>
      <span className={cn("text-[11px] font-mono tabular-nums", active ? "text-[hsl(var(--paper))]/80" : "text-foreground/55")}>{count}</span>
    </button>
  );

  return (
    <div className={cn(
      variant === "pc"
        ? "bg-card rounded-2xl border border-foreground/[0.07] p-4 mb-5 md:mb-6"
        : "bg-card rounded-2xl border border-foreground/8 mx-4 mb-3 p-3"
    )}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="size-1.5 rounded-full bg-tomato" />
        <span className={cn("font-mono uppercase tracking-[0.2em] text-foreground/50",
          variant === "pc" ? "text-[10px] font-bold" : "text-[9px] font-bold")}>
          Customer Stats · {stats.total}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1.5">
        <Chip
          active={activeSea === "all" && activeStatus === "all"}
          label="全部"
          count={stats.total}
          onClick={() => { onStatusClick?.("all"); onSeaClick?.("all"); }}
        />
        <span className="h-5 w-px bg-foreground/10 mx-1" />
        <Chip active={activeSea === "私海"} label="私海" count={stats.priv} tone="bg-cobalt/8 text-cobalt ring-cobalt/20" onClick={() => onSeaClick?.(activeSea === "私海" ? "all" : "私海")} />
        <Chip active={activeSea === "公海"} label="公海" count={stats.pub} tone="bg-mustard/15 text-foreground ring-mustard/30" onClick={() => onSeaClick?.(activeSea === "公海" ? "all" : "公海")} />
        <span className="h-5 w-px bg-foreground/10 mx-1" />
        {Object.entries(customerStatusLabel).map(([v, label]) => (
          <Chip
            key={v}
            active={activeStatus === v}
            label={label}
            count={stats.byStatus[v] || 0}
            tone={TONE[v]}
            onClick={() => onStatusClick?.(activeStatus === v ? "all" : v)}
          />
        ))}
      </div>
    </div>
  );
}
