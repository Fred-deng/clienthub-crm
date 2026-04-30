import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "warning" | "accent" | "destructive";
  icon?: ReactNode;
}

const toneAccent: Record<string, string> = {
  default: "bg-foreground/40",
  primary: "bg-primary",
  warning: "bg-warning",
  accent: "bg-accent",
  destructive: "bg-destructive",
};

export function KpiCard({ label, value, hint, tone = "default", icon }: KpiCardProps) {
  return (
    <div className="relative bg-card border border-border p-5 group hover:border-primary/40 transition-colors overflow-hidden">
      <div className={cn("absolute top-0 left-0 w-0.5 h-full", toneAccent[tone])} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground/60 group-hover:text-primary transition-colors">{icon}</div>}
      </div>
      <div className="text-2xl font-semibold text-foreground tabular-nums tracking-tight font-mono">
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
