import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney } from "@/lib/format";
import { useCategories } from "@/services/categories";
import type { Product, ProductCategory } from "@/types";
import { LineItemLogButton } from "./LineItemLogDialog";
import {
  logLineItemAdd, logLineItemUpdate, logLineItemDelete,
  type LineItemLogModule,
} from "@/services/lineItemLog";

export interface LineItem {
  productId: string;       // 已存在产品的 id；若是新名称，留空，由保存时回填
  productName: string;
  category: ProductCategory;
  qty: number;
  price: number;
}

interface Props {
  items: LineItem[];
  products: Product[];           // 备选已存在产品（用于名称下拉建议）
  onChange: (items: LineItem[]) => void;
  /** 排除的分类，例如采购侧不需要 software */
  excludeCategories?: ProductCategory[];
  /** 日志模块：purchase / sales。传入后会启用「明细日志」按钮 */
  logModule?: LineItemLogModule;
  /** 日志 scope：编辑既有订单时传订单 id；新建时传一个稳定的 draft session id */
  logScope?: string;
  /** UI 标题，默认根据 logModule 推导 */
  title?: string;
}

export function LineItemsEditor({
  items, products, onChange,
  excludeCategories = [],
  logModule, logScope, title,
}: Props) {
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const cats = (Object.keys(productCategoryLabel) as ProductCategory[]).filter(
    (c) => !excludeCategories.includes(c),
  );
  const datalistId = "li-product-names";
  const [logTick, setLogTick] = useState(0);
  const canLog = !!(logModule && logScope);

  // 记录每个输入框获取焦点时的「编辑前」整行快照，用于 blur 时一次性 diff，避免逐字符重复记录日志
  const focusSnapshotRef = useRef<Record<string, LineItem>>({});
  const pendingAddRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    pendingAddRef.current = {};
    focusSnapshotRef.current = {};
  }, [logScope]);

  const headerTitle = title
    ?? (logModule === "sales" ? "销售明细（不存在的名称将自动建档）" : "采购明细（不存在的名称将自动建档）");

  const logPendingAddIfReady = (i: number, item: LineItem) => {
    if (!canLog || !pendingAddRef.current[i] || !item.productName.trim()) return false;
    logLineItemAdd(logModule!, logScope!, item);
    delete pendingAddRef.current[i];
    setLogTick((t) => t + 1);
    return true;
  };

  /** 静默更新（不写日志），用于输入过程中只更新 UI */
  const updateSilent = (i: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    if (patch.productName !== undefined) {
      const match = products.find((p) => p.name.trim() === patch.productName!.trim());
      if (match) {
        next[i].productId = match.id;
        next[i].category = match.category;
        if (!next[i].price) next[i].price = match.cost || match.price;
      } else {
        next[i].productId = "";
      }
    }
    onChange(next);
  };

  /** 立即更新 + 记录日志（用于 Select 等一次性提交场景） */
  const updateAndLog = (i: number, patch: Partial<LineItem>) => {
    const before = { ...items[i] };
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
    if (logPendingAddIfReady(i, next[i])) return;
    if (canLog && logLineItemUpdate(logModule!, logScope!, before, next[i])) {
      setLogTick((t) => t + 1);
    }
  };

  /** 文本/数字输入：focus 时记录原值，blur 时与最新值 diff，写一次日志 */
  const handleFocus = (i: number, field: keyof LineItem) => {
    focusSnapshotRef.current[`${i}:${field}`] = { ...items[i] };
  };
  const handleBlur = (i: number, field: keyof LineItem) => {
    if (!canLog) return;
    const key = `${i}:${field}`;
    const before = focusSnapshotRef.current[key];
    delete focusSnapshotRef.current[key];
    const after = items[i];
    if (!before || !after) return;
    if (pendingAddRef.current[i]) {
      logPendingAddIfReady(i, after);
      return;
    }
    if (logLineItemUpdate(logModule!, logScope!, before, after)) {
      setLogTick((t) => t + 1);
    }
  };

  const remove = (i: number) => {
    const removed = items[i];
    const wasPendingAdd = !!pendingAddRef.current[i];
    onChange(items.filter((_, idx) => idx !== i));
    const nextPending: Record<number, boolean> = {};
    Object.entries(pendingAddRef.current).forEach(([idx, pending]) => {
      const n = Number(idx);
      if (n < i) nextPending[n] = pending;
      if (n > i) nextPending[n - 1] = pending;
    });
    pendingAddRef.current = nextPending;
    if (canLog && removed && !wasPendingAdd && logLineItemDelete(logModule!, logScope!, removed)) {
      setLogTick((t) => t + 1);
    }
  };

  const add = () => {
    const defaultCat = (cats[0] || "other") as ProductCategory;
    const row: LineItem = { productId: "", productName: "", category: defaultCat, qty: 1, price: 0 };
    onChange([...items, row]);
    if (canLog) pendingAddRef.current[items.length] = true;
  };

  return (
    <div className="border border-border bg-muted/20 rounded-md">
      <datalist id={datalistId}>
        {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
      </datalist>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{headerTitle}</span>
        <div className="flex items-center gap-2">
          {canLog && (
            <LineItemLogButton module={logModule!} scope={logScope!} refreshKey={logTick} />
          )}
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={add}>
            <Plus className="h-3 w-3 mr-1" />添加产品
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-foreground/55 border-b border-border bg-muted/30">
        <div className="col-span-2">分类</div>
        <div className="col-span-5">名称</div>
        <div className="col-span-1 text-right">数量</div>
        <div className="col-span-2 text-right">单价</div>
        <div className="col-span-1 text-right">合计</div>
        <div className="col-span-1" />
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">暂无明细</div>}
        {items.map((it, i) => {
          const isNew = !it.productId && !!it.productName.trim();
          return (
            <div key={i} className="grid grid-cols-12 gap-2 p-2 items-center">
              <div className="col-span-2">
                <Select value={it.category} onValueChange={(v: ProductCategory) => updateAndLog(i, { category: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => <SelectItem key={c} value={c}>{productCategoryLabel[c]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-5">
                <Input
                  list={datalistId}
                  className="h-8 text-xs"
                  placeholder="输入或选择产品名称"
                  value={it.productName}
                  onFocus={() => handleFocus(i, "productName")}
                  onChange={(e) => updateSilent(i, { productName: e.target.value })}
                  onBlur={() => handleBlur(i, "productName")}
                />
                {isNew && <div className="text-[10px] text-warning mt-0.5">新产品，保存时自动建档</div>}
              </div>
              <div className="col-span-1">
                <Input type="number" min={1} className="h-8 text-xs text-right mono" value={it.qty}
                  onFocus={() => handleFocus(i, "qty")}
                  onChange={(e) => updateSilent(i, { qty: Number(e.target.value) || 0 })}
                  onBlur={() => handleBlur(i, "qty")} />
              </div>
              <div className="col-span-2">
                <Input type="number" step="0.01" className="h-8 text-xs text-right mono" value={it.price}
                  onFocus={() => handleFocus(i, "price")}
                  onChange={(e) => updateSilent(i, { price: Number(e.target.value) || 0 })}
                  onBlur={() => handleBlur(i, "price")} />
              </div>
              <div className="col-span-1 text-right text-xs font-mono">{fmtMoney(it.qty * it.price)}</div>
              <div className="col-span-1 text-right">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 border-t border-border flex justify-between items-center bg-muted/30">
        <span className="text-xs text-muted-foreground">明细合计</span>
        <span className="text-base font-mono font-bold text-primary">{fmtMoney(total)}</span>
      </div>
    </div>
  );
}
