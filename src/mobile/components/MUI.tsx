// 移动端通用 UI 组件库（扩展版：覆盖 PC 端全部交互所需的移动控件）
import { ReactNode, useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Search, X, ChevronRight, ChevronDown, Trash2, Pencil, History, Check, Upload, Link2, FileText, Image as ImageIcon, FileArchive, FileSpreadsheet, FileType2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { logLineItemAdd, logLineItemDelete, logLineItemUpdate, listLineItemLogs, type LineItemLogModule } from "@/services/lineItemLog";
import { fmtMoney, productCategoryLabel } from "@/lib/format";

// ---------- 页面顶部 ----------
export function MPageHeader({
  title, subtitle, back = false, action, sticky = true,
}: { title: string; subtitle?: string; back?: boolean; action?: ReactNode; sticky?: boolean }) {
  const nav = useNavigate();
  return (
    <div className={cn("bg-background z-20 px-4 py-3 border-b border-foreground/5", sticky && "sticky top-12")}>
      <div className="flex items-center gap-2">
        {back && (
          <button onClick={() => nav(-1)} className="size-9 -ml-2 rounded-full hover:bg-foreground/5 flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold font-display truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-foreground/55 truncate">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

// ---------- 搜索栏 ----------
export function MSearchBar({ value, onChange, placeholder = "搜索…", trailing }: { value: string; onChange: (v: string) => void; placeholder?: string; trailing?: ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-3 flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 h-10 rounded-full bg-foreground/[0.04] px-3.5 border border-foreground/8">
        <Search className="h-4 w-4 text-foreground/40" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/40"
        />
        {value && (
          <button onClick={() => onChange("")} className="size-5 rounded-full bg-foreground/15 flex items-center justify-center">
            <X className="h-3 w-3 text-[hsl(var(--paper))]" />
          </button>
        )}
      </div>
      {trailing}
    </div>
  );
}

// ---------- 卡片 ----------
export function MCard({ children, onClick, className, selected, onSelectChange }: { children: ReactNode; onClick?: () => void; className?: string; selected?: boolean; onSelectChange?: (s: boolean) => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-foreground/8 p-4 active:scale-[0.99] transition-transform relative",
        onClick && "cursor-pointer",
        selected && "ring-2 ring-tomato/60 border-tomato/60",
        className
      )}
    >
      {onSelectChange && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectChange(!selected); }}
          className={cn("absolute top-2.5 right-2.5 size-5 rounded-full border-2 flex items-center justify-center transition-colors z-10",
            selected ? "bg-tomato border-tomato" : "border-foreground/25 bg-card")}
        >
          {selected && <Check className="h-3 w-3 text-[hsl(var(--paper))]" />}
        </button>
      )}
      {children}
    </div>
  );
}

// ---------- 列表容器 ----------
export function MList({ children, empty, emptyText = "暂无数据", loading }: { children: ReactNode; empty?: boolean; emptyText?: string; loading?: boolean }) {
  if (loading) return <div className="px-4 py-12 text-center text-sm text-foreground/45">加载中…</div>;
  if (empty) return <div className="px-4 py-16 text-center text-sm text-foreground/40">{emptyText}</div>;
  return <div className="px-4 space-y-2.5 pb-4">{children}</div>;
}

// ---------- 状态徽标 ----------
export function MTag({ children, variant = "default", className }: { children: ReactNode; variant?: "default" | "tomato" | "mint" | "mustard" | "cobalt" | "muted"; className?: string }) {
  const map: Record<string, string> = {
    default: "bg-foreground/8 text-foreground/75",
    tomato: "bg-tomato/12 text-tomato",
    mint: "bg-mint/20 text-foreground",
    mustard: "bg-mustard/20 text-foreground",
    cobalt: "bg-cobalt/15 text-cobalt",
    muted: "bg-foreground/5 text-foreground/55",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap", map[variant], className)}>{children}</span>;
}

// ---------- 浮动按钮 ----------
export function MFab({ onClick, label = "新建", icon }: { onClick: () => void; label?: string; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-20 z-30 h-13 px-5 py-3 rounded-full bg-tomato text-[hsl(var(--paper))] shadow-lg shadow-tomato/30 flex items-center gap-1.5 font-semibold text-sm active:scale-95 transition-transform"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {icon ?? <Plus className="h-4 w-4" />}
      {label}
    </button>
  );
}

// ---------- Sheet（详情/编辑表单） ----------
export function MSheet({
  open, onOpenChange, title, children, footer, size = "default",
}: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; footer?: ReactNode; size?: "default" | "full" }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("rounded-t-3xl flex flex-col p-0 gap-0", size === "full" ? "h-[96vh]" : "max-h-[92vh]")}>
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-foreground/8 flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base font-display font-bold">{title}</SheetTitle>
          <button onClick={() => onOpenChange(false)} className="size-8 rounded-full hover:bg-foreground/5 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-foreground/8 bg-card" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

// ---------- 表单字段 ----------
export function MField({ label, children, required, hint }: { label: string; children: ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-foreground/65 mb-1.5">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-foreground/45 mt-1">{hint}</p>}
    </div>
  );
}

export function MInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full h-11 px-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40 focus:bg-card transition-colors", props.className)} />;
}

export function MTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full px-3.5 py-2.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40 focus:bg-card transition-colors min-h-[80px]", props.className)} />;
}

export function MSelect({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean }) {
  return (
    <select
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40 disabled:opacity-50"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function MSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2">
      <span className={cn("relative inline-flex h-6 w-10 rounded-full transition-colors", checked ? "bg-tomato" : "bg-foreground/15")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
      {label && <span className="text-[12px] text-foreground/75">{label}</span>}
    </button>
  );
}

export function MButton({
  children, variant = "primary", onClick, disabled, type = "button", className,
}: {
  children: ReactNode; variant?: "primary" | "ghost" | "danger" | "outline"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  const map = {
    primary: "bg-tomato text-[hsl(var(--paper))] active:bg-tomato/90",
    ghost: "bg-foreground/[0.06] text-foreground active:bg-foreground/10",
    danger: "bg-destructive/10 text-destructive active:bg-destructive/20",
    outline: "border border-foreground/15 text-foreground active:bg-foreground/5",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cn("h-11 px-5 rounded-full font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none", map[variant], className)}>
      {children}
    </button>
  );
}

// ---------- KPI 块 ----------
export function MKpi({ label, value, sub, accent = "default" }: { label: string; value: ReactNode; sub?: string; accent?: "default" | "tomato" | "mint" | "mustard" | "cobalt" }) {
  const accentMap: Record<string, string> = {
    default: "text-foreground", tomato: "text-tomato", mint: "text-mint", mustard: "text-mustard", cobalt: "text-cobalt",
  };
  return (
    <div className="bg-card rounded-2xl p-3.5 border border-foreground/8">
      <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/50 mb-1">{label}</div>
      <div className={cn("text-xl font-display font-black tabular-nums", accentMap[accent])}>{value}</div>
      {sub && <div className="text-[11px] text-foreground/50 mt-1">{sub}</div>}
    </div>
  );
}

// ---------- 行项（用于详情中显示一对 KV） ----------
export function MRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-foreground/5 last:border-0">
      <span className="text-[12px] text-foreground/55 shrink-0">{label}</span>
      <span className={cn("text-[13px] text-foreground/90 text-right break-all", mono && "font-mono tabular-nums font-semibold")}>{value ?? "—"}</span>
    </div>
  );
}

// ---------- 确认弹窗 ----------
export function MConfirm({
  open, onOpenChange, title, description, onConfirm, confirmText = "确认", danger,
}: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; onConfirm: () => void; confirmText?: string; danger?: boolean }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={cn("rounded-full", danger && "bg-destructive hover:bg-destructive/90")}>{confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------- 段标题（用于详情页内分组） ----------
export function MSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[13px] font-bold text-foreground/85">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------- 分组标题（用于编辑表单内分块） ----------
export function MGroupTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-4 mb-2.5 first:mt-0">
      <span className="inline-flex items-center px-2.5 h-6 rounded-md bg-foreground text-[hsl(var(--paper))] text-[11px] font-semibold tracking-wide">{children}</span>
      <div className="flex-1 h-px bg-foreground/10" />
      {action}
    </div>
  );
}

// ---------- 折叠面板（用于详情页子表分组） ----------
export function MAccordion({ title, badge, defaultOpen = false, action, children }: { title: ReactNode; badge?: ReactNode; defaultOpen?: boolean; action?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-foreground/8 bg-card overflow-hidden mb-2">
      <div className="flex items-center w-full px-3.5 py-3">
        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 text-left">
          <ChevronDown className={cn("h-4 w-4 text-foreground/40 transition-transform", !open && "-rotate-90")} />
          <span className="font-semibold text-[13px]">{title}</span>
          {badge}
        </button>
        {action}
      </div>
      {open && <div className="border-t border-foreground/5 px-3.5 py-2.5">{children}</div>}
    </div>
  );
}

// ---------- 滚动加载更多 ----------
export function MLoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading?: boolean; onLoad: () => void }) {
  return (
    <div className="px-4 py-4 text-center">
      {hasMore ? (
        <button onClick={onLoad} disabled={loading} className="text-xs text-foreground/55 px-4 py-2 rounded-full border border-foreground/10">
          {loading ? "加载中…" : "加载更多"}
        </button>
      ) : (
        <span className="text-xs text-foreground/35">— 已到底部 —</span>
      )}
    </div>
  );
}

// ---------- 日期范围筛选 ----------
export function MDateRange({ value, onChange }: { value: { from: string; to: string }; onChange: (v: { from: string; to: string }) => void }) {
  return (
    <div className="px-4 pb-3 flex items-center gap-2">
      <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="flex-1 h-9 px-2 text-xs rounded-lg bg-foreground/5 border border-foreground/10" />
      <span className="text-foreground/35 text-xs">至</span>
      <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="flex-1 h-9 px-2 text-xs rounded-lg bg-foreground/5 border border-foreground/10" />
      {(value.from || value.to) && (
        <button onClick={() => onChange({ from: "", to: "" })} className="text-[11px] text-tomato px-2">清除</button>
      )}
    </div>
  );
}

// ---------- 横向滚动 chip 过滤器 ----------
export function MChipFilter<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="px-4 pb-3 -mx-1 flex gap-1.5 overflow-x-auto no-scrollbar">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold border transition-colors",
            value === o.value ? "bg-foreground text-[hsl(var(--paper))] border-foreground" : "bg-card border-foreground/10 text-foreground/65"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- 多维筛选抽屉触发按钮 ----------
export function MFilterBar({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return (
    <div className="px-4 pb-3 flex items-center gap-2 -mx-1 overflow-x-auto no-scrollbar">
      {children}
      {onReset && <button onClick={onReset} className="shrink-0 text-[11px] text-foreground/45 px-2">重置</button>}
    </div>
  );
}

// ---------- 状态步骤条（订单状态流转） ----------
export function MStatusFlow({ steps, current }: { steps: { value: string; label: string }[]; current: string }) {
  const idx = steps.findIndex((s) => s.value === current);
  return (
    <div className="flex items-center px-4 py-3 bg-foreground/[0.03] rounded-xl">
      {steps.map((s, i) => {
        const active = i <= idx;
        const done = i < idx;
        return (
          <div key={s.value} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div className={cn("size-6 rounded-full flex items-center justify-center text-[10px] font-bold", active ? "bg-tomato text-[hsl(var(--paper))]" : "bg-foreground/10 text-foreground/45")}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn("text-[10px] mt-1 whitespace-nowrap", active ? "text-foreground" : "text-foreground/40")}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("flex-1 h-px mx-1 -mt-3", i < idx ? "bg-tomato" : "bg-foreground/15")} />}
          </div>
        );
      })}
    </div>
  );
}

// ---------- 小型行操作图标按钮 ----------
export function MIconBtn({ icon, onClick, variant = "default", title }: { icon: ReactNode; onClick: () => void; variant?: "default" | "danger" | "primary"; title?: string }) {
  const map = { default: "bg-foreground/[0.06] text-foreground/65", danger: "bg-destructive/10 text-destructive", primary: "bg-tomato/12 text-tomato" };
  return (
    <button title={title} onClick={(e) => { e.stopPropagation(); onClick(); }} className={cn("size-8 rounded-full inline-flex items-center justify-center", map[variant])}>{icon}</button>
  );
}

// ---------- 行项目编辑器（采购/销售明细） ----------
export interface MLineItem { productId: string; productName: string; category?: string; qty: number; price: number; }

export function MLineItemsEditor({ items, products, onChange, mode = "sales", logModule, logScope }: {
  items: MLineItem[];
  products: { id: string; name: string; category?: string; price: number; cost: number; unit?: string }[];
  onChange: (items: MLineItem[]) => void;
  mode?: "sales" | "purchase";
  logModule?: LineItemLogModule;
  logScope?: string;
}) {
  const canLog = !!(logModule && logScope);
  const [lineLogsOpen, setLineLogsOpen] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [focusSnapshot, setFocusSnapshot] = useState<Record<string, MLineItem>>({});
  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const writeUpdateLog = (before: MLineItem, after: MLineItem) => {
    if (canLog && logLineItemUpdate(logModule!, logScope!, before as any, after as any)) setLogTick((t) => t + 1);
  };
  const update = (i: number, patch: Partial<MLineItem>) => {
    const before = { ...items[i] };
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    if (patch.productName !== undefined) {
      const m = products.find((p) => p.name.trim() === patch.productName!.trim());
      if (m) {
        next[i].productId = m.id;
        next[i].category = m.category as any;
        if (!next[i].price) next[i].price = mode === "purchase" ? (m.cost || m.price) : m.price;
      } else {
        next[i].productId = "";
      }
    }
    onChange(next);
    if (patch.category !== undefined) writeUpdateLog(before, next[i]);
  };
  const add = () => {
    const p = products[0];
    const row = !p ? { productId: "", productName: "", category: "other", qty: 1, price: 0 } : { productId: p.id, productName: p.name, category: p.category as any, qty: 1, price: mode === "purchase" ? (p.cost || p.price) : p.price };
    onChange([...items, row]);
    if (canLog) { logLineItemAdd(logModule!, logScope!, row as any); setLogTick((t) => t + 1); }
  };
  const remove = (i: number) => {
    const removed = items[i];
    onChange(items.filter((_, x) => x !== i));
    if (canLog && removed) { logLineItemDelete(logModule!, logScope!, removed as any); setLogTick((t) => t + 1); }
  };
  const capture = (i: number, field: keyof MLineItem) => setFocusSnapshot((m) => ({ ...m, [`${i}:${field}`]: { ...items[i] } }));
  const flush = (i: number, field: keyof MLineItem) => {
    const key = `${i}:${field}`;
    const before = focusSnapshot[key];
    const after = items[i];
    if (before && after) writeUpdateLog(before, after);
    setFocusSnapshot((m) => { const n = { ...m }; delete n[key]; return n; });
  };
  const lineLogs = canLog ? listLineItemLogs(logModule!, logScope!) : [];

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-foreground/8">
        <span className="text-[11px] font-semibold text-foreground/65">明细 {items.length} 项 · 合计 <span className="font-mono text-foreground">¥{total.toLocaleString()}</span></span>
        <div className="flex items-center gap-1.5">
          {canLog && <button type="button" onClick={() => setLineLogsOpen(true)} className="px-2.5 h-7 rounded-full bg-foreground/[0.06] text-[11px] font-semibold inline-flex items-center gap-1"><History className="h-3 w-3" />日志{lineLogs.length ? ` ${lineLogs.length}` : ""}</button>}
          <button type="button" onClick={add} className="px-3 h-7 rounded-full bg-foreground text-[hsl(var(--paper))] text-[11px] font-semibold inline-flex items-center gap-1">
            <Plus className="h-3 w-3" />添加
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-6 text-[12px] text-foreground/40">点击右上角添加产品明细</div>
      ) : (
        <div className="divide-y divide-foreground/5">
          {items.map((it, i) => {
            const isNew = !it.productId && !!it.productName.trim();
            return (
              <div key={i} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    list="m-li-products"
                    value={it.productName}
                    onFocus={() => capture(i, "productName")}
                    onChange={(e) => update(i, { productName: e.target.value })}
                    onBlur={() => flush(i, "productName")}
                    placeholder="输入或选择产品名称"
                    className="flex-1 h-9 px-2.5 rounded-lg bg-card border border-foreground/10 text-[13px]"
                  />
                  <button onClick={() => remove(i)} className="size-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isNew && <div className="text-[10px] text-mustard mb-1.5">新产品，保存时自动建档</div>}
                <div className="grid grid-cols-3 gap-2">
                  <label className="block">
                    <div className="text-[10px] text-foreground/50 mb-0.5">数量</div>
                    <input type="number" inputMode="decimal" value={it.qty} onFocus={() => capture(i, "qty")} onChange={(e) => update(i, { qty: Number(e.target.value) })} onBlur={() => flush(i, "qty")} className="w-full h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[13px] font-mono text-right" />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-foreground/50 mb-0.5">单价</div>
                    <input type="number" inputMode="decimal" step="0.01" value={it.price} onFocus={() => capture(i, "price")} onChange={(e) => update(i, { price: Number(e.target.value) })} onBlur={() => flush(i, "price")} className="w-full h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[13px] font-mono text-right" />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-foreground/50 mb-0.5">小计</div>
                    <div className="h-9 px-2 rounded-lg bg-foreground/[0.04] text-[13px] font-mono font-bold text-right flex items-center justify-end">¥{(it.qty * it.price).toLocaleString()}</div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <datalist id="m-li-products">
        {products.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>
      {canLog && <MSheet open={lineLogsOpen} onOpenChange={setLineLogsOpen} title={`明细日志 (${listLineItemLogs(logModule!, logScope!).length})`}>
        <MLineItemLogList logs={listLineItemLogs(logModule!, logScope!)} />
      </MSheet>}
    </div>
  );
}

export function MLineItemLogList({ logs }: { logs: ReturnType<typeof listLineItemLogs> }) {
  if (!logs.length) return <div className="text-center py-6 text-[12px] text-foreground/40">暂无明细日志</div>;
  const tone: Record<string, string> = { add: "bg-mint/25 text-foreground", update: "bg-cobalt/12 text-cobalt", delete: "bg-tomato/15 text-tomato" };
  const label: Record<string, string> = { add: "新增", update: "修改", delete: "删除" };
  return <div className="space-y-2">{logs.map((l) => <div key={l.id} className="rounded-xl border border-foreground/8 bg-card p-3 text-[12px]">
    <div className="flex items-center gap-2 flex-wrap mb-1.5"><span className={cn("px-2 h-5 rounded-full text-[10px] font-semibold", tone[l.action])}>{label[l.action]}</span><span className="font-semibold">{l.productName}</span><span className="ml-auto font-mono text-[10px] text-foreground/45">{l.createdAt}</span><span className="text-foreground/55">· {l.operator}</span></div>
    {l.changes?.map((c, i) => <div key={i} className="flex items-center gap-2 py-0.5"><span className="text-foreground/55 shrink-0">{c.field}</span><span className="line-through text-tomato/70 truncate flex-1">{String(c.before ?? "—")}</span><span className="text-foreground/35">→</span><span className="font-semibold truncate flex-1 text-right">{String(c.after ?? "—")}</span></div>)}
    {l.snapshot && <div className="grid grid-cols-2 gap-1 text-foreground/65"><span>分类：{l.snapshot.category && l.snapshot.category in productCategoryLabel ? productCategoryLabel[l.snapshot.category as keyof typeof productCategoryLabel] : l.snapshot.category}</span><span>数量：{l.snapshot.qty}</span><span>单价：{fmtMoney(l.snapshot.price ?? 0)}</span><span>小计：{fmtMoney((l.snapshot.qty ?? 0) * (l.snapshot.price ?? 0))}</span></div>}
  </div>)}</div>;
}

// ---------- 发票子表 ----------
export interface MInvoiceItem { id: string; invoiceNo: string; invoiceType: string; invoiceDate: string; amount: number; taxRate: number; taxAmount?: number; buyerOrSeller?: string; status?: string; remark?: string; }
const TYPE_OPTS = ["增值税专用发票", "增值税普通发票", "电子普通发票", "电子专用发票", "其他"];
const TAX_OPTS = [0, 1, 3, 6, 9, 13];
export function MInvoiceList({ value, onChange, direction, defaultParty }: { value: MInvoiceItem[]; onChange: (v: MInvoiceItem[]) => void; direction: "in" | "out"; defaultParty?: string }) {
  const [draft, setDraft] = useState<MInvoiceItem | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const statusOpts = direction === "in" ? ["已收到", "未收到", "红冲"] : ["已开具", "待开具", "红冲"];
  const calcTax = (a: number, r: number) => Number(((a * r) / (100 + r)).toFixed(2));
  const total = (value || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const blank = (): MInvoiceItem => ({ id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, invoiceNo: "", invoiceType: TYPE_OPTS[0], invoiceDate: new Date().toISOString().slice(0, 10), amount: 0, taxRate: 13, taxAmount: 0, buyerOrSeller: defaultParty || "", status: statusOpts[0], remark: "" });
  const save = () => {
    if (!draft) return;
    const tax = calcTax(Number(draft.amount) || 0, Number(draft.taxRate) || 0);
    const rec = { ...draft, taxAmount: tax };
    if (editId) onChange(value.map((x) => x.id === editId ? rec : x));
    else onChange([...(value || []), rec]);
    setDraft(null); setEditId(null);
  };
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-foreground/8">
        <span className="text-[11px] font-semibold text-foreground/65">{(value || []).length} 张 · 合计 <span className="font-mono text-cobalt">¥{total.toLocaleString()}</span></span>
        <button type="button" onClick={() => { setDraft(blank()); setEditId(null); }} className="px-3 h-7 rounded-full bg-foreground text-[hsl(var(--paper))] text-[11px] font-semibold inline-flex items-center gap-1">
          <Plus className="h-3 w-3" />新增
        </button>
      </div>
      <div className="divide-y divide-foreground/5">
        {(value || []).length === 0 && !draft && <div className="text-center py-6 text-[12px] text-foreground/40">暂无发票</div>}
        {(value || []).map((r) => {
          const tax = Number(r.taxAmount) || calcTax(r.amount, r.taxRate);
          return (
            <div key={r.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MTag variant="cobalt" className="text-[10px]">{r.invoiceType.replace("增值税", "").replace("发票", "")}</MTag>
                    <MTag variant="muted" className="text-[10px]">{r.status}</MTag>
                    <span className="font-mono text-[11px]">{r.invoiceNo || "—"}</span>
                  </div>
                  <div className="text-[11px] text-foreground/55 mt-1">{r.buyerOrSeller || "—"} · {r.invoiceDate} · {r.taxRate}%</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold">¥{r.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-foreground/45 font-mono">税额 ¥{tax.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-1.5">
                <button onClick={() => { setDraft({ ...r }); setEditId(r.id); }} className="size-7 rounded-full bg-foreground/[0.06] flex items-center justify-center"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => onChange(value.filter((x) => x.id !== r.id))} className="size-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          );
        })}
        {draft && (
          <div className="p-3 bg-cobalt/[0.04]">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px]" placeholder="发票号" value={draft.invoiceNo} onChange={(e) => setDraft({ ...draft, invoiceNo: e.target.value })} />
              <select className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px]" value={draft.invoiceType} onChange={(e) => setDraft({ ...draft, invoiceType: e.target.value })}>
                {TYPE_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px]" value={draft.invoiceDate} onChange={(e) => setDraft({ ...draft, invoiceDate: e.target.value })} />
              <select className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px]" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                {statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px]" value={draft.taxRate} onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) })}>
                {TAX_OPTS.map((t) => <option key={t} value={t}>{t}%</option>)}
              </select>
              <input type="number" inputMode="decimal" className="h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px] font-mono text-right" placeholder="金额" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
            </div>
            <input className="w-full h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px] mb-2" placeholder="对手方" value={draft.buyerOrSeller || ""} onChange={(e) => setDraft({ ...draft, buyerOrSeller: e.target.value })} />
            <input className="w-full h-9 px-2 rounded-lg bg-card border border-foreground/10 text-[12px] mb-2" placeholder="备注" value={draft.remark || ""} onChange={(e) => setDraft({ ...draft, remark: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={() => { setDraft(null); setEditId(null); }} className="flex-1 h-9 rounded-full bg-foreground/[0.06] text-[12px] font-semibold">取消</button>
              <button onClick={save} className="flex-1 h-9 rounded-full bg-tomato text-[hsl(var(--paper))] text-[12px] font-semibold">保存</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 操作日志查看（移动版） ----------
export function MLogList({ logs, emptyText = "暂无日志" }: { logs: { id: string; action?: string; refCode?: string; operator?: string; createdAt: string; changes?: { field: string; before: any; after: any }[]; remark?: string }[]; emptyText?: string }) {
  if (!logs.length) return <div className="text-center py-6 text-[12px] text-foreground/40">{emptyText}</div>;
  const tone: Record<string, string> = { update: "bg-cobalt/12 text-cobalt", delete: "bg-tomato/12 text-tomato", add: "bg-mint/25 text-foreground", create: "bg-mint/25 text-foreground", in: "bg-mint/25 text-foreground", out: "bg-mustard/20 text-foreground", adjust: "bg-foreground/8 text-foreground/70" };
  const labelMap: Record<string, string> = { update: "修改", delete: "删除", add: "新增", create: "新建", in: "入库", out: "出库", adjust: "调整" };
  return (
    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.id} className="rounded-xl border border-foreground/8 bg-card p-3 text-[12px]">
          <div className="flex items-center gap-2 flex-wrap">
            {l.action && <span className={cn("px-2 h-5 rounded-full text-[10px] font-semibold inline-flex items-center", tone[l.action] || "bg-foreground/10 text-foreground/70")}>{labelMap[l.action] || l.action}</span>}
            {l.refCode && <span className="font-mono text-foreground/70">{l.refCode}</span>}
            {l.operator && <span className="text-foreground/55">· {l.operator}</span>}
            <span className="ml-auto font-mono text-[10px] text-foreground/45">{l.createdAt}</span>
          </div>
          {l.changes && l.changes.length > 0 && (
            <div className="mt-2 space-y-1 pl-1">
              {l.changes.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-foreground/55 shrink-0">{c.field}：</span>
                  <span className="text-tomato/80 line-through truncate flex-1">{String(c.before)}</span>
                  <span className="text-foreground/35">→</span>
                  <span className="text-mint truncate flex-1 text-right">{String(c.after)}</span>
                </div>
              ))}
            </div>
          )}
          {l.remark && <div className="mt-1 text-[11px] text-foreground/55">{l.remark}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------- 批量操作工具条（粘在底部） ----------
export function MBulkBar({ count, children, onCancel }: { count: number; children: ReactNode; onCancel: () => void }) {
  if (!count) return null;
  return (
    <div className="fixed left-3 right-3 bottom-[72px] z-30 rounded-2xl bg-foreground text-[hsl(var(--paper))] shadow-2xl px-3 py-2.5 flex items-center gap-2"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <span className="text-[12px] font-semibold">已选 <span className="text-mustard">{count}</span></span>
      <div className="flex-1 flex justify-end gap-1.5">{children}</div>
      <button onClick={onCancel} className="size-7 rounded-full bg-[hsl(var(--paper))]/15 flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}
