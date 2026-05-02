import { useEffect, useMemo, useState } from "react";
import { Search, ArrowDownLeft, FileText, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { KpiCard } from "@/components/common/KpiCard";
import { BizTabs, BizSplitChip } from "@/components/common/BizTabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { salesApi, customerApi, productApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { splitSales, splitSalesReceived, type BizFilter } from "@/lib/biz";
import type { SalesOrder, Customer, Product } from "@/types";

interface Row {
  customerId: string;
  customerName: string;
  orderCount: number;
  contractAmount: number;
  invoiced: number;
  received: number;
  outstanding: number;
  oldest: string;
  level?: string;
  // biz split
  swContract: number; hwContract: number;
  swReceived: number; hwReceived: number;
  swOutstanding: number; hwOutstanding: number;
}

export default function Receivables() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "outstanding" | "settled">("outstanding");
  const [biz, setBiz] = useState<BizFilter>("all");

  useEffect(() => {
    salesApi.all().then(setOrders);
    customerApi.all().then(setCustomers);
    productApi.all().then(setProducts);
  }, []);

  const rows: Row[] = useMemo(() => {
    const map = new Map<string, Row>();
    orders.filter((o) => o.status !== "cancelled").forEach((o) => {
      const contract = o.contractAmount ?? o.totalAmount;
      const invoiced = (o.invoices || []).reduce((s, r) => s + (r.amount || 0), 0);
      const sCon = splitSales(o, products);
      const sRec = splitSalesReceived(o, products);
      const r = map.get(o.customerId) || {
        customerId: o.customerId,
        customerName: o.customerName,
        orderCount: 0,
        contractAmount: 0,
        invoiced: 0,
        received: 0,
        outstanding: 0,
        oldest: o.signedAt ?? o.createdAt,
        swContract: 0, hwContract: 0,
        swReceived: 0, hwReceived: 0,
        swOutstanding: 0, hwOutstanding: 0,
      };
      r.orderCount += 1;
      r.contractAmount += contract;
      r.invoiced += invoiced;
      r.received += o.received;
      r.swContract += sCon.software; r.hwContract += sCon.hardware;
      r.swReceived += sRec.software; r.hwReceived += sRec.hardware;
      r.outstanding = r.contractAmount - r.received;
      r.swOutstanding = r.swContract - r.swReceived;
      r.hwOutstanding = r.hwContract - r.hwReceived;
      const t = o.signedAt ?? o.createdAt;
      if (t < r.oldest) r.oldest = t;
      map.set(o.customerId, r);
    });
    customers.forEach((c) => {
      const r = map.get(c.id);
      if (r) r.level = c.level;
    });
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, customers, products]);

  // 按 biz 视图选取金额
  const view = (r: Row) => {
    if (biz === "software") return { contract: r.swContract, received: r.swReceived, outstanding: r.swOutstanding };
    if (biz === "hardware") return { contract: r.hwContract, received: r.hwReceived, outstanding: r.hwOutstanding };
    return { contract: r.contractAmount, received: r.received, outstanding: r.outstanding };
  };

  const filtered = rows.filter((r) => {
    const v = view(r);
    if (biz !== "all" && v.contract <= 0) return false;
    if (filter === "outstanding" && v.outstanding <= 0) return false;
    if (filter === "settled" && v.outstanding > 0) return false;
    if (keyword && !r.customerName.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const totals = filtered.reduce(
    (s, r) => {
      const v = view(r);
      return {
        contract: s.contract + v.contract,
        invoiced: s.invoiced + r.invoiced,
        received: s.received + v.received,
        outstanding: s.outstanding + v.outstanding,
        swContract: s.swContract + r.swContract,
        hwContract: s.hwContract + r.hwContract,
        swReceived: s.swReceived + r.swReceived,
        hwReceived: s.hwReceived + r.hwReceived,
        swOut: s.swOut + r.swOutstanding,
        hwOut: s.hwOut + r.hwOutstanding,
      };
    },
    { contract: 0, invoiced: 0, received: 0, outstanding: 0, swContract: 0, hwContract: 0, swReceived: 0, hwReceived: 0, swOut: 0, hwOut: 0 },
  );

  const today = new Date();
  const aging = (oldest: string) => {
    const d = new Date(oldest);
    return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
  };

  return (
    <>
      <PageHeader
        title="应收账款"
        meta="ACCOUNTS RECEIVABLE"
        subtitle="按客户汇总销售合同金额、已开票、已回款与未收账款，便于催收与对账。"
        actions={<BizTabs value={biz} onChange={setBiz} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={biz === "all" ? "合同总额" : biz === "software" ? "软件合同总额" : "硬件合同总额"}
          value={fmtMoney(totals.contract)} tone="primary" icon={<FileText className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swContract} hardware={totals.hwContract} formatter={fmtMoneyShort} /> : undefined}
        />
        <KpiCard label="已开票" value={fmtMoney(totals.invoiced)} tone="accent" />
        <KpiCard
          label="已回款" value={fmtMoney(totals.received)} tone="accent" icon={<ArrowDownLeft className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swReceived} hardware={totals.hwReceived} formatter={fmtMoneyShort} /> : undefined}
        />
        <KpiCard
          label="未收账款" value={fmtMoney(totals.outstanding)} tone="warning" icon={<AlertCircle className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swOut} hardware={totals.hwOut} formatter={fmtMoneyShort} /> : undefined}
        />
      </div>

      <DataPanel
        title="按客户汇总"
        subtitle={`Receivable by customer · ${filtered.length} customers`}
        accent="tomato"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input placeholder="搜索客户" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9 h-9 w-56 text-xs rounded-full" />
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">仅看未收</SelectItem>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="settled">已结清</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>客户</th>
                <th>等级</th>
                <th className="num">合同数</th>
                <th className="num">合同金额{biz !== "all" && <span className="text-[10px] text-foreground/45 ml-1">({biz === "software" ? "软" : "硬"})</span>}</th>
                <th className="num">已开票</th>
                <th className="num">已回款</th>
                <th className="num">未收账款</th>
                <th className="num">最早签约</th>
                <th className="num">账龄(天)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="empty"><td colSpan={9} className="empty">暂无应收数据</td></tr>
              )}
              {filtered.map((r) => {
                const days = aging(r.oldest);
                const v = view(r);
                const ageTone = days > 90 ? "text-tomato font-bold" : days > 30 ? "text-mustard" : "text-foreground/60";
                return (
                  <tr key={r.customerId}>
                    <td className="font-semibold">{r.customerName}</td>
                    <td className="text-xs text-foreground/65">{r.level || "—"}</td>
                    <td className="num text-foreground/70">{r.orderCount}</td>
                    <td className="num">
                      {fmtMoney(v.contract)}
                      {biz === "all" && (r.swContract > 0 && r.hwContract > 0) && (
                        <div className="text-[10px] text-foreground/45 mono">软{fmtMoneyShort(r.swContract)} · 硬{fmtMoneyShort(r.hwContract)}</div>
                      )}
                    </td>
                    <td className="num text-cobalt">{fmtMoney(r.invoiced)}</td>
                    <td className="num text-mint">{fmtMoney(v.received)}</td>
                    <td className={"num " + (v.outstanding > 0 ? "text-tomato" : "text-foreground/40")}>{fmtMoney(v.outstanding)}</td>
                    <td className="num mono text-[12px] text-foreground/60">{r.oldest}</td>
                    <td className={"num mono " + ageTone}>{days}</td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3} className="label">合计 {filtered.length} 客户</td>
                  <td className="num">{fmtMoney(totals.contract)}</td>
                  <td className="num text-cobalt">{fmtMoney(totals.invoiced)}</td>
                  <td className="num text-mint">{fmtMoney(totals.received)}</td>
                  <td className="num text-tomato">{fmtMoney(totals.outstanding)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </DataPanel>
    </>
  );
}
