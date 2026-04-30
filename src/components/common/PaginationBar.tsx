import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ page, pageSize, total, onPageChange }: PaginationBarProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // build a small page window
  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) window.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-foreground/[0.06] text-xs">
      <div className="text-foreground/55">
        共 <span className="text-foreground font-mono font-bold">{total}</span> 条 ·
        每页 <span className="text-foreground font-mono">{pageSize}</span> 条
      </div>
      <div className="flex items-center gap-1.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="size-8 rounded-full border border-foreground/10 hover:border-foreground/30 hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {window.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={
              "min-w-8 h-8 px-2.5 rounded-full text-xs font-mono font-bold transition-all " +
              (p === page
                ? "bg-foreground text-background shadow-[2px_2px_0_0_hsl(var(--tomato))]"
                : "text-foreground/55 hover:text-foreground hover:bg-foreground/5")
            }
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="size-8 rounded-full border border-foreground/10 hover:border-foreground/30 hover:bg-card flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
