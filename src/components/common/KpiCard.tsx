import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "warning" | "accent" | "destructive";
  icon?: ReactNode;
  index?: number;
}

const toneStyles: Record<string, { bg: string; text: string; hint: string; tilt: string; deco: string; chip: string }> = {
  default: {
    bg: "bg-card border-2 border-foreground/10",
    text: "text-foreground",
    hint: "text-foreground/60",
    tilt: "hover:-translate-y-1",
    deco: "bg-foreground/10",
    chip: "bg-foreground/5 text-foreground/70",
  },
  primary: {
    bg: "bg-tomato",
    text: "text-primary-foreground",
    hint: "text-primary-foreground/85",
    tilt: "hover:-translate-y-1 hover:rotate-[0.6deg]",
    deco: "bg-mustard",
    chip: "bg-white/15 text-white",
  },
  warning: {
    bg: "bg-mustard",
    text: "text-foreground",
    hint: "text-foreground/70",
    tilt: "hover:-translate-y-1 hover:-rotate-[0.6deg]",
    deco: "bg-tomato",
    chip: "bg-foreground/10 text-foreground",
  },
  accent: {
    bg: "bg-mint",
    text: "text-foreground",
    hint: "text-foreground/70",
    tilt: "hover:-translate-y-1 hover:rotate-[0.6deg]",
    deco: "bg-cobalt",
    chip: "bg-foreground/10 text-foreground",
  },
  destructive: {
    bg: "bg-cobalt",
    text: "text-secondary-foreground",
    hint: "text-mint",
    tilt: "hover:-translate-y-1 hover:-rotate-[0.6deg]",
    deco: "bg-mustard",
    chip: "bg-white/15 text-white",
  },
};

export function KpiCard({ label, value, hint, tone = "default", icon, index }: KpiCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className={cn(
        "group relative rounded-[32px] p-6 flex flex-col justify-between min-h-[200px] overflow-hidden transition-all duration-500 cursor-default shadow-[0_1px_0_0_hsl(0_0%_0%/0.04)] hover:shadow-[6px_8px_0_0_hsl(0_0%_0%/0.08)]",
        s.bg,
        s.text,
        s.tilt,
      )}
    >
      {/* corner deco */}
      <div className={cn("absolute -right-8 -top-8 size-24 rounded-full opacity-20", s.deco)} />
      <div className={cn("absolute right-5 bottom-5 size-1.5 rounded-full opacity-50", s.deco)} />

      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex items-center gap-2">
          {typeof index === "number" && (
            <span className="font-mono text-[10px] tracking-widest opacity-60">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <span className="font-display italic text-base font-medium leading-tight">{label}</span>
        </div>
        {icon && (
          <div className={cn("size-8 rounded-full flex items-center justify-center", s.chip)}>
            {icon}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="font-display font-black text-[44px] leading-[1] tabular-nums tracking-tight whitespace-nowrap">
          {value}
        </div>
        {hint && (
          <div className={cn("mt-3 text-xs font-semibold tracking-wide", s.hint)}>
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
