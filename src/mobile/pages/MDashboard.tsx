import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { statsApi } from "@/services/api";
import { ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Wallet, Users, Package, Truck, FileBox, MessageSquareText, Scale, ChevronRight, TrendingUp, UserSquare2 } from "lucide-react";
import { MPageHeader, MKpi, MSection, MCard, MTag, MBizTabs } from "../components/MUI";
import type { BizFilter } from "@/lib/biz";

const fmt = (n: number) => "¥" + (n >= 10000 ? (n / 10000).toFixed(1) + "万" : n.toFixed(0));

const quickEntries = [
  { to: "/m/customers", label: "客户", icon: Users, color: "bg-tomato/10 text-tomato" },
  { to: "/m/contacts", label: "联系人", icon: UserSquare2, color: "bg-cobalt/10 text-cobalt" },
  { to: "/m/follow-ups", label: "跟进", icon: MessageSquareText, color: "bg-mustard/15 text-foreground" },
  { to: "/m/products", label: "产品", icon: Package, color: "bg-mint/20 text-foreground" },
  { to: "/m/suppliers", label: "供应商", icon: Truck, color: "bg-foreground/8 text-foreground" },
  { to: "/m/purchases", label: "采购", icon: FileBox, color: "bg-cobalt/10 text-cobalt" },
  { to: "/m/sales", label: "销售", icon: ShoppingCart, color: "bg-tomato/10 text-tomato" },
  { to: "/m/payments", label: "收支", icon: Wallet, color: "bg-mustard/15 text-foreground" },
  { to: "/m/receivables", label: "应收", icon: ArrowDownToLine, color: "bg-mint/20 text-foreground" },
  { to: "/m/payables", label: "应付", icon: ArrowUpFromLine, color: "bg-tomato/10 text-tomato" },
  { to: "/m/reconciliation", label: "对账", icon: Scale, color: "bg-foreground/8 text-foreground" },
];

export default function MDashboard() {
  const [data, setData] = useState<any>(null);
  const [biz, setBiz] = useState<BizFilter>("all");
  const nav = useNavigate();
  useEffect(() => { statsApi.dashboard().then(setData); }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const pick = (sw: number, hw: number, total: number) => biz === "software" ? sw : biz === "hardware" ? hw : total;
    return {
      monthRevenue: pick(data.biz.revenue.software, data.biz.revenue.hardware, data.monthRevenue),
      monthGrossProfit: pick(data.biz.grossProfit.software, data.biz.grossProfit.hardware, data.monthGrossProfit),
      receivable: pick(data.biz.receivable.software, data.biz.receivable.hardware, data.receivable),
      payable: pick(data.biz.payable.software, data.biz.payable.hardware, data.payable),
      ranking: data.ranking
        .map((r: any) => ({ ...r, amount: biz === "software" ? r.software : biz === "hardware" ? r.hardware : r.amount }))
        .sort((a: any, b: any) => b.amount - a.amount),
    };
  }, [data, biz]);

  const bizLabel = biz === "software" ? "软件" : biz === "hardware" ? "硬件" : "整体";

  return (
    <div>
      <MPageHeader title="集马 · 工作台" subtitle={new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" })} />
      <MBizTabs value={biz} onChange={setBiz} />

      <section className="px-4 pt-1 pb-2">
        <div className="rounded-3xl bg-gradient-to-br from-tomato to-[hsl(8_72%_44%)] text-[hsl(var(--paper))] p-5 shadow-lg shadow-tomato/20">
          <div className="text-[11px] font-mono uppercase tracking-wider opacity-80">本月{bizLabel}销售额</div>
          <div className="text-3xl font-display font-black tabular-nums mt-1">{view ? fmt(view.monthRevenue) : "—"}</div>
          <div className="flex items-center gap-2 mt-3 text-[11px] opacity-90">
            <TrendingUp className="h-3.5 w-3.5" />
            毛利 {view ? fmt(view.monthGrossProfit) : "—"} · 活跃合同 {data?.activeContracts ?? 0}
          </div>
        </div>
      </section>

      <section className="px-4 pt-2 pb-4 grid grid-cols-2 gap-2.5">
        <MKpi label="应收账款" value={view ? fmt(view.receivable) : "—"} accent="mustard" />
        <MKpi label="应付账款" value={view ? fmt(view.payable) : "—"} accent="tomato" />
        <MKpi label="正式客户" value={data?.formalCustomers ?? "—"} accent="cobalt" sub={`潜在 ${data?.leadCustomers ?? 0}`} />
        <MKpi label="低库存" value={data?.lowStock?.length ?? "—"} accent="tomato" sub="件需补货" />
      </section>

      <MSection title="快捷入口">
        <div className="grid grid-cols-4 gap-2">
          {quickEntries.map((e) => (
            <button key={e.to} onClick={() => nav(e.to)} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-card border border-foreground/8 active:scale-95 transition-transform">
              <span className={`size-10 rounded-xl flex items-center justify-center ${e.color}`}>
                <e.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] text-foreground/75">{e.label}</span>
            </button>
          ))}
        </div>
      </MSection>

      <MSection title="销售员业绩" action={<button onClick={() => nav("/m/sales")} className="text-[11px] text-tomato">查看全部</button>}>
        <div className="space-y-2">
          {(view?.ranking ?? []).slice(0, 5).map((r: any, i: number) => (
            <MCard key={r.ownerId} className="!p-3.5">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-full font-display font-black flex items-center justify-center ${i === 0 ? "bg-tomato text-[hsl(var(--paper))]" : i < 3 ? "bg-mustard text-foreground" : "bg-foreground/8 text-foreground/65"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-[11px] text-foreground/55 mt-0.5">软 {fmt(r.software)} · 硬 {fmt(r.hardware)}</div>
                </div>
                <div className="font-mono font-bold tabular-nums text-sm">{fmt(r.amount)}</div>
              </div>
            </MCard>
          ))}
        </div>
      </MSection>

      <MSection title="最近销售订单" action={<button onClick={() => nav("/m/sales")} className="text-[11px] text-tomato">更多 <ChevronRight className="inline h-3 w-3" /></button>}>
        <div className="space-y-2">
          {(data?.recentSales ?? []).slice(0, 5).map((o: any) => (
            <MCard key={o.id} className="!p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{o.customerName}</div>
                  <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{o.code} · {o.createdAt}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold tabular-nums text-sm">{fmt(o.contractAmount ?? o.totalAmount)}</div>
                  <MTag variant={o.status === "delivered" ? "mint" : o.status === "cancelled" ? "muted" : "mustard"}>{
                    { pending: "待发货", shipped: "已发货", delivered: "已交付", cancelled: "已取消" }[o.status as string] ?? o.status
                  }</MTag>
                </div>
              </div>
            </MCard>
          ))}
        </div>
      </MSection>

      <div className="h-4" />
    </div>
  );
}
