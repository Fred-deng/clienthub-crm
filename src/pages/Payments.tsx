import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { KpiCard } from "@/components/common/KpiCard";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentApi, salesApi, purchaseApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney } from "@/lib/format";
import type { Payment, SalesOrder, PurchaseOrder } from "@/types";

export default function Payments() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(paymentApi.list);
  const [salesList, setSalesList] = useState<SalesOrder[]>([]);
  const [purList, setPurList] = useState<PurchaseOrder[]>([]);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    salesApi.all().then(setSalesList);
    purchaseApi.all().then(setPurList);
  }, []);

  const totals = data.list.reduce(
    (acc, p) => {
      if (p.direction === "in") acc.in += p.amount; else acc.out += p.amount;
      return acc;
    },
    { in: 0, out: 0 }
  );

  const today = new Date().toISOString().slice(0, 10);
  const { register, handleSubmit, reset, setValue, watch } = useForm<any>({
    defaultValues: { direction: "in", refType: "sales", refId: "", amount: 0, method: "对公转账", paidAt: today, remark: "" },
  });
  const dir = watch("direction");
  const refType = dir === "in" ? "sales" : "purchase";

  const openCreate = () => { reset({ direction: "in", refType: "sales", refId: "", amount: 0, method: "对公转账", paidAt: today, remark: "" }); setOpen(true); };

  const onSubmit = handleSubmit(async (v) => {
    const list = v.direction === "in" ? salesList : purList;
    const ref = list.find((x) => x.id === v.refId);
    if (!ref) return toast.error("请选择关联单据");
    const payload: any = {
      ...v,
      refType: v.direction === "in" ? "sales" : "purchase",
      refCode: ref.code,
      partyName: (ref as any).customerName ?? (ref as any).supplierName,
      amount: Number(v.amount),
      code: `${v.direction === "in" ? "RC" : "PY"}-${Date.now().toString().slice(-6)}`,
    };
    await paymentApi.create(payload);
    toast.success("已记账"); setOpen(false); reload();
  });

  return (
    <>
      <PageHeader
        title="财务收支"
        meta="CASHFLOW LEDGER"
        subtitle="登记客户回款与供应商付款流水，便于月度对账。"
        actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增收支</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="当前页 · 回款合计" value={fmtMoney(totals.in)} tone="accent" icon={<ArrowDownLeft className="h-4 w-4" />} />
        <KpiCard label="当前页 · 付款合计" value={fmtMoney(totals.out)} tone="warning" icon={<ArrowUpRight className="h-4 w-4" />} />
        <KpiCard label="净流水" value={fmtMoney(totals.in - totals.out)} tone="primary" />
      </div>

      <DataPanel
        title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">收支流水</h3>}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索单据/对手方" className="pl-8 h-8 w-56 text-xs" onChange={(e) => setFilter({ keyword: e.target.value })} />
            </div>
            <Select value={query.direction ?? "all"} onValueChange={(v) => setFilter({ direction: v })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="in">回款</SelectItem>
                <SelectItem value="out">付款</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{["流水号", "方向", "关联单据", "对手方", "金额", "方式", "日期", "操作"].map((h) => (
                <th key={h}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">加载中…</td></tr>}
              {data.list.map((p) => (
                <tr
                  key={p.id}
                  className="clickable"
                  onDoubleClick={() => toast.message(`${p.code} · ${p.partyName}`, { description: `${p.direction === "in" ? "回款" : "付款"} ${fmtMoney(p.amount)} · ${p.method} · ${p.paidAt}${p.remark ? " · " + p.remark : ""}` })}
                  title="双击查看详情"
                >
                  <td className="font-mono text-xs">{p.code}</td>
                  <td className="text-xs">
                    {p.direction === "in" ? (
                      <span className="inline-flex items-center gap-1 text-accent"><ArrowDownLeft className="h-3 w-3" />回款</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning"><ArrowUpRight className="h-3 w-3" />付款</span>
                    )}
                  </td>
                  <td className="font-mono text-xs">{p.refCode}</td>
                  <td className="text-xs truncate max-w-[200px]">{p.partyName}</td>
                  <td className={"px-5 py-3 font-mono text-sm font-bold " + (p.direction === "in" ? "text-accent" : "text-warning")}>
                    {p.direction === "in" ? "+" : "-"}{fmtMoney(p.amount)}
                  </td>
                  <td className="text-xs">{p.method}</td>
                  <td className="text-xs text-muted-foreground">{p.paidAt}</td>
                  <td className="px-5 py-3" onDoubleClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {data.list.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} className="label">本页 {data.list.length} 笔 / 共 {data.total} 笔 · 合计</td>
                  <td className="num">
                    <span className="text-accent">+{fmtMoney(totals.in)}</span>
                    <span className="mx-1 text-foreground/30">/</span>
                    <span className="text-warning">-{fmtMoney(totals.out)}</span>
                  </td>
                  <td colSpan={3} className="text-[11px] text-foreground/55">净流水 <span className="mono font-bold text-foreground">{fmtMoney(totals.in - totals.out)}</span></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <PaginationBar page={query.page!} pageSize={query.pageSize!} total={data.total} onPageChange={setPage} />
      </DataPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增收支记录</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">类型</Label>
              <Select value={dir} onValueChange={(v) => { setValue("direction", v); setValue("refId", ""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">客户回款</SelectItem>
                  <SelectItem value="out">供应商付款</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">关联{refType === "sales" ? "销售订单" : "采购单"}</Label>
              <Select value={watch("refId")} onValueChange={(v) => setValue("refId", v)}>
                <SelectTrigger><SelectValue placeholder="选择" /></SelectTrigger>
                <SelectContent>
                  {(refType === "sales" ? salesList : purList).map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.code} · {o.customerName ?? o.supplierName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">金额</Label><Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} /></div>
            <div>
              <Label className="text-xs">方式</Label>
              <Select value={watch("method")} onValueChange={(v) => setValue("method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["对公转账", "现金", "支票", "支付宝", "微信"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">日期</Label><Input type="date" {...register("paidAt")} /></div>
            <div className="col-span-2"><Label className="text-xs">备注</Label><Input {...register("remark")} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">记录</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)} title="删除流水" onConfirm={async () => {
        if (deletingId) { await paymentApi.remove(deletingId); toast.success("已删除"); setDeletingId(null); reload(); }
      }} />
    </>
  );
}
