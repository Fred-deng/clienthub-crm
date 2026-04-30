import { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { KpiCard } from "@/components/common/KpiCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { statsApi } from "@/services/api";
import { fmtMoney, currentMonth } from "@/lib/format";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))"];

export default function Reports() {
  const [dash, setDash] = useState<Awaited<ReturnType<typeof statsApi.dashboard>> | null>(null);
  const [month, setMonth] = useState(currentMonth());
  const [recon, setRecon] = useState<Awaited<ReturnType<typeof statsApi.monthlyReconcile>> | null>(null);

  useEffect(() => { statsApi.dashboard().then(setDash); }, []);
  useEffect(() => { statsApi.monthlyReconcile(month).then(setRecon); }, [month]);

  if (!dash || !recon) return <div className="text-xs text-muted-foreground">加载中…</div>;

  const balance = recon.totalReceived - recon.totalPaid;

  return (
    <>
      <PageHeader
        title="数据报表"
        meta="ANALYTICS · RECONCILIATION"
        subtitle="月度对账、客户分布、销售趋势分析。"
      />

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
            <div className="text-xl font-mono font-semibold">{fmtMoney(recon.totalSales)}</div>
            <div className="text-xs text-muted-foreground mt-1">订单数 {recon.sales.length}</div>
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">实际回款</div>
            <div className="text-xl font-mono font-semibold text-accent">{fmtMoney(recon.totalReceived)}</div>
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">实际付款</div>
            <div className="text-xl font-mono font-semibold text-warning">{fmtMoney(recon.totalPaid)}</div>
          </div>
          <div className="bg-card p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">净现金流</div>
            <div className={"text-xl font-mono font-semibold " + (balance>= 0 ? "text-accent" : "text-destructive")}>{fmtMoney(balance)}</div>
          </div>
        </div>
      </DataPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DataPanel title="客户类型分布">
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

        <DataPanel title="销售员业绩排行" className="lg:col-span-2">
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.ranking}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </div>

      <DataPanel title={<h3 className="text-xs font-bold uppercase tracking-[0.2em]">{month} 销售明细</h3>}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>{["订单号", "客户", "金额", "已回款", "未收", "下单日"].map((h) => (
                <th key={h}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recon.sales.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">该月份暂无销售订单</td></tr>}
              {recon.sales.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.code}</td>
                  <td className="text-xs">{o.customerName}</td>
                  <td className="font-mono text-xs">{fmtMoney(o.totalAmount)}</td>
                  <td className="font-mono text-xs text-accent">{fmtMoney(o.received)}</td>
                  <td className="font-mono text-xs text-warning">{fmtMoney(o.totalAmount - o.received)}</td>
                  <td className="text-xs text-muted-foreground">{o.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </>
  );
}
