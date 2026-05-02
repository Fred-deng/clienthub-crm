import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpRight, FileText, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { KpiCard } from "@/components/common/KpiCard";
import { BizTabs, BizSplitChip } from "@/components/common/BizTabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter, inRange, type DateRangeValue } from "@/components/common/DateRangeFilter";
import { purchaseApi, supplierApi, productApi } from "@/services/api";
import { fmtMoney, fmtMoneyShort } from "@/lib/format";
import { splitPurchase, splitPurchasePaid, type BizFilter } from "@/lib/biz";
import type { PurchaseOrder, Supplier, Product } from "@/types";

interface Row {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  contractAmount: number;
  invoiced: number;
  paid: number;
  outstanding: number;
  oldest: string;
  category?: string;
  swContract: number; hwContract: number;
  swPaid: number; hwPaid: number;
  swOutstanding: number; hwOutstanding: number;
}

export default function Payables() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"all" | "outstanding" | "settled">("outstanding");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [range, setRange] = useState<DateRangeValue>({});

  useEffect(() => {
    purchaseApi.all().then(setOrders);
    supplierApi.all().then(setSuppliers);
    productApi.all().then(setProducts);
  }, []);

  const rows: Row[] = useMemo(() => {
    const map = new Map<string, Row>();
    orders.filter((o) => o.status !== "cancelled" && o.status !== "draft").forEach((o) => {
      const contract = o.contractAmount || o.totalAmount;
      const invoiced = (o.invoices || []).reduce((s, r) => s + (r.amount || 0), 0);
      const sCon = splitPurchase(o, products);
      const sPaid = splitPurchasePaid(o, products);
      const r = map.get(o.supplierId) || {
        supplierId: o.supplierId,
        supplierName: o.supplierName,
        orderCount: 0,
        contractAmount: 0,
        invoiced: 0,
        paid: 0,
        outstanding: 0,
        oldest: o.createdAt,
        swContract: 0, hwContract: 0,
        swPaid: 0, hwPaid: 0,
        swOutstanding: 0, hwOutstanding: 0,
      };
      r.orderCount += 1;
      r.contractAmount += contract;
      r.invoiced += invoiced;
      r.paid += o.paid;
      r.swContract += sCon.software; r.hwContract += sCon.hardware;
      r.swPaid += sPaid.software; r.hwPaid += sPaid.hardware;
      r.outstanding = r.contractAmount - r.paid;
      r.swOutstanding = r.swContract - r.swPaid;
      r.hwOutstanding = r.hwContract - r.hwPaid;
      const t = o.createdAt;
      if (t && t < r.oldest) r.oldest = t;
      map.set(o.supplierId, r);
    });
    suppliers.forEach((s) => {
      const r = map.get(s.id);
      if (r) r.category = s.category;
    });
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orders, suppliers, products]);

  const view = (r: Row) => {
    if (biz === "software") return { contract: r.swContract, paid: r.swPaid, outstanding: r.swOutstanding };
    if (biz === "hardware") return { contract: r.hwContract, paid: r.hwPaid, outstanding: r.hwOutstanding };
    return { contract: r.contractAmount, paid: r.paid, outstanding: r.outstanding };
  };

  const filtered = rows.filter((r) => {
    const v = view(r);
    if (biz !== "all" && v.contract <= 0) return false;
    if (filter === "outstanding" && v.outstanding <= 0) return false;
    if (filter === "settled" && v.outstanding > 0) return false;
    if (keyword && !r.supplierName.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const totals = filtered.reduce(
    (s, r) => {
      const v = view(r);
      return {
        contract: s.contract + v.contract,
        invoiced: s.invoiced + r.invoiced,
        paid: s.paid + v.paid,
        outstanding: s.outstanding + v.outstanding,
        swContract: s.swContract + r.swContract,
        hwContract: s.hwContract + r.hwContract,
        swPaid: s.swPaid + r.swPaid,
        hwPaid: s.hwPaid + r.hwPaid,
        swOut: s.swOut + r.swOutstanding,
        hwOut: s.hwOut + r.hwOutstanding,
      };
    },
    { contract: 0, invoiced: 0, paid: 0, outstanding: 0, swContract: 0, hwContract: 0, swPaid: 0, hwPaid: 0, swOut: 0, hwOut: 0 },
  );

  const today = new Date();
  const aging = (oldest: string) => {
    const d = new Date(oldest);
    return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
  };

  return (
    <>
      <PageHeader
        title="应付账款"
        meta="ACCOUNTS PAYABLE"
        subtitle="按供应商汇总采购合同金额、收到发票、已付款与未付账款，便于付款排期。"
        actions={<BizTabs value={biz} onChange={setBiz} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label={biz === "all" ? "合同总额" : biz === "software" ? "软件合同总额" : "硬件合同总额"}
          value={fmtMoney(totals.contract)} tone="primary" icon={<FileText className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swContract} hardware={totals.hwContract} formatter={fmtMoneyShort} /> : undefined}
        />
        <KpiCard label="已收发票" value={fmtMoney(totals.invoiced)} tone="accent" />
        <KpiCard
          label="已付款" value={fmtMoney(totals.paid)} tone="accent" icon={<ArrowUpRight className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swPaid} hardware={totals.hwPaid} formatter={fmtMoneyShort} /> : undefined}
        />
        <KpiCard
          label="未付账款" value={fmtMoney(totals.outstanding)} tone="warning" icon={<AlertCircle className="h-4 w-4" />}
          hint={biz === "all" ? <BizSplitChip software={totals.swOut} hardware={totals.hwOut} formatter={fmtMoneyShort} /> : undefined}
        />
      </div>

      <DataPanel
        title="按供应商汇总"
        subtitle={`Payable by supplier · ${filtered.length} suppliers`}
        accent="cobalt"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input placeholder="搜索供应商" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-9 h-9 w-56 text-xs rounded-full" />
            </div>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="h-9 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">仅看未付</SelectItem>
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
                <th>供应商</th>
                <th>分类</th>
                <th className="num">订单数</th>
                <th className="num">合同金额{biz !== "all" && <span className="text-[10px] text-foreground/45 ml-1">({biz === "software" ? "软" : "硬"})</span>}</th>
                {biz === "all" && <th className="num">已收发票</th>}
                <th className="num">已付款</th>
                <th className="num">未付账款</th>
                <th className="num">最早下单</th>
                <th className="num">账龄(天)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr className="empty"><td colSpan={biz === "all" ? 9 : 8} className="empty">暂无应付数据</td></tr>
              )}
              {filtered.map((r) => {
                const days = aging(r.oldest);
                const v = view(r);
                const ageTone = days > 90 ? "text-tomato font-bold" : days > 30 ? "text-mustard" : "text-foreground/60";
                return (
                  <tr key={r.supplierId}>
                    <td className="font-semibold">{r.supplierName}</td>
                    <td className="text-xs text-foreground/65">{r.category || "—"}</td>
                    <td className="num text-foreground/70">{r.orderCount}</td>
                    <td className="num">
                      {fmtMoney(v.contract)}
                      {biz === "all" && (r.swContract > 0 && r.hwContract > 0) && (
                        <div className="text-[10px] text-foreground/45 mono">软{fmtMoneyShort(r.swContract)} · 硬{fmtMoneyShort(r.hwContract)}</div>
                      )}
                    </td>
                    {biz === "all" && <td className="num text-cobalt">{fmtMoney(r.invoiced)}</td>}
                    <td className="num text-mint">{fmtMoney(v.paid)}</td>
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
                  <td colSpan={3} className="label">合计 {filtered.length} 供应商</td>
                  <td className="num">{fmtMoney(totals.contract)}</td>
                  {biz === "all" && <td className="num text-cobalt">{fmtMoney(totals.invoiced)}</td>}
                  <td className="num text-mint">{fmtMoney(totals.paid)}</td>
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
