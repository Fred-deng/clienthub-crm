import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 表单分组（可折叠）— 用于 PC 端详情/编辑表单中替代原 <GroupTitle>。
 * 使用方式：
 *   <CollapsibleGroup title="基础信息">
 *     <Field ... /> <Field ... />
 *   </CollapsibleGroup>
 * 内部仍保留 12 列网格，子元素 Field 的 col-span-* 继续生效。
 */
export function CollapsibleGroup({
  title,
  defaultOpen = true,
  storageKey,
  tone = "ink",
  action,
  children,
}: {
  title: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  tone?: "ink" | "tomato" | "mint" | "mustard" | "cobalt";
  action?: ReactNode;
  children: ReactNode;
}) {
  const fullKey = storageKey ? `jm.group.${storageKey}` : null;
  const [open, setOpen] = useState<boolean>(() => {
    if (!fullKey) return defaultOpen;
    try {
      const v = localStorage.getItem(fullKey);
      return v === null ? defaultOpen : v === "1";
    } catch { return defaultOpen; }
  });
  const toggle = () => {
    setOpen((v) => {
      const n = !v;
      if (fullKey) { try { localStorage.setItem(fullKey, n ? "1" : "0"); } catch {} }
      return n;
    });
  };
  const toneCls: Record<string, string> = {
    ink: "bg-foreground text-background",
    tomato: "bg-tomato text-[hsl(var(--paper))]",
    mint: "bg-mint text-foreground",
    mustard: "bg-mustard text-foreground",
    cobalt: "bg-cobalt text-[hsl(var(--paper))]",
  };
  return (
    <div className="col-span-12">
      <div className="flex items-center gap-3 mt-2 first:mt-0">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold tracking-wide transition-opacity hover:opacity-90",
            toneCls[tone],
          )}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
          <span>{title}</span>
        </button>
        <div className="flex-1 h-px bg-foreground/10" />
        {action}
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-12 gap-x-4 gap-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
