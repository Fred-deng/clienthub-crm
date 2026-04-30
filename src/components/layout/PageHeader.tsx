import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 pb-5 border-b border-border">
      <div className="min-w-0">
        {meta && (
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary mb-2">
            ▸ {meta}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
