import { cn } from "@/lib/utils";
import { statusLabels, statusTone } from "@/lib/format";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const toneClasses: Record<string, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  accent: "bg-accent/15 text-accent border-accent/30",
  muted: "bg-muted text-muted-foreground border-border",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-warning/15 text-warning border-warning/30",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = statusTone[status] || "muted";
  const text = label || statusLabels[status] || status;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border",
      toneClasses[tone]
    )}>
      {text}
    </span>
  );
}
