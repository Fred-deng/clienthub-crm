// 通用日期段筛选：起止日期 + 快捷预设（本月/上月/近 30/90 天/今年）
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarRange, X } from "lucide-react";

export interface DateRangeValue {
  from?: string; // yyyy-mm-dd
  to?: string;
}

const today = () => new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const startOfMonth = (d = today()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = today()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const presets: { label: string; range: () => DateRangeValue }[] = [
  { label: "本月", range: () => ({ from: fmt(startOfMonth()), to: fmt(endOfMonth()) }) },
  {
    label: "上月",
    range: () => {
      const d = today();
      const s = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const e = new Date(d.getFullYear(), d.getMonth(), 0);
      return { from: fmt(s), to: fmt(e) };
    },
  },
  {
    label: "近30天",
    range: () => {
      const e = today();
      const s = new Date(); s.setDate(s.getDate() - 29);
      return { from: fmt(s), to: fmt(e) };
    },
  },
  {
    label: "近90天",
    range: () => {
      const e = today();
      const s = new Date(); s.setDate(s.getDate() - 89);
      return { from: fmt(s), to: fmt(e) };
    },
  },
  { label: "今年", range: () => ({ from: `${today().getFullYear()}-01-01`, to: `${today().getFullYear()}-12-31` }) },
];

export function DateRangeFilter({
  value,
  onChange,
  label = "日期",
}: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  label?: string;
}) {
  const active = !!(value.from || value.to);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background px-2 h-9 text-xs">
      <CalendarRange className="h-3.5 w-3.5 text-foreground/50" />
      <span className="text-foreground/55 mr-0.5">{label}</span>
      <Input
        type="date"
        value={value.from || ""}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        className="h-7 w-[125px] text-[11px] px-1.5 border-0 shadow-none focus-visible:ring-0 bg-transparent"
      />
      <span className="text-foreground/30">→</span>
      <Input
        type="date"
        value={value.to || ""}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        className="h-7 w-[125px] text-[11px] px-1.5 border-0 shadow-none focus-visible:ring-0 bg-transparent"
      />
      <div className="flex items-center gap-0.5 pl-1 border-l border-foreground/10">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.range())}
            className="px-1.5 py-0.5 text-[10px] rounded text-foreground/60 hover:text-foreground hover:bg-foreground/[0.06]"
          >
            {p.label}
          </button>
        ))}
        {active && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-foreground/45 hover:text-tomato"
            onClick={() => onChange({})}
            title="清空"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** 工具：判断字符串日期是否在区间内（含端点） */
export function inRange(date: string | undefined, range: DateRangeValue) {
  if (!range.from && !range.to) return true;
  if (!date) return false;
  const d = date.slice(0, 10);
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
}
