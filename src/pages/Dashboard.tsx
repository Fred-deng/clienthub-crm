import { useEffect, useState } from "react";
import { TrendingUp, Wallet, FileCheck2, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { DataPanel } from "@/components/common/DataPanel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { statsApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort, fmtInt, currentMonth } from "@/lib/format";

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof statsApi.dashboard>> | null>(null);
  useEffect(() => { statsApi.dashboard().then(setData); }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-card border border-border animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="控制面板"
        meta={`MISSION CONTROL · ${currentMonth()}`}
        subtitle="实时业务全景：销售、应收应付、合同与库存关键指标。"
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="累计销售总额"
          value={fmtMoneyShort(data.monthRevenue)}
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
          hint={<span className="text-accent">+12.4% 同比</span>}
        />
        <KpiCard
          label="应收账款"
          value={fmtMoneyShort(data.receivable)}
          tone="warning"
          icon={<Wallet className="h-4 w-4" />}
          hint="需重点跟进"
        />
        <KpiCard
          label="应付账款"
          value={fmtMoneyShort(data.payable)}
          tone="destructive"
          icon={<Wallet className="h-4 w-4" />}
          hint="供应商结款"
        />
        <KpiCard
          label="生效中合同"
          value={`${data.activeContracts} 份`}
          tone="accent"
          icon={<FileCheck2 className="h-4 w-4" />}
          hint={<span>正式客户 <span className="text-foreground font-mono">{data.formalCustomers}</span> 家 · 潜在 <span className="text-foreground font-mono">{data.leadCustomers}</span></span>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <DataPanel title="月度销售趋势" className="lg:col-span-2">
          <div className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(v: number) => fmtMoney(v)}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>

        <DataPanel title="销售员业绩 TOP">
          <div className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ranking} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="amount" radius={[0, 2, 2, 0]}>
                  {data.ranking.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataPanel>
      </div>

      {/* Recent sales + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DataPanel
          title="最近销售订单"
          className="lg:col-span-2"
          actions={
            <Link to="/sales" className="text-xs text-primary hover:underline flex items-center gap-1">
              全部订单 <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left">
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">订单号</th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">客户</th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">状态</th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">金额</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-foreground">{s.code}</td>
                  <td className="px-5 py-3 text-foreground/90 truncate max-w-[200px]">{s.customerName}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3 text-right font-mono text-foreground">{fmtMoney(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>

        <DataPanel title={<span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]"><AlertTriangle className="h-3.5 w-3.5 text-warning" />低库存预警</span>}>
          <div className="p-5 space-y-4">
            {data.lowStock.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">暂无低库存商品</div>
            ) : data.lowStock.map((p) => (
              <div key={p.id}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="text-xs font-medium text-foreground truncate pr-2">{p.name}</div>
                  <div className="text-xs font-mono text-warning shrink-0">{p.stock}/{p.safetyStock} {p.unit}</div>
                </div>
                <div className="h-1 bg-muted">
                  <div
                    className="h-full bg-warning"
                    style={{ width: Math.min(100, (p.stock / Math.max(1, p.safetyStock)) * 100) + "%" }}
                  />
                </div>
              </div>
            ))}
            <Link to="/products?lowStock=1" className="text-xs text-primary hover:underline flex items-center gap-1 pt-2">
              <Users className="h-3 w-3" /> 查看库存详情
            </Link>
          </div>
        </DataPanel>
      </div>
    </>
  );
}
