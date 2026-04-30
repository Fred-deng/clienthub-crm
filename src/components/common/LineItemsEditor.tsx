import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney } from "@/lib/format";
import type { Product } from "@/types";

export interface LineItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

interface Props {
  items: LineItem[];
  products: Product[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ items, products, onChange }: Props) {
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const update = (i: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    const p = products[0];
    if (!p) return;
    onChange([...items, { productId: p.id, productName: p.name, qty: 1, price: p.price }]);
  };

  return (
    <div className="border border-border bg-muted/20">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">明细行</span>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={add}>
          <Plus className="h-3 w-3 mr-1" />添加产品
        </Button>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">暂无明细</div>}
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 p-2 items-center">
            <div className="col-span-5">
              <Select value={it.productId} onValueChange={(v) => {
                const p = products.find((x) => x.id === v);
                if (p) update(i, { productId: p.id, productName: p.name, price: p.price });
              }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Input type="number" min={1} className="h-8 text-xs" value={it.qty} onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })} /></div>
            <div className="col-span-2"><Input type="number" step="0.01" className="h-8 text-xs" value={it.price} onChange={(e) => update(i, { price: Number(e.target.value) || 0 })} /></div>
            <div className="col-span-2 text-right text-xs font-mono">{fmtMoney(it.qty * it.price)}</div>
            <div className="col-span-1 text-right">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-border flex justify-between items-center bg-muted/30">
        <span className="text-xs text-muted-foreground">合计金额</span>
        <span className="text-base font-mono font-bold text-primary">{fmtMoney(total)}</span>
      </div>
    </div>
  );
}
