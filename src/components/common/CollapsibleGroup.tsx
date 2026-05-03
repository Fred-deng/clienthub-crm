import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 可折叠分组标题（DOM 兄弟遍历方式）
 * - 不需要改变现有 <GroupTitle> + <Field> 平铺结构
 * - 点击后将后续兄弟节点（直到下一个同类 GroupTitle）切换显隐
 * - 通过 storageKey + title 持久化折叠状态到 localStorage
 *
 * 使用：将原 GroupTitle 替换为 CollapsibleGroupTitle 即可。
 * 注意：必须用 grid grid-cols-12 父容器，组件本身占满整行。
 */
export function CollapsibleGroupTitle({
  children,
  storageKey,
  defaultOpen = true,
  tone = "ink",
}: {
  children: ReactNode;
  storageKey: string; // 推荐：page 名称，如 'customers'
  defaultOpen?: boolean;
  tone?: "ink" | "tomato" | "mint" | "mustard" | "cobalt";
}) {
  const titleStr = typeof children === "string" ? children : String(children);
  const memKey = `jm.group.${storageKey}.${titleStr}`;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(memKey);
      return v === null ? defaultOpen : v === "1";
    } catch { return defaultOpen; }
  });

  // 切换时遍历兄弟节点直到遇到下一个同类 group title
  const apply = (next: boolean) => {
    const me = wrapRef.current;
    if (!me) return;
    let n = me.nextElementSibling as HTMLElement | null;
    while (n) {
      if (n.dataset && n.dataset.groupTitle === "1") break;
      // 跳过：DialogFooter 等 footer 元素也属于本组的尾部，不应被折叠遮挡
      if (n.dataset && n.dataset.groupSkip === "1") { n = n.nextElementSibling as HTMLElement | null; continue; }
      n.style.display = next ? "" : "none";
      n = n.nextElementSibling as HTMLElement | null;
    }
  };

  useEffect(() => { apply(open); /* 初次挂载即应用 */ /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    apply(open);
    try { localStorage.setItem(memKey, open ? "1" : "0"); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toneCls: Record<string, string> = {
    ink: "bg-foreground text-background",
    tomato: "bg-tomato text-[hsl(var(--paper))]",
    mint: "bg-mint text-foreground",
    mustard: "bg-mustard text-foreground",
    cobalt: "bg-cobalt text-[hsl(var(--paper))]",
  };

  return (
    <div
      ref={wrapRef}
      data-group-title="1"
      className="col-span-12 flex items-center gap-3 mt-2 first:mt-0"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold tracking-wide transition-opacity hover:opacity-90",
          toneCls[tone],
        )}
        aria-expanded={open}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
        <span>{children}</span>
      </button>
      <div className="flex-1 h-px bg-foreground/10" />
    </div>
  );
}
