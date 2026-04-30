import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-6 mb-10 pt-2 flex-wrap">
      <div className="min-w-0">
        {meta && (
          <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-tomato mb-3">
            ▸ {meta}
          </div>
        )}
        <h1 className="font-display font-black text-5xl lg:text-6xl text-foreground -tracking-[0.02em] leading-[1]">
          {title}
        </h1>
        <div className="h-2 w-28 bg-mint rounded-full mt-3" />
        {subtitle && <p className="text-sm text-foreground/60 mt-3 max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
