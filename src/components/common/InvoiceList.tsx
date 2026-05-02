import { useMemo, useState } from "react";
import { Plus, Trash2, FileText, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney } from "@/lib/format";

export type InvoiceDirection = "in" | "out";

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;        // 发票号码
  invoiceType: string;      // 发票类型（专票/普票/电子票）
  invoiceDate: string;      // 开票日期
  amount: number;           // 价税合计
  taxRate: number;          // 税率（%）
  taxAmount?: number;       // 税额
  buyerOrSeller?: string;   // 购买方/销售方名称
  status?: string;          // 状态（已开/未开/已收到/未收到 / 红冲）
  attachment?: string;      // 附件
  remark?: string;
}

const TYPE_OPTS = ["增值税专用发票", "增值税普通发票", "电子普通发票", "电子专用发票", "其他"];
const TAX_OPTS = [0, 1, 3, 6, 9, 13];

export function InvoiceList({
  value,
  onChange,
  direction,
}: {
  value: InvoiceRecord[];
  onChange: (v: InvoiceRecord[]) => void;
  direction: InvoiceDirection; // in = 收到（采购）, out = 已开（销售）
}) {
  const [draft, setDraft] = useState<InvoiceRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const partyLabel = direction === "in" ? "销售方（供应商）" : "购买方（客户）";
  const statusOpts = direction === "in" ? ["已收到", "未收到", "红冲"] : ["已开具", "待开具", "红冲"];

  const total = useMemo(() => (value || []).reduce((s, r) => s + (Number(r.amount) || 0), 0), [value]);
  const totalTax = useMemo(() => (value || []).reduce((s, r) => s + (Number(r.taxAmount) || (Number(r.amount) || 0) * (Number(r.taxRate) || 0) / (100 + (Number(r.taxRate) || 0))), 0), [value]);

  const blank = (): InvoiceRecord => ({
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    invoiceNo: "",
    invoiceType: TYPE_OPTS[0],
    invoiceDate: new Date().toISOString().slice(0, 10),
    amount: 0,
    taxRate: 13,
    taxAmount: 0,
    buyerOrSeller: "",
    status: statusOpts[0],
    remark: "",
  });

  const startAdd = () => { setDraft(blank()); setEditingId(null); };
  const startEdit = (r: InvoiceRecord) => { setDraft({ ...r }); setEditingId(r.id); };
  const cancel = () => { setDraft(null); setEditingId(null); };
  const save = () => {
    if (!draft) return;
    const computedTax = (Number(draft.amount) || 0) * (Number(draft.taxRate) || 0) / (100 + (Number(draft.taxRate) || 0));
    const rec = { ...draft, taxAmount: Number(computedTax.toFixed(2)) };
    if (editingId) onChange((value || []).map((x) => (x.id === editingId ? rec : x)));
    else onChange([...(value || []), rec]);
    cancel();
  };
  const remove = (id: string) => onChange((value || []).filter((x) => x.id !== id));

  return (
    <div className="space-y-2 border border-foreground/10 rounded-lg p-3 bg-foreground/[0.015]">
      <div className="flex items-center justify-between">
        <div className="text-xs text-foreground/65">
          共 <span className="mono font-semibold text-foreground">{(value || []).length}</span> 张发票 · 价税合计{" "}
          <span className="mono font-semibold text-foreground">{fmtMoney(total)}</span> · 税额{" "}
          <span className="mono text-foreground/70">{fmtMoney(totalTax)}</span>
        </div>
        {!draft && (
          <Button type="button" size="sm" variant="outline" onClick={startAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />新增发票
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[11px] text-foreground/55 uppercase tracking-wider">
            <tr className="border-b border-foreground/10">
              <th className="text-left py-2 px-2 font-medium w-10">#</th>
              <th className="text-left py-2 px-2 font-medium">发票号码</th>
              <th className="text-left py-2 px-2 font-medium">发票类型</th>
              <th className="text-left py-2 px-2 font-medium">{partyLabel}</th>
              <th className="text-left py-2 px-2 font-medium w-28">开票日期</th>
              <th className="text-right py-2 px-2 font-medium w-24">税率</th>
              <th className="text-right py-2 px-2 font-medium w-32">价税合计</th>
              <th className="text-right py-2 px-2 font-medium w-28">税额</th>
              <th className="text-left py-2 px-2 font-medium w-24">状态</th>
              <th className="text-right py-2 px-2 font-medium w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {(value || []).length === 0 && !draft && (
              <tr><td colSpan={10} className="text-center py-6 text-foreground/40">暂无发票记录</td></tr>
            )}
            {(value || []).map((r, idx) => (
              <tr key={r.id} className="border-b border-foreground/5 hover:bg-foreground/[0.02]">
                <td className="py-2 px-2 mono text-foreground/45">{idx + 1}</td>
                <td className="py-2 px-2 mono">{r.invoiceNo || "—"}</td>
                <td className="py-2 px-2"><span className="inline-flex items-center px-1.5 h-5 rounded bg-cobalt/10 text-cobalt text-[10px]">{r.invoiceType}</span></td>
                <td className="py-2 px-2 truncate max-w-[180px]">{r.buyerOrSeller || "—"}</td>
                <td className="py-2 px-2 mono text-foreground/70">{r.invoiceDate}</td>
                <td className="py-2 px-2 num mono">{r.taxRate}%</td>
                <td className="py-2 px-2 num mono font-semibold">{fmtMoney(r.amount)}</td>
                <td className="py-2 px-2 num mono text-foreground/70">{fmtMoney(r.taxAmount || 0)}</td>
                <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/[0.06]">{r.status}</span></td>
                <td className="py-2 px-2 num">
                  <div className="inline-flex gap-1">
                    <button type="button" className="size-6 rounded hover:bg-foreground/5 inline-flex items-center justify-center text-foreground/55 hover:text-foreground" onClick={() => startEdit(r)}><Pencil className="h-3 w-3" /></button>
                    <button type="button" className="size-6 rounded hover:bg-tomato/10 inline-flex items-center justify-center text-foreground/55 hover:text-tomato" onClick={() => remove(r.id)}><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {(value || []).length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-foreground/15 bg-foreground/[0.025]">
                <td colSpan={6} className="py-2 px-2 text-right text-[11px] font-semibold text-foreground/65 uppercase tracking-wider">列合计</td>
                <td className="py-2 px-2 num mono font-bold text-foreground">{fmtMoney(total)}</td>
                <td className="py-2 px-2 num mono font-semibold text-foreground/80">{fmtMoney(totalTax)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {draft && (
        <div className="border border-cobalt/30 rounded-md p-3 bg-cobalt/[0.03] grid grid-cols-12 gap-2 text-xs">
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">发票号码</div>
            <Input className="h-8 text-xs" value={draft.invoiceNo} onChange={(e) => setDraft({ ...draft, invoiceNo: e.target.value })} placeholder="如 2426..." />
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">发票类型</div>
            <Select value={draft.invoiceType} onValueChange={(v) => setDraft({ ...draft, invoiceType: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPE_OPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">开票日期</div>
            <Input type="date" className="h-8 text-xs" value={draft.invoiceDate} onChange={(e) => setDraft({ ...draft, invoiceDate: e.target.value })} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">状态</div>
            <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{statusOpts.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="text-[10px] text-foreground/55 mb-1">{partyLabel}</div>
            <Input className="h-8 text-xs" value={draft.buyerOrSeller} onChange={(e) => setDraft({ ...draft, buyerOrSeller: e.target.value })} placeholder="单位名称" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">税率（%）</div>
            <Select value={String(draft.taxRate)} onValueChange={(v) => setDraft({ ...draft, taxRate: Number(v) })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{TAX_OPTS.map((t) => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <div className="text-[10px] text-foreground/55 mb-1">价税合计</div>
            <Input type="number" step="0.01" className="h-8 text-xs mono text-right" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
          </div>
          <div className="col-span-12">
            <div className="text-[10px] text-foreground/55 mb-1">备注</div>
            <Input className="h-8 text-xs" value={draft.remark} onChange={(e) => setDraft({ ...draft, remark: e.target.value })} placeholder="可填写发票内容、附件链接等" />
          </div>
          <div className="col-span-12 flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={cancel}><X className="h-3.5 w-3.5 mr-1" />取消</Button>
            <Button type="button" size="sm" onClick={save}><Check className="h-3.5 w-3.5 mr-1" />{editingId ? "保存修改" : "添加发票"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
