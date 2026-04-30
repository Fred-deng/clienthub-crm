import { cn } from "@/lib/utils";
import { statusLabels, statusTone } from "@/lib/format";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const toneClasses: Record<string, { dot: string; text: string; bg: string }> = {
  primary:     { dot: "bg-tomato",  text: "text-foreground",            bg: "bg-tomato/10  ring-tomato/20" },
  accent:      { dot: "bg-mint",    text: "text-foreground",            bg: "bg-mint/15    ring-mint/30" },
  muted:       { dot: "bg-foreground/40", text: "text-foreground/70",   bg: "bg-foreground/[0.06] ring-foreground/10" },
  destructive: { dot: "bg-tomato",  text: "text-tomato",                bg: "bg-tomato/10  ring-tomato/25" },
  warning:     { dot: "bg-mustard", text: "text-foreground",            bg: "bg-mustard/20 ring-mustard/40" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = statusTone[status] || "muted";
  const t = toneClasses[tone];
  const text = label || statusLabels[status] || status;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ring-1 ring-inset",
      t.bg, t.text,
    )}>
      <span className={cn("size-1.5 rounded-full", t.dot)} />
      {text}
    </span>
  );
}
