import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { BizTabs, BizSplitChip } from "@/components/common/BizTabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statsApi, productApi } from "@/services/api";
import { fmtMoney, currentMonth } from "@/lib/format";
import { splitSales, splitSalesReceived, pickByFilter, matchFilter, bizLabel, bizTone, type BizFilter } from "@/lib/biz";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const COLORS = ["hsl(var(--cobalt))", "hsl(var(--mint))", "hsl(var(--mustard))", "hsl(var(--foreground)/0.3)"];

export default function Reports() {
  const [dash, setDash] = useState<Awaited<ReturnType<typeof statsApi.dashboard>> | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [recon, setRecon] = useState<Awaited<ReturnType<typeof statsApi.monthlyReconcile>> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [biz, setBiz] = useState<BizFilter>("all");

  useEffect(() => { statsApi.dashboard().then(setDash); }, []);
  useEffect(() => { statsApi.monthlyReconcile(month).then(setRecon); }, [month]);
  useEffect(() => { productApi.all().then(setProducts); }, []);

  const filteredSales = useMemo(() => {
    if (!recon) return [];
    return recon.sales
      .map((o) => ({ o, split: splitSales(o, products), recv: splitSalesReceived(o, products) }))
      .filter(({ split }) => matchFilter(split, biz));
  }, [recon, products, biz]);

  if (!dash || !recon) return <div className="text-xs text-muted-foreground">加载中…</div>;

  // 按 biz 选择金额
  const bizSales = biz === "all"
    ? recon.biz.sales.software + recon.biz.sales.hardware
    : (recon.biz.sales as any)[biz];
  const bizRecv = biz === "all"
    ? recon.biz.received.software + recon.biz.received.hardware
    : (recon.biz.received as any)[biz];
  const bizPaid = biz === "all"
    ? recon.biz.paid.software + recon.biz.paid.hardware
    : (recon.biz.paid as any)[biz];
  const balance = bizRecv - bizPaid;

  // 销售员排行（按 biz 取值）
  const ranking = dash.ranking.map((r: any) => ({
    name: r.name,
    amount: biz === "software" ? r.software : biz === "hardware" ? r.hardware : r.amount,
  })).sort((a, b) => b.amount - a.amount);

  return (
    <>
      <PageHeader
        title="数据报表"
        meta="ANALYTICS · RECONCILIATION"
        subtitle="月度对账、客户分布、销售趋势分析。"
      />

      <div className="mb-4 flex items-center justify-between">
        <BizTabs value={biz} onChange={setBiz} />
        <span className="text-[11px] text-muted-foreground">按订单明细自动归类（混合按比例拆分）</span>
      </div>

      <DataPanel className="mb-6" title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">月度对账</h3>}
        actions={
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">对账月份</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
        }
>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">销售总额</div>
            <div className="text-xl font-mono font-semibold">{fmtMoney(bizSales)}</div>
            {biz === "all" && <div className="mt-1.5"><BizSplitChip software={recon.biz.sales.software} hardware={recon.biz.sales.hardware} formatter={fmtMoney} /></div>}
            <div className="text-xs text-muted-foreground mt-1">订单数 {filteredSales.length}</div>
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">实际回款</div>
            <div className="text-xl font-mono font-semibold text-accent">{fmtMoney(bizRecv)}</div>
            {biz === "all" && <div className="mt-1.5"><BizSplitChip software={recon.biz.received.software} hardware={recon.biz.received.hardware} formatter={fmtMoney} /></div>}
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">实际付款</div>
            <div className="text-xl font-mono font-semibold text-warning">{fmtMoney(bizPaid)}</div>
            {biz === "all" && <div className="mt-1.5"><BizSplitChip software={recon.biz.paid.software} hardware={recon.biz.paid.hardware} formatter={fmtMoney} /></div>}
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">净现金流</div>
            <div className={"text-xl font-mono font-semibold " + (balance>= 0 ? "text-accent" : "text-destructive")}>{fmtMoney(balance)}</div>
          </div>
        </div>
      </DataPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DataPanel title="客户业务覆盖分布">
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dash.typeDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {dash.typeDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>

        <DataPanel title={`销售员业绩排行 · ${biz === "all" ? "全部" : biz === "software" ? "软件" : "硬件"}`} className="lg:col-span-2">
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              {biz === "all" ? (
                <BarChart data={dash.ranking}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="software" name="软件" stackId="a" fill="hsl(var(--cobalt))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="hardware" name="硬件" stackId="a" fill="hsl(var(--mint))" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={ranking}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                  <Bar dataKey="amount" fill={biz === "software" ? "hsl(var(--cobalt))" : "hsl(var(--mint))"} radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </div>

      <DataPanel title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">{month} 销售明细</h3>}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{["订单号", "客户", "业务", "金额", "已回款", "未收", "下单日"].map((h) => (
                <th key={h}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">该月份暂无销售订单</td></tr>}
              {filteredSales.map(({ o, split, recv }) => {
                const amt = pickByFilter(split, biz);
                const recvAmt = biz === "software" ? recv.software : biz === "hardware" ? recv.hardware : (recv.software + recv.hardware);
                return (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.code}</td>
                    <td className="text-xs">{o.customerName}</td>
                    <td className="text-xs">
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold", bizTone[split.category])}>
                        {bizLabel[split.category]}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{fmtMoney(amt)}</td>
                    <td className="font-mono text-xs text-accent">{fmtMoney(recvAmt)}</td>
                    <td className="font-mono text-xs text-warning">{fmtMoney(amt - recvAmt)}</td>
                    <td className="text-xs text-muted-foreground">{o.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </>
  );
}
