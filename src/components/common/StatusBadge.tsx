import { cn } from "@/lib/utils";
import { statusLabels, statusTone } from "@/lib/format";

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const toneClasses: Record<string, string> = {
  primary: "bg-tomato text-primary-foreground",
  accent: "bg-mint text-foreground",
  muted: "bg-foreground/10 text-foreground",
  destructive: "bg-tomato text-primary-foreground",
  warning: "bg-mustard text-foreground",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const tone = statusTone[status] || "muted";
  const text = label || statusLabels[status] || status;
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap",
      toneClasses[tone]
    )}>
      {text}
    </span>
  );
}
