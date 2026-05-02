// 客户跟进（移动端）— 1:1 复刻 PC FollowUps
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MButton, MConfirm, MGroupTitle, MFilterBar,
} from "../components/MUI";
import { followUpApi, customerApi, contactApi, employeeApi } from "@/services/api";
import { fmtMoney, customerStatusLabel } from "@/lib/format";
import type { FollowUp, Customer, Contact, Employee } from "@/types";

const empty: Omit<FollowUp, "id"> = {
  code: "", customerId: "", customerName: "", customerStatus: "",
  contactId: "", contactName: "", ownerId: "u3",
  subject: "", content: "", contactWay: "电话", salesLead: "", oppStatus: "意向初探",
  contactDate: new Date().toISOString().slice(0, 10), nextVisitAt: "",
  intentProduct: "", expectedAmount: 0, expectedSignAt: "",
  attachment: "", remark: "",
  createdAt: new Date().toISOString().slice(0, 10),
};

const WAYS = ["电话", "拜访", "微信", "邮件", "短信", "其他"];
const OPPS = ["意向初探", "需求确认", "方案沟通", "报价中", "商务谈判", "已签约", "已流失"];
const oppTone: Record<string, any> = { "意向初探": "muted", "需求确认": "cobalt", "方案沟通": "cobalt", "报价中": "mustard", "商务谈判": "mustard", "已签约": "mint", "已流失": "tomato" };

export default function MFollowUps() {
  const [sp, setSp] = useSearchParams();
  const customerId = sp.get("customerId") || "all";
  const [list, setList] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contactsForCust, setContactsForCust] = useState<Contact[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [wayF, setWayF] = useState("all");
  const [oppF, setOppF] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [form, setForm] = useState<Omit<FollowUp, "id">>(empty);
  const [delId, setDelId] = useState<string | null>(null);

  const reload = async () => {
    const r = await followUpApi.list({ customerId, pageSize: 1000 });
    setList(r.list);
  };
  useEffect(() => {
    reload();
    customerApi.all().then(setCustomers);
    employeeApi.all().then(setEmployees);
  }, [customerId]);

  useEffect(() => {
    if (!form.customerId) { setContactsForCust([]); return; }
    contactApi.list({ customerId: form.customerId, pageSize: 100 }).then(r => setContactsForCust(r.list));
  }, [form.customerId]);

  const filtered = list.filter(f => {
    if (wayF !== "all" && f.contactWay !== wayF) return false;
    if (oppF !== "all" && f.oppStatus !== oppF) return false;
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    return f.subject.toLowerCase().includes(k) || f.customerName.toLowerCase().includes(k) || (f.content || "").toLowerCase().includes(k);
  });

  const openCreate = () => {
    const cid = customerId !== "all" ? customerId : "";
    const c = customers.find(x => x.id === cid);
    setForm({ ...empty, code: `GJ-${Date.now().toString().slice(-6)}`, customerId: cid, customerName: c?.name ?? "", customerStatus: c?.status ?? "", ownerId: c?.ownerId ?? "u3" });
    setEditing(null); setOpen(true);
  };
  const openEdit = (f: FollowUp) => { setForm({ ...empty, ...f }); setEditing(f); setOpen(true); };

  const submit = async () => {
    if (!form.customerId) return toast.error("请选择客户");
    if (!form.subject.trim() || !form.content.trim()) return toast.error("主题/内容必填");
    const c = customers.find(x => x.id === form.customerId);
    const ct = contactsForCust.find(x => x.id === form.contactId);
    const payload = { ...form, customerName: c?.name ?? form.customerName, customerStatus: c?.status ?? form.customerStatus, contactName: ct?.name ?? "" };
    if (editing) { await followUpApi.update(editing.id, payload); toast.success("已更新"); }
    else { await followUpApi.create(payload); toast.success("已创建"); }
    setOpen(false); reload();
  };

  const onDelete = async () => { if (!delId) return; await followUpApi.remove(delId); toast.success("已删除"); setDelId(null); reload(); };

  return (
    <>
      <MPageHeader title="跟进记录" subtitle={`共 ${filtered.length} 条 · 预计 ${fmtMoney(filtered.reduce((s, f) => s + (f.expectedAmount || 0), 0))}`}
        action={customerId !== "all" ? <button onClick={() => setSp({})} className="text-[11px] px-3 h-8 rounded-full bg-foreground/[0.06]">全部</button> : undefined} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索主题/客户/内容" />
      <MFilterBar onReset={() => { setWayF("all"); setOppF("all"); }}>
        <select value={wayF} onChange={e => setWayF(e.target.value)} className="shrink-0 h-8 px-3 rounded-full bg-card border border-foreground/10 text-xs">
          <option value="all">全部形式</option>
          {WAYS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
        <select value={oppF} onChange={e => setOppF(e.target.value)} className="shrink-0 h-8 px-3 rounded-full bg-card border border-foreground/10 text-xs">
          <option value="all">全部商机</option>
          {OPPS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </MFilterBar>

      <MList empty={filtered.length === 0}>
        {filtered.map(f => (
          <MCard key={f.id} onClick={() => openEdit(f)}>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <MTag variant="muted">{f.contactWay}</MTag>
              {f.oppStatus && <MTag variant={oppTone[f.oppStatus]}>{f.oppStatus}</MTag>}
              <span className="font-bold text-[14px] truncate">{f.subject}</span>
            </div>
            <div className="text-[12px] text-foreground/65 line-clamp-2">{f.content}</div>
            <div className="text-[11px] text-foreground/50 mt-1.5 flex justify-between items-center font-mono">
              <span>{f.customerName} · {f.contactName || "—"}</span>
              <span>{f.contactDate}</span>
            </div>
            {f.expectedAmount > 0 && <div className="text-[12px] text-mint font-mono font-bold mt-1">预计 {fmtMoney(f.expectedAmount)}</div>}
          </MCard>
        ))}
      </MList>

      <MFab onClick={openCreate} />

      <MSheet open={open} onOpenChange={setOpen} size="full" title={editing ? "编辑跟进" : "新增跟进"}
        footer={<div className="flex gap-2">
          {editing && <MButton variant="danger" onClick={() => { setDelId(editing.id); setOpen(false); }}><Trash2 className="h-3.5 w-3.5" /></MButton>}
          <MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton>
          <MButton onClick={submit} className="flex-1">{editing ? "保存" : "创建"}</MButton>
        </div>}>
        <MGroupTitle>基本信息</MGroupTitle>
        <MField label="客户" required>
          <MSelect value={form.customerId} onChange={v => { const c = customers.find(x => x.id === v); setForm({ ...form, customerId: v, customerName: c?.name ?? "", customerStatus: c?.status ?? "", contactId: "", contactName: "" }); }}
            options={customers.map(c => ({ value: c.id, label: c.name }))} placeholder="请选择客户" />
        </MField>
        <MField label="客户状态"><MInput value={customerStatusLabel[form.customerStatus || ""] || form.customerStatus || ""} disabled /></MField>
        <MField label="联系人">
          <MSelect value={form.contactId || ""} onChange={v => setForm({ ...form, contactId: v })}
            options={contactsForCust.map(c => ({ value: c.id, label: `${c.name}（${c.position || "联系人"}）` }))}
            placeholder={contactsForCust.length ? "请选择" : "请先选择客户"} />
        </MField>
        <MField label="负责人">
          <MSelect value={form.ownerId} onChange={v => setForm({ ...form, ownerId: v })}
            options={employees.map(e => ({ value: e.id, label: `${e.name}（${e.role}）` }))} />
        </MField>
        <MField label="主题" required><MInput value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></MField>

        <MGroupTitle>跟进内容</MGroupTitle>
        <MField label="跟进记录" required><MTextarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="min-h-[120px]" /></MField>
        <MField label="联系形式" required>
          <MSelect value={form.contactWay} onChange={v => setForm({ ...form, contactWay: v as any })} options={WAYS.map(w => ({ value: w, label: w }))} />
        </MField>
        <MField label="销售线索"><MInput value={form.salesLead || ""} onChange={e => setForm({ ...form, salesLead: e.target.value })} /></MField>
        <MField label="商机状态">
          <MSelect value={form.oppStatus || ""} onChange={v => setForm({ ...form, oppStatus: v })} options={OPPS.map(o => ({ value: o, label: o }))} />
        </MField>
        <MField label="联系日期" required><MInput type="date" value={form.contactDate} onChange={e => setForm({ ...form, contactDate: e.target.value })} /></MField>
        <MField label="下次回访"><MInput type="date" value={form.nextVisitAt || ""} onChange={e => setForm({ ...form, nextVisitAt: e.target.value })} /></MField>
        <MField label="意向产品"><MInput value={form.intentProduct || ""} onChange={e => setForm({ ...form, intentProduct: e.target.value })} /></MField>
        <MField label="预计金额（元）"><MInput type="number" value={form.expectedAmount || 0} onChange={e => setForm({ ...form, expectedAmount: Number(e.target.value) })} /></MField>
        <MField label="预计签单"><MInput type="date" value={form.expectedSignAt || ""} onChange={e => setForm({ ...form, expectedSignAt: e.target.value })} /></MField>

        <MGroupTitle>其他</MGroupTitle>
        <MField label="编号"><MInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></MField>
        <MField label="备注"><MTextarea value={form.remark || ""} onChange={e => setForm({ ...form, remark: e.target.value })} /></MField>
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除跟进" onConfirm={onDelete} danger confirmText="删除" />
    </>
  );
}
