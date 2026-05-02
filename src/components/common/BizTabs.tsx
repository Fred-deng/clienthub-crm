// 全/软件/硬件 三段式 tab
import { cn } from "@/lib/utils";
import type { BizFilter } from "@/lib/biz";

interface BizTabsProps {
  value: BizFilter;
  onChange: (v: BizFilter) => void;
  className?: string;
}

const items: { value: BizFilter; label: string; tone: string }[] = [
  { value: "all", label: "全部", tone: "bg-foreground text-background" },
  { value: "software", label: "软件", tone: "bg-cobalt text-white" },
  { value: "hardware", label: "硬件", tone: "bg-mint text-foreground" },
];

export function BizTabs({ value, onChange, className }: BizTabsProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 p-1 rounded-full bg-foreground/[0.05] border border-foreground/10", className)}>
      {items.map((it) => {
        const active = value === it.value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              "px-3.5 h-7 rounded-full text-xs font-semibold transition-all",
              active ? it.tone + " shadow-sm" : "text-foreground/55 hover:text-foreground",
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// 软硬件并列对比小芯片（用于 KPI 副信息）
export function BizSplitChip({ software, hardware, formatter }: { software: number; hardware: number; formatter: (n: number) => string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium">
      <span className="inline-flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-cobalt" />
        <span className="text-foreground/55">软</span>
        <span className="font-bold text-foreground tabular-nums">{formatter(software)}</span>
      </span>
      <span className="text-foreground/20">·</span>
      <span className="inline-flex items-center gap-1">
        <span className="size-1.5 rounded-full bg-mint" />
        <span className="text-foreground/55">硬</span>
        <span className="font-bold text-foreground tabular-nums">{formatter(hardware)}</span>
      </span>
    </span>
  );
}
