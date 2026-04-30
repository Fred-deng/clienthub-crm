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

const toneStyles: Record<string, {
  accent: string;       // strong color (bar, dot)
  accentText: string;   // text in accent color
  iconBg: string;       // icon chip
  glow: string;         // soft tint behind number
}> = {
  default: {
    accent: "bg-foreground",
    accentText: "text-foreground",
    iconBg: "bg-foreground/[0.06] text-foreground/70",
    glow: "from-foreground/[0.04]",
  },
  primary: {
    accent: "bg-tomato",
    accentText: "text-tomato",
    iconBg: "bg-tomato/10 text-tomato",
    glow: "from-tomato/[0.07]",
  },
  warning: {
    accent: "bg-mustard",
    accentText: "text-[hsl(32_72%_38%)]",
    iconBg: "bg-mustard/15 text-[hsl(32_72%_38%)]",
    glow: "from-mustard/[0.08]",
  },
  accent: {
    accent: "bg-mint",
    accentText: "text-[hsl(152_38%_32%)]",
    iconBg: "bg-mint/15 text-[hsl(152_38%_32%)]",
    glow: "from-mint/[0.08]",
  },
  destructive: {
    accent: "bg-cobalt",
    accentText: "text-cobalt",
    iconBg: "bg-cobalt/10 text-cobalt",
    glow: "from-cobalt/[0.07]",
  },
};

export function KpiCard({ label, value, hint, tone = "default", icon, index }: KpiCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className={cn(
        "group relative rounded-3xl bg-card border border-foreground/[0.07]",
        "p-6 pt-7 flex flex-col justify-between min-h-[180px] overflow-hidden",
        "transition-all duration-300 cursor-default",
        "shadow-[0_1px_2px_0_hsl(var(--ink)/0.04)]",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_hsl(var(--ink)/0.15)] hover:border-foreground/15",
      )}
    >
      {/* top accent bar */}
      <div className={cn("absolute left-6 right-6 top-0 h-[3px] rounded-b-full", s.accent)} />

      {/* soft glow behind number */}
      <div className={cn("absolute -bottom-12 -right-8 size-48 rounded-full bg-gradient-to-tl to-transparent blur-2xl opacity-90", s.glow)} />

      {/* header: index + label + icon */}
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-2.5 min-w-0">
          {typeof index === "number" && (
            <span className={cn(
              "font-mono text-[10px] font-bold tracking-[0.15em] tabular-nums",
              "px-1.5 py-0.5 rounded-md bg-foreground/[0.04] text-foreground/45",
            )}>
              {String(index).padStart(2, "0")}
            </span>
          )}
          <span className="text-[12px] font-semibold tracking-wide text-foreground/55 uppercase truncate">
            {label}
          </span>
        </div>
        {icon && (
          <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0", s.iconBg)}>
            {icon}
          </div>
        )}
      </div>

      {/* value */}
      <div className="relative mt-3">
        <div className="font-display font-black text-foreground text-[40px] leading-[1.05] tabular-nums tracking-tight whitespace-nowrap">
          {value}
        </div>
        {hint && (
          <div className={cn("mt-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide", s.accentText)}>
            <span className={cn("size-1.5 rounded-full", s.accent)} />
            <span className="text-foreground/65 font-medium">{hint}</span>
          </div>
        )}
      </div>
    </div>
  );
}
