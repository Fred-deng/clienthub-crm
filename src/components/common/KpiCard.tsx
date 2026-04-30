import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "warning" | "accent" | "destructive";
  icon?: ReactNode;
}

// Map semantic tones to Memphis color blocks
const toneStyles: Record<string, { bg: string; text: string; hint: string; rotate: string }> = {
  default: {
    bg: "bg-card border-2 border-foreground/10",
    text: "text-foreground",
    hint: "text-foreground/60",
    rotate: "hover:rotate-1",
  },
  primary: {
    bg: "bg-tomato",
    text: "text-primary-foreground",
    hint: "text-primary-foreground/80",
    rotate: "hover:rotate-2",
  },
  warning: {
    bg: "bg-mustard",
    text: "text-foreground",
    hint: "text-foreground/70",
    rotate: "hover:-rotate-2",
  },
  accent: {
    bg: "bg-mint",
    text: "text-foreground",
    hint: "text-foreground/70",
    rotate: "hover:rotate-2",
  },
  destructive: {
    bg: "bg-cobalt",
    text: "text-secondary-foreground",
    hint: "text-mint",
    rotate: "hover:-rotate-2",
  },
};

export function KpiCard({ label, value, hint, tone = "default", icon }: KpiCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className={cn(
        "relative rounded-[40px] p-7 flex flex-col justify-between aspect-square overflow-hidden transition-transform duration-300 cursor-default",
        s.bg,
        s.text,
        s.rotate,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-display italic text-lg font-medium leading-tight">{label}</span>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <div>
        <div className="font-display font-black text-5xl lg:text-6xl tabular-nums tracking-tighter leading-none">
          {value}
        </div>
        {hint && <div className={cn("mt-2 text-sm font-bold", s.hint)}>{hint}</div>}
      </div>
    </div>
  );
}
