import { useEffect, useState } from "react";
import { TrendingUp, Wallet, FileCheck2, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { DataPanel } from "@/components/common/DataPanel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { statsApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort, fmtInt, currentMonth, splitMoneyShort } from "@/lib/format";

const Money = ({ n }: { n: number }) => {
  const { num, unit } = splitMoneyShort(n);
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-xl font-bold opacity-70 mr-0.5">¥</span>
      {num}
      {unit && <span className="text-xl font-bold opacity-70 ml-1">{unit}</span>}
    </span>
  );
};

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard
          index={1}
          label="累计销售总额"
          value={<Money n={data.monthRevenue} />}
          tone="primary"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          hint={<span className="inline-flex items-center gap-1.5">▲ 12.4% <span className="opacity-70 font-normal">同比上月</span></span>}
        />
        <KpiCard
          index={2}
          label="应收账款"
          value={<Money n={data.receivable} />}
          tone="warning"
          icon={<Wallet className="h-3.5 w-3.5" />}
          hint={<span className="inline-flex items-center gap-1.5">● <span className="opacity-80 font-normal">需重点跟进</span></span>}
        />
        <KpiCard
          index={3}
          label="应付账款"
          value={<Money n={data.payable} />}
          tone="destructive"
          icon={<Wallet className="h-3.5 w-3.5" />}
          hint={<span className="inline-flex items-center gap-1.5">● <span className="opacity-80 font-normal">供应商结款</span></span>}
        />
        <KpiCard
          index={4}
          label="生效中合同"
          value={<span className="inline-flex items-baseline gap-1">{data.activeContracts}<span className="text-xl font-bold opacity-70">份</span></span>}
          tone="accent"
          icon={<FileCheck2 className="h-3.5 w-3.5" />}
          hint={<span className="font-normal">正式 <span className="font-bold">{data.formalCustomers}</span> · 潜在 <span className="font-bold">{data.leadCustomers}</span></span>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <DataPanel title="月度销售趋势" subtitle="Revenue · last 12 months" accent="tomato" className="lg:col-span-2">
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

        <DataPanel title="销售员业绩" subtitle="Top performers" accent="cobalt">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DataPanel
          title="最近销售订单"
          subtitle="Recent transactions"
          accent="mint"
          className="lg:col-span-2"
          actions={
            <Link to="/sales" className="text-xs font-bold text-foreground/70 hover:text-tomato flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-foreground/10 hover:border-tomato/40 transition-colors">
              全部订单 <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-t border-foreground/[0.06]">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45 font-mono">订单号</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45 font-mono">客户</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45 font-mono">状态</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/45 font-mono text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((s, i) => (
                <tr key={s.id} className="border-t border-foreground/[0.05] hover:bg-foreground/[0.02] transition-colors group">
                  <td className="px-6 py-3.5 font-mono text-xs text-foreground/70">
                    <span className="text-foreground/30 mr-1">{String(i + 1).padStart(2, "0")}</span>
                    {s.code}
                  </td>
                  <td className="px-6 py-3.5 text-foreground/90 font-medium truncate max-w-[200px]">{s.customerName}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-3.5 text-right font-mono font-bold text-foreground tabular-nums">{fmtMoney(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>

        <DataPanel
          title={<span className="font-display font-bold text-xl tracking-tight">低库存预警</span>}
          subtitle="Stock alerts"
          accent="mustard"
          actions={<span className="size-7 rounded-full bg-mustard/20 flex items-center justify-center"><AlertTriangle className="h-3.5 w-3.5 text-foreground" /></span>}
        >
          <div className="px-6 pb-6 pt-2 space-y-4">
            {data.lowStock.length === 0 ? (
              <div className="text-xs text-foreground/45 text-center py-8">暂无低库存商品</div>
            ) : data.lowStock.map((p) => {
              const ratio = Math.min(100, (p.stock / Math.max(1, p.safetyStock)) * 100);
              const critical = ratio < 50;
              return (
                <div key={p.id} className="group">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="text-[13px] font-semibold text-foreground truncate pr-2">{p.name}</div>
                    <div className="text-[11px] font-mono font-bold shrink-0 tabular-nums">
                      <span className={critical ? "text-tomato" : "text-foreground/70"}>{p.stock}</span>
                      <span className="text-foreground/30">/{p.safetyStock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                    <div
                      className={"h-full rounded-full transition-all " + (critical ? "bg-tomato" : "bg-mustard")}
                      style={{ width: ratio + "%" }}
                    />
                  </div>
                </div>
              );
            })}
            <Link to="/products?lowStock=1" className="text-[11px] font-bold text-foreground/60 hover:text-tomato flex items-center gap-1.5 pt-3 uppercase tracking-wider">
              查看库存详情 <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </DataPanel>
      </div>
    </>
  );
}
