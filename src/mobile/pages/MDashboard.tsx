// 控制面板（移动端）— 1:1 复刻 PC Dashboard
import { useEffect, useState, useMemo } from "react";
import { TrendingUp, Wallet, FileCheck2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";
import { MPageHeader, MKpi, MChipFilter, MSection, MTag } from "../components/MUI";
import { statsApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort, currentMonth } from "@/lib/format";
import type { BizFilter } from "@/lib/biz";

export default function MDashboard() {
  const [data, setData] = useState<any>(null);
  const [biz, setBiz] = useState<BizFilter>("all");

  useEffect(() => { statsApi.dashboard().then(setData); }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const pick = (sw: number, hw: number, total: number) => biz === "software" ? sw : biz === "hardware" ? hw : total;
    return {
      revenue: pick(data.biz.revenue.software, data.biz.revenue.hardware, data.monthRevenue),
      gross: pick(data.biz.grossProfit.software, data.biz.grossProfit.hardware, data.monthGrossProfit),
      receivable: pick(data.biz.receivable.software, data.biz.receivable.hardware, data.receivable),
      payable: pick(data.biz.payable.software, data.biz.payable.hardware, data.payable),
      trend: data.trend.map((t: any) => ({ month: t.month, amount: biz === "software" ? t.software : biz === "hardware" ? t.hardware : t.amount, software: t.software, hardware: t.hardware })),
      ranking: data.ranking.map((r: any) => ({ ...r, amount: biz === "software" ? r.software : biz === "hardware" ? r.hardware : r.amount })).sort((a: any, b: any) => b.amount - a.amount),
    };
  }, [data, biz]);

  if (!data || !view) {
    return <div className="px-4 py-12 text-center text-sm text-foreground/45">加载中…</div>;
  }

  return (
    <>
      <MPageHeader title="控制面板" subtitle={`MISSION CONTROL · ${currentMonth()}`} />
      <MChipFilter value={biz} onChange={setBiz}
        options={[{ value: "all", label: "全部业务" }, { value: "software", label: "软件" }, { value: "hardware", label: "硬件" }] as any} />

      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        <MKpi label="本月销售" value={fmtMoneyShort(view.revenue)} accent="tomato" sub="Revenue" />
        <MKpi label="本月毛利" value={fmtMoneyShort(view.gross)} accent="mint" sub={`毛利率 ${view.revenue > 0 ? ((view.gross / view.revenue) * 100).toFixed(1) : "0.0"}%`} />
        <MKpi label="应收账款" value={fmtMoneyShort(view.receivable)} accent="mustard" sub="Receivable" />
        <MKpi label="应付账款" value={fmtMoneyShort(view.payable)} accent="tomato" sub="Payable" />
        <MKpi label="生效合同" value={`${data.activeContracts} 份`} accent="cobalt" sub={`正式 ${data.formalCustomers} · 潜在 ${data.leadCustomers}`} />
        <MKpi label="低库存" value={`${data.lowStock.length}`} accent="tomato" sub="Stock alerts" />
      </div>

      <MSection title="月度销售趋势">
        <div className="bg-card rounded-2xl border border-foreground/8 p-3 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {biz === "all" ? (
              <BarChart data={view.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v / 10000 + "万"} width={36} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => fmtMoney(v)} />
                <Bar dataKey="software" stackId="a" fill="hsl(var(--cobalt))" />
                <Bar dataKey="hardware" stackId="a" fill="hsl(var(--mint))" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={view.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v / 10000 + "万"} width={36} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => fmtMoney(v)} />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--tomato))" fill="hsl(var(--tomato) / 0.2)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </MSection>

      <MSection title="销售员业绩 TOP">
        <div className="bg-card rounded-2xl border border-foreground/8 p-3 space-y-2">
          {view.ranking.slice(0, 5).map((r: any, i: number) => {
            const max = view.ranking[0]?.amount || 1;
            return (
              <div key={r.id || r.name}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="font-semibold"><span className="text-foreground/40 mr-1.5 font-mono">{String(i + 1).padStart(2, "0")}</span>{r.name}</span>
                  <span className="font-mono font-bold tabular-nums">{fmtMoneyShort(r.amount)}</span>
                </div>
                <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-tomato" style={{ width: `${(r.amount / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </MSection>

      <MSection title="最近销售订单" action={<Link to="/m/sales" className="text-[11px] text-tomato inline-flex items-center gap-1">全部<ArrowRight className="h-3 w-3" /></Link>}>
        <div className="bg-card rounded-2xl border border-foreground/8 divide-y divide-foreground/5">
          {data.recentSales.slice(0, 5).map((s: any, i: number) => (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-foreground/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[11px] font-bold">{s.code}</span>
                </div>
                <div className="text-[12px] text-foreground/75 truncate mt-0.5">{s.customerName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-[13px] tabular-nums">{fmtMoney(s.totalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      </MSection>

      <MSection title="低库存预警" action={<Link to="/m/products" className="text-[11px] text-tomato inline-flex items-center gap-1">详情<ArrowRight className="h-3 w-3" /></Link>}>
        <div className="bg-card rounded-2xl border border-foreground/8 p-3 space-y-3">
          {data.lowStock.length === 0 ? <div className="text-center py-4 text-[12px] text-foreground/45">无低库存</div> :
            data.lowStock.map((p: any) => {
              const ratio = Math.min(100, (p.stock / Math.max(1, p.safetyStock)) * 100);
              const critical = ratio < 50;
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-baseline mb-1.5 text-[12px]">
                    <div className="font-semibold truncate pr-2">{p.name}</div>
                    <div className="font-mono shrink-0 tabular-nums">
                      <span className={critical ? "text-tomato font-bold" : "text-foreground/70"}>{p.stock}</span>
                      <span className="text-foreground/30">/{p.safetyStock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${critical ? "bg-tomato" : "bg-mustard"}`} style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })
          }
        </div>
      </MSection>
    </>
  );
}
