// 客户管理（移动端）— 1:1 复刻 PC 端 Customers
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Star, Download, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MSwitch, MButton, MRow, MConfirm, MGroupTitle, MAccordion, MChipFilter, MFilterBar,
  MBulkBar, MIconBtn,
} from "../components/MUI";
import { customerApi, contactApi, followUpApi, employeeApi, salesApi } from "@/services/api";
import { CustomerStats } from "@/components/common/CustomerStats";
import { exportCsv } from "@/lib/csv";
import { fmtMoney, customerStatusLabel, customerStatusTone, deriveCustomerStage } from "@/lib/format";
import type { Customer, Contact, FollowUp, Employee, SalesOrder } from "@/types";

const empty: Omit<Customer, "id"> = {
  code: "", name: "", taxNo: "", status: "potential", region: "", stage: "lead", level: "B",
  contact: "", phone: "", email: "",
  registeredAddress: "", businessScope: "", address: "",
  legalPerson: "", companyNature: "民营", industry: "",
  registeredAt: "", registeredCapital: 0, paidInCapital: 0,
  scale: "", insuredCount: 0, firstCooperationAt: "", cooperationProducts: "",
  ownerId: "u3", category: "潜在客户", source: "电话开发", seaStatus: "私海",
  lastVisitAt: "", nextVisitAt: "", invoiceInfo: "", introducer: "",
  createdAt: new Date().toISOString().slice(0, 10), remark: "",
};

const SEA = [
  { value: "all", label: "全部" },
  { value: "私海", label: "私海" },
  { value: "公海", label: "公海" },
] as const;

export default function MCustomers() {
  const nav = useNavigate();
  const [list, setList] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allSales, setAllSales] = useState<SalesOrder[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sea, setSea] = useState<"all" | "私海" | "公海">("all");
  const [statusF, setStatusF] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, "id">>(empty);
  const [contactsCt, setContactsCt] = useState<Contact[]>([]);
  const [followUpsCt, setFollowUpsCt] = useState<FollowUp[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("active");
  const [searchParams] = useSearchParams();

  const reload = async () => setList(await customerApi.all());
  useEffect(() => {
    reload();
    employeeApi.all().then(setEmployees);
    salesApi.all().then(setAllSales);
  }, []);
  useEffect(() => { if (searchParams.get("createNew") === "1") openCreate(); }, []);

  const recvByCust = useMemo(() => {
    const m = new Map<string, number>();
    allSales.filter(o => o.status !== "cancelled").forEach(o => {
      const r = Math.max((o.contractAmount ?? o.totalAmount) - (o.received || 0), 0);
      m.set(o.customerId, (m.get(o.customerId) || 0) + r);
    });
    return m;
  }, [allSales]);

  const filtered = list.filter(c => {
    if (sea !== "all" && c.seaStatus !== sea) return false;
    if (statusF !== "all" && c.status !== statusF) return false;
    if (keyword) {
      const k = keyword.toLowerCase();
      if (!c.name.toLowerCase().includes(k) && !c.code.toLowerCase().includes(k) && !(c.contact || "").toLowerCase().includes(k)) return false;
    }
    return true;
  });

  const ownerName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";

  const openCreate = () => {
    setForm({ ...empty, code: `CUS-${Date.now().toString().slice(-6)}` });
    setEditing(null); setContactsCt([]); setFollowUpsCt([]); setOpen(true);
  };
  const openEdit = async (c: Customer) => {
    setForm({ ...empty, ...c }); setEditing(c); setOpen(true);
    const [ct, fu] = await Promise.all([
      contactApi.list({ customerId: c.id, pageSize: 100 }),
      followUpApi.list({ customerId: c.id, pageSize: 100 }),
    ]);
    setContactsCt(ct.list); setFollowUpsCt(fu.list);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("请输入客户全称");
    const v = { ...form, stage: deriveCustomerStage(form.status) } as any;
    if (editing) { await customerApi.update(editing.id, v); toast.success("已更新"); }
    else { await customerApi.create(v); toast.success("已创建"); }
    setOpen(false); reload();
  };

  const onDelete = async () => {
    if (!delId) return;
    const linked = allSales.filter(o => o.customerId === delId).length;
    if (linked > 0) { toast.error(`存在 ${linked} 笔订单，无法删除`); setDelId(null); return; }
    await customerApi.remove(delId); toast.success("已删除"); setDelId(null); reload();
  };

  const exportAll = async () => {
    const all = await customerApi.all();
    exportCsv("customers", all, [
      { header: "编号", value: c => c.code },
      { header: "客户名称", value: c => c.name },
      { header: "状态", value: c => customerStatusLabel[c.status || "potential"] || "—" },
      { header: "区域", value: c => c.region || "" },
      { header: "联系人", value: c => c.contact },
      { header: "电话", value: c => c.phone },
      { header: "应收", value: c => recvByCust.get(c.id) || 0 },
    ]);
  };

  const bulkSea = async (v: "公海" | "私海") => {
    await Promise.all(selected.map(id => customerApi.update(id, { seaStatus: v } as any)));
    toast.success(`已转${v} ${selected.length} 位`); setSelected([]); reload();
  };
  const bulkStatus = async () => {
    await Promise.all(selected.map(id => customerApi.update(id, { status: bulkStatusValue as any, stage: deriveCustomerStage(bulkStatusValue) } as any)));
    toast.success(`已将 ${selected.length} 位客户状态改为「${(customerStatusLabel as any)[bulkStatusValue] || bulkStatusValue}」`);
    setBulkStatusOpen(false); setSelected([]); reload();
  };

  return (
    <>
      <MPageHeader
        title="客户管理"
        subtitle={`共 ${filtered.length} 位 · 应收合计 ${fmtMoney(filtered.reduce((s, c) => s + (recvByCust.get(c.id) || 0), 0))}`}
        action={<button onClick={exportAll} className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center"><Download className="h-4 w-4" /></button>}
      />
      <CustomerStats
        list={list}
        activeStatus={statusF}
        activeSea={sea}
        onStatusClick={(s) => setStatusF(s)}
        onSeaClick={(s) => setSea(s as any)}
        variant="mobile"
      />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索名称 / 编号 / 联系人" />

      <MList empty={filtered.length === 0}>
        {filtered.map(c => {
          const tone = customerStatusTone[c.status || "potential"] || "muted";
          const recv = recvByCust.get(c.id) || 0;
          return (
            <MCard key={c.id} onClick={() => openEdit(c)}
              selected={selected.includes(c.id)}
              onSelectChange={s => setSelected(p => s ? [...p, c.id] : p.filter(x => x !== c.id))}>
              <div className="flex items-start gap-3 pr-7">
                <div className="size-10 rounded-full bg-foreground/10 text-foreground flex items-center justify-center font-display font-black shrink-0">{c.name.slice(0, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[14px] truncate">{c.name}</span>
                    <MTag variant={tone as any}>{customerStatusLabel[c.status || "potential"]}</MTag>
                    {c.seaStatus === "公海" && <MTag variant="cobalt">公海</MTag>}
                  </div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{c.code} · {c.region || "—"} · {ownerName(c.ownerId)}</div>
                  <div className="text-[12px] text-foreground/70 mt-1.5 truncate">{c.contact || "—"} · {c.phone || "—"}</div>
                  {recv > 0 && <div className="text-[12px] mt-1 font-mono text-tomato font-bold">应收 {fmtMoney(recv)}</div>}
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>

      <MFab onClick={openCreate} />
      <MBulkBar count={selected.length} onCancel={() => setSelected([])}>
        <MIconBtn icon={<span className="text-[10px] font-bold px-1">公海</span>} onClick={() => bulkSea("公海")} />
        <MIconBtn icon={<span className="text-[10px] font-bold px-1">私海</span>} onClick={() => bulkSea("私海")} />
        <MIconBtn icon={<span className="text-[10px] font-bold px-1">状态</span>} onClick={() => setBulkStatusOpen(true)} />
      </MBulkBar>

      <MSheet open={open} onOpenChange={setOpen} size="full" title={editing ? "编辑客户" : "新增客户"}
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton><MButton onClick={submit} className="flex-1">{editing ? "保存修改" : "创建客户"}</MButton></div>}>
        <MGroupTitle>基础信息</MGroupTitle>
        <MField label="客户全称" required><MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></MField>
        <MField label="客户编号" required><MInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></MField>
        <MField label="税号"><MInput value={form.taxNo || ""} onChange={e => setForm({ ...form, taxNo: e.target.value })} /></MField>
        <MField label="客户状态">
          <MSelect value={form.status || ""} onChange={v => setForm({ ...form, status: v as any })}
            options={Object.entries(customerStatusLabel).map(([value, label]) => ({ value, label }))} />
        </MField>
        <MField label="归属区域"><MInput value={form.region || ""} onChange={e => setForm({ ...form, region: e.target.value })} /></MField>

        <MGroupTitle>工商信息</MGroupTitle>
        <MField label="法定代表人"><MInput value={form.legalPerson || ""} onChange={e => setForm({ ...form, legalPerson: e.target.value })} /></MField>
        <MField label="公司性质">
          <MSelect value={form.companyNature || ""} onChange={v => setForm({ ...form, companyNature: v as any })}
            options={["国企","民营","外资","合资","上市公司","事业单位","其他"].map(n => ({ value: n, label: n }))} />
        </MField>
        <MField label="所属行业">
          <MSelect value={form.industry || ""} onChange={v => setForm({ ...form, industry: v })}
            options={["制造业","能源","物流","金融","教育","医疗","政府","电力"].map(n => ({ value: n, label: n }))} placeholder="请选择" />
        </MField>
        <MField label="注册时间"><MInput type="date" value={form.registeredAt || ""} onChange={e => setForm({ ...form, registeredAt: e.target.value })} /></MField>
        <MField label="注册资金（万元）"><MInput type="number" value={form.registeredCapital || 0} onChange={e => setForm({ ...form, registeredCapital: Number(e.target.value) })} /></MField>
        <MField label="实缴资金（万元）"><MInput type="number" value={form.paidInCapital || 0} onChange={e => setForm({ ...form, paidInCapital: Number(e.target.value) })} /></MField>
        <MField label="客户规模"><MInput value={form.scale || ""} onChange={e => setForm({ ...form, scale: e.target.value })} /></MField>
        <MField label="参保人数"><MInput type="number" value={form.insuredCount || 0} onChange={e => setForm({ ...form, insuredCount: Number(e.target.value) })} /></MField>
        <MField label="注册地址"><MInput value={form.registeredAddress || ""} onChange={e => setForm({ ...form, registeredAddress: e.target.value })} /></MField>
        <MField label="通讯地址"><MInput value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></MField>
        <MField label="经营范围"><MTextarea value={form.businessScope || ""} onChange={e => setForm({ ...form, businessScope: e.target.value })} /></MField>

        <MGroupTitle>合作信息</MGroupTitle>
        <MField label="首次合作时间"><MInput type="date" value={form.firstCooperationAt || ""} onChange={e => setForm({ ...form, firstCooperationAt: e.target.value })} /></MField>
        <MField label="合作产品/服务"><MInput value={form.cooperationProducts || ""} onChange={e => setForm({ ...form, cooperationProducts: e.target.value })} /></MField>
        <MField label="销售负责人">
          <MSelect value={form.ownerId} onChange={v => setForm({ ...form, ownerId: v })}
            options={employees.map(e => ({ value: e.id, label: `${e.name}（${e.role}）` }))} />
        </MField>

        <MGroupTitle>客户管理</MGroupTitle>
        <MField label="客户类别">
          <MSelect value={form.category || ""} onChange={v => setForm({ ...form, category: v as any })}
            options={["战略客户","重点客户","普通客户","潜在客户"].map(n => ({ value: n, label: n }))} />
        </MField>
        <MField label="客户来源">
          <MSelect value={form.source || ""} onChange={v => setForm({ ...form, source: v as any })}
            options={["电话开发","网络推广","客户介绍","展会","陌拜","其他"].map(n => ({ value: n, label: n }))} />
        </MField>
        <MField label="公海状态">
          <MSelect value={form.seaStatus || "私海"} onChange={v => setForm({ ...form, seaStatus: v as any })}
            options={[{ value: "私海", label: "私海" }, { value: "公海", label: "公海" }]} />
        </MField>
        <MField label="客户等级">
          <MSelect value={form.level} onChange={v => setForm({ ...form, level: v as any })}
            options={[{ value: "A", label: "A 重点" }, { value: "B", label: "B 普通" }, { value: "C", label: "C 一般" }]} />
        </MField>
        <MField label="最近拜访"><MInput type="date" value={form.lastVisitAt || ""} onChange={e => setForm({ ...form, lastVisitAt: e.target.value })} /></MField>
        <MField label="下次拜访"><MInput type="date" value={form.nextVisitAt || ""} onChange={e => setForm({ ...form, nextVisitAt: e.target.value })} /></MField>

        <MGroupTitle>其他信息</MGroupTitle>
        <MField label="开票信息"><MInput value={form.invoiceInfo || ""} onChange={e => setForm({ ...form, invoiceInfo: e.target.value })} /></MField>
        <MField label="介绍人"><MInput value={form.introducer || ""} onChange={e => setForm({ ...form, introducer: e.target.value })} /></MField>
        <MField label="备注"><MTextarea value={form.remark || ""} onChange={e => setForm({ ...form, remark: e.target.value })} /></MField>

        {editing && (
          <>
            <MAccordion title="联系人" badge={<MTag variant="cobalt">{contactsCt.length}</MTag>} defaultOpen>
              {contactsCt.length === 0 ? <div className="text-center py-4 text-[12px] text-foreground/40">暂无联系人</div> :
                <div className="space-y-1.5">
                  {contactsCt.map(ct => (
                    <div key={ct.id} className="flex items-center justify-between p-2 rounded-lg bg-foreground/[0.03]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-semibold text-[13px]">{ct.name}{ct.isPrimary && <Star className="h-3 w-3 fill-tomato text-tomato" />}</div>
                        <div className="text-[11px] text-foreground/55 font-mono">{ct.phone} · {ct.position || "—"}</div>
                      </div>
                      <a href={`tel:${ct.phone}`} className="size-7 rounded-full bg-mint/30 flex items-center justify-center"><Phone className="h-3 w-3" /></a>
                    </div>
                  ))}
                </div>
              }
              <button onClick={() => { setOpen(false); nav(`/m/contacts?customerId=${editing.id}`); }} className="w-full mt-2 h-8 rounded-full bg-foreground/[0.05] text-[11px] font-semibold">前往联系人页 →</button>
            </MAccordion>
            <MAccordion title="跟进记录" badge={<MTag variant="mustard">{followUpsCt.length}</MTag>}>
              {followUpsCt.length === 0 ? <div className="text-center py-4 text-[12px] text-foreground/40">暂无跟进</div> :
                <div className="space-y-1.5">
                  {followUpsCt.slice(0, 5).map(f => (
                    <div key={f.id} className="p-2 rounded-lg bg-foreground/[0.03]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MTag variant="muted">{f.contactWay}</MTag>
                        <span className="font-semibold text-[12px] truncate">{f.subject}</span>
                      </div>
                      <div className="text-[11px] text-foreground/55 mt-1 line-clamp-2">{f.content}</div>
                      <div className="text-[10px] text-foreground/40 mt-1 font-mono">{f.contactDate}{f.expectedAmount ? ` · 预计 ${fmtMoney(f.expectedAmount)}` : ""}</div>
                    </div>
                  ))}
                </div>
              }
              <button onClick={() => { setOpen(false); nav(`/m/follow-ups?customerId=${editing.id}`); }} className="w-full mt-2 h-8 rounded-full bg-foreground/[0.05] text-[11px] font-semibold">前往跟进页 →</button>
            </MAccordion>
            <div className="mt-3"><MButton variant="danger" onClick={() => { setDelId(editing.id); setOpen(false); }} className="w-full"><Trash2 className="h-3.5 w-3.5" />删除该客户</MButton></div>
          </>
        )}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除客户" description="删除后无法恢复" onConfirm={onDelete} danger confirmText="删除" />
      <MSheet open={bulkStatusOpen} onOpenChange={setBulkStatusOpen} title={`批量改客户状态 (${selected.length} 位)`}
        footer={<MButton onClick={bulkStatus} className="w-full">确认应用</MButton>}
      >
        <MField label="目标状态"><MSelect value={bulkStatusValue} onChange={setBulkStatusValue} options={Object.entries(customerStatusLabel).map(([value, label]) => ({ value, label }))} /></MField>
      </MSheet>
    </>
  );
}
