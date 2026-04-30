import { cn } from "@/lib/utils";
import { statusLabels, statusTone } from "@/lib/format";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const toneClasses: Record<string, { dot: string; text: string; bg: string }> = {
  primary:     { dot: "bg-tomato",        text: "text-[hsl(8_60%_38%)]",   bg: "bg-tomato/[0.08]    ring-tomato/15" },
  accent:      { dot: "bg-mint",          text: "text-[hsl(152_38%_30%)]", bg: "bg-mint/[0.14]      ring-mint/25" },
  muted:       { dot: "bg-foreground/35", text: "text-foreground/65",      bg: "bg-foreground/[0.05] ring-foreground/10" },
  destructive: { dot: "bg-tomato",        text: "text-[hsl(8_60%_38%)]",   bg: "bg-tomato/[0.08]    ring-tomato/15" },
  warning:     { dot: "bg-mustard",       text: "text-[hsl(32_72%_36%)]",  bg: "bg-mustard/[0.16]   ring-mustard/30" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = statusTone[status] || "muted";
  const t = toneClasses[tone];
  const text = label || statusLabels[status] || status;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
      t.bg, t.text,
    )}>
      <span className={cn("size-1.5 rounded-full", t.dot)} />
      {text}
    </span>
  );
}
