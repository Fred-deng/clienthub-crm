import { useEffect, useState, useMemo } from "react";
import { TrendingUp, Wallet, FileCheck2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, Legend } from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/common/KpiCard";
import { DataPanel } from "@/components/common/DataPanel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BizTabs, BizSplitChip } from "@/components/common/BizTabs";
import { statsApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort, currentMonth, splitMoneyShort } from "@/lib/format";
import type { BizFilter } from "@/lib/biz";

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
  const [biz, setBiz] = useState<BizFilter>("all");
  useEffect(() => { statsApi.dashboard().then(setData); }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const pick = (sw: number, hw: number, total: number) =>
      biz === "software" ? sw : biz === "hardware" ? hw : total;
    return {
      monthRevenue: pick(data.biz.revenue.software, data.biz.revenue.hardware, data.monthRevenue),
      monthGrossProfit: pick(data.biz.grossProfit.software, data.biz.grossProfit.hardware, data.monthGrossProfit),
      receivable: pick(data.biz.receivable.software, data.biz.receivable.hardware, data.receivable),
      payable: pick(data.biz.payable.software, data.biz.payable.hardware, data.payable),
      trend: data.trend.map((t) => ({
        month: t.month,
        amount: biz === "software" ? t.software : biz === "hardware" ? t.hardware : t.amount,
        software: t.software,
        hardware: t.hardware,
      })),
      ranking: data.ranking
        .map((r) => ({ ...r, amount: biz === "software" ? r.software : biz === "hardware" ? r.hardware : r.amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [data, biz]);

  if (!data || !view) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        actions={<BizTabs value={biz} onChange={setBiz} />}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <KpiCard
          index={1}
          label={biz === "all" ? "本月销售总额" : biz === "software" ? "本月软件销售" : "本月硬件销售"}
          value={<Money n={view.monthRevenue} />}
          tone="primary"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          hint={biz === "all"
            ? <BizSplitChip software={data.biz.revenue.software} hardware={data.biz.revenue.hardware} formatter={fmtMoneyShort} />
            : <span className="inline-flex items-center gap-1.5">▲ <span className="opacity-70 font-normal">业务占比 {((view.monthRevenue / Math.max(1, data.monthRevenue)) * 100).toFixed(1)}%</span></span>}
        />
        <KpiCard
          index={2}
          label={biz === "all" ? "本月毛利" : biz === "software" ? "本月软件毛利" : "本月硬件毛利"}
          value={<Money n={view.monthGrossProfit} />}
          tone="accent"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          hint={biz === "all"
            ? <BizSplitChip software={data.biz.grossProfit.software} hardware={data.biz.grossProfit.hardware} formatter={fmtMoneyShort} />
            : <span className="inline-flex items-center gap-1.5">● <span className="opacity-80 font-normal">毛利率 {view.monthRevenue > 0 ? ((view.monthGrossProfit / view.monthRevenue) * 100).toFixed(1) : "0.0"}%</span></span>}
        />
        <KpiCard
          index={3}
          label="应收账款"
          value={<Money n={view.receivable} />}
          tone="warning"
          icon={<Wallet className="h-3.5 w-3.5" />}
          hint={biz === "all"
            ? <BizSplitChip software={data.biz.receivable.software} hardware={data.biz.receivable.hardware} formatter={fmtMoneyShort} />
            : <span className="inline-flex items-center gap-1.5">● <span className="opacity-80 font-normal">需重点跟进</span></span>}
        />
        <KpiCard
          index={4}
          label="应付账款"
          value={<Money n={view.payable} />}
          tone="destructive"
          icon={<Wallet className="h-3.5 w-3.5" />}
          hint={biz === "all"
            ? <BizSplitChip software={data.biz.payable.software} hardware={data.biz.payable.hardware} formatter={fmtMoneyShort} />
            : <span className="inline-flex items-center gap-1.5">● <span className="opacity-80 font-normal">供应商结款</span></span>}
        />
        <KpiCard
          index={5}
          label="生效中合同"
          value={<span className="inline-flex items-baseline gap-1">{data.activeContracts}<span className="text-xl font-bold opacity-70">份</span></span>}
          tone="accent"
          icon={<FileCheck2 className="h-3.5 w-3.5" />}
          hint={<span className="font-normal">正式 <span className="font-bold">{data.formalCustomers}</span> · 潜在 <span className="font-bold">{data.leadCustomers}</span></span>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <DataPanel title="月度销售趋势" subtitle={biz === "all" ? "Revenue · 软硬件叠加" : `Revenue · ${biz === "software" ? "软件" : "硬件"}`} accent="tomato" className="lg:col-span-2">
          <div className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {biz === "all" ? (
                <BarChart data={view.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="software" name="软件" stackId="a" fill="hsl(var(--cobalt, 215 80% 50%))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="hardware" name="硬件" stackId="a" fill="hsl(var(--mint, 152 38% 60%))" radius={[2, 2, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={view.trend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </DataPanel>

        <DataPanel title="销售员业绩" subtitle="Top performers" accent="cobalt">
          <div className="p-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.ranking} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v / 10000 + "万"} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="amount" radius={[0, 2, 2, 0]}>
                  {view.ranking.map((_, i) => (
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
