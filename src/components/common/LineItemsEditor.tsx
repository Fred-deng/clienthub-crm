import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney, productCategoryLabel } from "@/lib/format";
import type { Product, ProductCategory } from "@/types";

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
}

export function LineItemsEditor({ items, products, onChange, excludeCategories = [] }: Props) {
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const cats = (Object.keys(productCategoryLabel) as ProductCategory[]).filter(
    (c) => !excludeCategories.includes(c),
  );
  const datalistId = "li-product-names";

  const update = (i: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    // 名称变化时尝试匹配已存在产品
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
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    const defaultCat = (cats[0] || "other") as ProductCategory;
    onChange([...items, { productId: "", productName: "", category: defaultCat, qty: 1, price: 0 }]);
  };

  return (
    <div className="border border-border bg-muted/20 rounded-md">
      <datalist id={datalistId}>
        {products.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
      </datalist>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">采购明细（不存在的名称将自动建档）</span>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={add}>
          <Plus className="h-3 w-3 mr-1" />添加产品
        </Button>
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
                <Select value={it.category} onValueChange={(v: ProductCategory) => update(i, { category: v })}>
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
                  onChange={(e) => update(i, { productName: e.target.value })}
                />
                {isNew && <div className="text-[10px] text-warning mt-0.5">新产品，保存时自动建档</div>}
              </div>
              <div className="col-span-1">
                <Input type="number" min={1} className="h-8 text-xs text-right mono" value={it.qty}
                  onChange={(e) => update(i, { qty: Number(e.target.value) || 0 })} />
              </div>
              <div className="col-span-2">
                <Input type="number" step="0.01" className="h-8 text-xs text-right mono" value={it.price}
                  onChange={(e) => update(i, { price: Number(e.target.value) || 0 })} />
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
