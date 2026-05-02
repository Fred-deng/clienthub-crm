// 移动端通用 UI 组件库
import { ReactNode, useState, useEffect } from "react";
import { ArrowLeft, Plus, Search, X, ChevronRight, Check, Download, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { BizFilter } from "@/lib/biz";

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
export function MSearchBar({ value, onChange, placeholder = "搜索…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="px-4 pt-2 pb-3">
      <div className="flex items-center gap-2 h-10 rounded-full bg-foreground/[0.04] px-3.5 border border-foreground/8">
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
    </div>
  );
}

// ---------- 卡片列表项 ----------
export function MCard({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl border border-foreground/8 p-4 active:scale-[0.99] transition-transform",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------- 列表容器 ----------
export function MList({ children, empty, loading, emptyText = "暂无数据" }: { children: ReactNode; empty?: boolean; loading?: boolean; emptyText?: string }) {
  if (loading) return (
    <div className="px-4 py-12 flex flex-col items-center gap-2 text-sm text-foreground/45">
      <div className="size-6 rounded-full border-2 border-foreground/15 border-t-tomato animate-spin" />
      加载中…
    </div>
  );
  if (empty) return (
    <div className="px-4 py-20 flex flex-col items-center gap-2 text-foreground/40">
      <Inbox className="h-10 w-10" strokeWidth={1.2} />
      <span className="text-sm">{emptyText}</span>
    </div>
  );
  return <div className="px-4 space-y-2.5 pb-4">{children}</div>;
}

// ---------- 状态徽标 ----------
export function MTag({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "tomato" | "mint" | "mustard" | "cobalt" | "muted" }) {
  const map: Record<string, string> = {
    default: "bg-foreground/8 text-foreground/75",
    tomato: "bg-tomato/12 text-tomato",
    mint: "bg-mint/20 text-foreground",
    mustard: "bg-mustard/20 text-foreground",
    cobalt: "bg-cobalt/15 text-cobalt",
    muted: "bg-foreground/5 text-foreground/55",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", map[variant])}>{children}</span>;
}

// ---------- 浮动按钮 ----------
export function MFab({ onClick, label = "新建" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-20 z-30 h-13 px-5 py-3 rounded-full bg-tomato text-[hsl(var(--paper))] shadow-lg shadow-tomato/30 flex items-center gap-1.5 font-semibold text-sm active:scale-95 transition-transform"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

// ---------- 底部 Sheet（详情/编辑表单） ----------
export function MSheet({
  open, onOpenChange, title, children, footer,
}: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] flex flex-col p-0 gap-0">
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
export function MField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-foreground/65 mb-1.5">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function MInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full h-11 px-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40 focus:bg-card transition-colors", props.className)} />;
}

export function MTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("w-full px-3.5 py-2.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40 focus:bg-card transition-colors min-h-[80px]", props.className)} />;
}

export function MSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3.5 rounded-xl bg-foreground/[0.04] border border-foreground/10 text-sm focus:outline-none focus:border-tomato/40"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

// ---------- 行项 ----------
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

// ---------- 段标题 ----------
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
