// 账款核对工作台：聚合所有未结清的销售/采购订单，支持快速登记收/付款，并按客户/供应商分组对账。
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowDownLeft, ArrowUpRight, AlertCircle, CheckCircle2, Wallet, FileText, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { KpiCard } from "@/components/common/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickPaymentDialog } from "@/components/common/QuickPaymentDialog";
import { DateRangeFilter, inRange, type DateRangeValue } from "@/components/common/DateRangeFilter";
import { salesApi, purchaseApi } from "@/services/api";
import { fmtMoney } from "@/lib/format";
import type { SalesOrder, PurchaseOrder } from "@/types";

type Dir = "in" | "out";

interface Row {
  id: string;
  code: string;
  partyId: string;
  partyName: string;
  contract: number;
  paid: number;
  outstanding: number;
  createdAt: string;
  status: string;
  dir: Dir;
  refType: "sales" | "purchase";
}

const statusZh: Record<string, string> = {
  pending: "待发货", shipped: "已发货", delivered: "已送达", cancelled: "已取消",
  draft: "草稿", ordered: "已下单", received: "已入库",
};

export default function Reconciliation() {
  const [sales, setSales] = useState<SalesOrder[]>([]);
  const [purs, setPurs] = useState<PurchaseOrder[]>([]);
  const [tab, setTab] = useState<Dir>("in");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"outstanding" | "all">("outstanding");
  const [dlg, setDlg] = useState<Row | null>(null);

  const reload = () => {
    salesApi.all().then(setSales);
    purchaseApi.all().then(setPurs);
  };
  useEffect(() => { reload(); }, []);

  const inRows: Row[] = useMemo(() =>
    sales.filter((o) => o.status !== "cancelled").map((o) => {
      const c = o.contractAmount ?? o.totalAmount;
      return {
        id: o.id, code: o.code, partyId: o.customerId, partyName: o.customerName,
        contract: c, paid: o.received || 0, outstanding: c - (o.received || 0),
        createdAt: o.createdAt, status: o.status, dir: "in", refType: "sales",
      };
    }), [sales]);

  const outRows: Row[] = useMemo(() =>
    purs.filter((o) => o.status !== "cancelled" && o.status !== "draft").map((o) => {
      const c = o.contractAmount || o.totalAmount;
      return {
        id: o.id, code: o.code, partyId: o.supplierId, partyName: o.supplierName,
        contract: c, paid: o.paid || 0, outstanding: c - (o.paid || 0),
        createdAt: o.createdAt, status: o.status, dir: "out", refType: "purchase",
      };
    }), [purs]);

  const all = tab === "in" ? inRows : outRows;
  const filtered = all.filter((r) => {
    if (filter === "outstanding" && r.outstanding <= 0) return false;
    if (keyword) {
      const k = keyword.toLowerCase();
      if (!r.partyName.toLowerCase().includes(k) && !r.code.toLowerCase().includes(k)) return false;
    }
    return true;
  }).sort((a, b) => b.outstanding - a.outstanding);

  // KPI（基于当前 tab 全量有效订单，与 Dashboard 应收/应付口径一致，不受筛选影响）
  const totals = all.reduce(
    (s, r) => ({
      contract: s.contract + r.contract,
      paid: s.paid + r.paid,
      outstanding: s.outstanding + Math.max(r.outstanding, 0),
      settled: s.settled + (r.outstanding <= 0 ? 1 : 0),
    }),
    { contract: 0, paid: 0, outstanding: 0, settled: 0 },
  );

  // 按对手方分组
  const groups = useMemo(() => {
    const map = new Map<string, { partyName: string; rows: Row[]; outstanding: number }>();
    filtered.forEach((r) => {
      const g = map.get(r.partyId) || { partyName: r.partyName, rows: [], outstanding: 0 };
      g.rows.push(r);
      g.outstanding += r.outstanding;
      map.set(r.partyId, g);
    });
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g })).sort((a, b) => b.outstanding - a.outstanding);
  }, [filtered]);

  const today = new Date();
  const aging = (d: string) => Math.max(0, Math.floor((today.getTime() - new Date(d).getTime()) / 86400000));

  return (
    <>
      <PageHeader
        title="账款核对"
        meta="RECONCILIATION"
        subtitle="对全部未结清的销售回款与采购付款进行对账，按对手方汇总并可一键登记收/付款。"
        actions={
          <Tabs value={tab} onValueChange={(v) => setTab(v as Dir)}>
            <TabsList>
              <TabsTrigger value="in" className="gap-1.5"><ArrowDownLeft className="h-3.5 w-3.5" />应收（销售回款）</TabsTrigger>
              <TabsTrigger value="out" className="gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" />应付（采购付款）</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label={tab === "in" ? "合同总额" : "采购总额"} value={fmtMoney(totals.contract)} tone="primary" icon={<FileText className="h-4 w-4" />} />
        <KpiCard label={tab === "in" ? "已回款" : "已付款"} value={fmtMoney(totals.paid)} tone="accent" icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label={tab === "in" ? "未收账款" : "未付账款"} value={fmtMoney(totals.outstanding)} tone="warning" icon={<AlertCircle className="h-4 w-4" />} />
        <KpiCard label="已结清单据" value={`${totals.settled} 笔`} tone="accent" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <DataPanel
        title={tab === "in" ? "应收明细 · 按客户分组" : "应付明细 · 按供应商分组"}
        subtitle={`${groups.length} parties · ${filtered.length} orders`}
        accent={tab === "in" ? "tomato" : "cobalt"}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input placeholder="搜索对手方/单号" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9 h-9 w-56 text-xs rounded-full" />
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">仅未结清</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {groups.length === 0 ? (
          <div className="p-12 text-center text-sm text-foreground/45">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-mint" />
            没有需要核对的账款，全部结清！
          </div>
        ) : (
          <div className="divide-y divide-foreground/[0.06]">
            {groups.map((g) => (
              <div key={g.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={"size-1.5 rounded-full " + (tab === "in" ? "bg-tomato" : "bg-cobalt")} />
                    <span className="font-display font-bold text-[15px]">{g.partyName}</span>
                    <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider">{g.rows.length} 单</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-foreground/45 font-mono uppercase">{tab === "in" ? "Outstanding" : "Unpaid"}</div>
                    <div className={"font-display font-black text-[18px] tabular-nums " + (g.outstanding > 0 ? "text-tomato" : "text-foreground/40")}>{fmtMoney(g.outstanding)}</div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-foreground/[0.06]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>单号</th>
                        <th>状态</th>
                        <th className="num">合同</th>
                        <th className="num">{tab === "in" ? "已回款" : "已付款"}</th>
                        <th className="num">余额</th>
                        <th className="num">下单日</th>
                        <th className="num">账龄</th>
                        <th className="num">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r) => {
                        const days = aging(r.createdAt);
                        const ageTone = days > 90 ? "text-tomato font-bold" : days > 30 ? "text-mustard" : "text-foreground/60";
                        const settled = r.outstanding <= 0;
                        return (
                          <tr key={r.id}>
                            <td>
                              <Link to={tab === "in" ? "/sales" : "/purchases"} className="font-mono text-[12px] font-semibold hover:text-cobalt inline-flex items-center gap-1">
                                {r.code} <ExternalLink className="h-3 w-3 opacity-50" />
                              </Link>
                            </td>
                            <td><span className="text-[11px] px-2 py-0.5 rounded-full bg-foreground/[0.06] text-foreground/70">{statusZh[r.status] || r.status}</span></td>
                            <td className="num">{fmtMoney(r.contract)}</td>
                            <td className="num text-mint">{fmtMoney(r.paid)}</td>
                            <td className={"num " + (settled ? "text-foreground/40" : "text-tomato font-bold")}>{fmtMoney(r.outstanding)}</td>
                            <td className="num mono text-[12px] text-foreground/60">{r.createdAt}</td>
                            <td className={"num mono " + ageTone}>{days}d</td>
                            <td className="num">
                              {settled ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-mint font-semibold"><CheckCircle2 className="h-3 w-3" />已结清</span>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 px-3 text-[11px]" onClick={() => setDlg(r)}>
                                  {tab === "in" ? "登记回款" : "登记付款"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {dlg && (
        <QuickPaymentDialog
          open={!!dlg}
          onOpenChange={(v) => !v && setDlg(null)}
          direction={dlg.dir}
          refType={dlg.refType}
          refId={dlg.id}
          refCode={dlg.code}
          partyName={dlg.partyName}
          remaining={dlg.outstanding}
          onSaved={() => { setDlg(null); reload(); }}
        />
      )}
    </>
  );
}
