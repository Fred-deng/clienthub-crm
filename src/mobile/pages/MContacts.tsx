// 联系人管理（移动端）— 1:1 复刻 PC Contacts
import { useEffect, useState } from "react";
import { Star, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MSwitch, MButton, MConfirm, MGroupTitle, MFilterBar, MPickerChip,
} from "../components/MUI";
import { contactApi, customerApi, employeeApi } from "@/services/api";
import type { Contact, Customer, Employee } from "@/types";

const empty: Omit<Contact, "id"> = {
  code: "", customerId: "", customerName: "", name: "", phone: "",
  position: "", email: "", address: "", birthday: "",
  ownerId: "u3", isPrimary: false, remark: "", attachment: "",
  createdAt: new Date().toISOString().slice(0, 10),
};

export default function MContacts() {
  const [sp, setSp] = useSearchParams();
  const customerId = sp.get("customerId") || "all";
  const [list, setList] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<Omit<Contact, "id">>(empty);
  const [delId, setDelId] = useState<string | null>(null);

  const reload = async () => {
    const r = await contactApi.list({ customerId, pageSize: 1000 });
    setList(r.list);
  };
  useEffect(() => {
    reload();
    customerApi.all().then(setCustomers);
    employeeApi.all().then(setEmployees);
  }, [customerId]);

  const filtered = list.filter(c => {
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    return c.name.toLowerCase().includes(k) || c.phone.includes(k) || (c.customerName || "").toLowerCase().includes(k);
  });

  const openCreate = () => {
    const cid = customerId !== "all" ? customerId : "";
    const c = customers.find(x => x.id === cid);
    setForm({ ...empty, code: `LXR-${Date.now().toString().slice(-6)}`, customerId: cid, customerName: c?.name ?? "", ownerId: c?.ownerId ?? "u3" });
    setEditing(null); setOpen(true);
  };
  const openEdit = (c: Contact) => { setForm({ ...empty, ...c }); setEditing(c); setOpen(true); };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) return toast.error("姓名/手机必填");
    if (!form.customerId) return toast.error("请选择客户");
    const cust = customers.find(x => x.id === form.customerId);
    const payload = { ...form, customerName: cust?.name ?? form.customerName };
    if (editing) { await contactApi.update(editing.id, payload); toast.success("已更新"); }
    else { await contactApi.create(payload); toast.success("已创建"); }
    setOpen(false); reload();
  };

  const onDelete = async () => {
    if (!delId) return;
    await contactApi.remove(delId); toast.success("已删除"); setDelId(null); reload();
  };

  const ownerName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";
  const currCust = customers.find(c => c.id === customerId);

  return (
    <>
      <MPageHeader title="联系人" subtitle={currCust ? `当前客户：${currCust.name}` : `共 ${filtered.length} 位`}
        action={customerId !== "all" ? <button onClick={() => setSp({})} className="text-[11px] px-3 h-8 rounded-full bg-foreground/[0.06]">查看全部</button> : undefined} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索姓名/手机/客户" />
      <MFilterBar onReset={() => { setSp({}); setKeyword(""); }}>
        <MPickerChip value={customerId} onChange={v => { if (v === "all") setSp({}); else setSp({ customerId: v }); }}
          options={customers.map(c => ({ value: c.id, label: c.name, sub: c.code }))}
          allLabel="全部客户" title="选择客户" />
      </MFilterBar>

      <MList empty={filtered.length === 0}>
        {filtered.map(c => (
          <MCard key={c.id} onClick={() => openEdit(c)}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-mustard/30 text-foreground flex items-center justify-center font-display font-black shrink-0">{c.name.slice(0, 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[14px] truncate">{c.name}</span>
                  {c.isPrimary && <Star className="h-3.5 w-3.5 fill-tomato text-tomato" />}
                  <MTag variant="muted">{c.position || "联系人"}</MTag>
                </div>
                <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{c.code}</div>
                <div className="text-[12px] text-foreground/70 mt-1 truncate">{c.customerName}</div>
                <div className="text-[12px] text-foreground/70 mt-0.5 font-mono">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="size-8 rounded-full bg-mint/30 flex items-center justify-center"><Phone className="h-3.5 w-3.5" /></a>
                {c.email && <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="size-8 rounded-full bg-cobalt/15 text-cobalt flex items-center justify-center"><Mail className="h-3.5 w-3.5" /></a>}
              </div>
            </div>
          </MCard>
        ))}
      </MList>

      <MFab onClick={openCreate} />

      <MSheet open={open} onOpenChange={setOpen} size="full" title={editing ? "编辑联系人" : "新增联系人"}
        footer={<div className="flex gap-2">
          {editing && <MButton variant="danger" onClick={() => { setDelId(editing.id); setOpen(false); }}><Trash2 className="h-3.5 w-3.5" /></MButton>}
          <MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton>
          <MButton onClick={submit} className="flex-1">{editing ? "保存" : "创建"}</MButton>
        </div>}>
        <MGroupTitle>基础信息</MGroupTitle>
        <MField label="所属客户" required>
          <MSelect value={form.customerId} onChange={v => { const c = customers.find(x => x.id === v); setForm({ ...form, customerId: v, customerName: c?.name ?? "" }); }}
            options={customers.map(c => ({ value: c.id, label: c.name }))} placeholder="选择客户" />
        </MField>
        <MField label="销售负责人">
          <MSelect value={form.ownerId} onChange={v => setForm({ ...form, ownerId: v })}
            options={employees.map(e => ({ value: e.id, label: `${e.name}（${e.role}）` }))} />
        </MField>
        <MGroupTitle>联系信息</MGroupTitle>
        <MField label="姓名" required><MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></MField>
        <MField label="手机号" required><MInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></MField>
        <MField label="职位"><MInput value={form.position || ""} onChange={e => setForm({ ...form, position: e.target.value })} /></MField>
        <MField label="邮箱"><MInput value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></MField>
        <MField label="地址"><MInput value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></MField>
        <MField label="生日"><MInput type="date" value={form.birthday || ""} onChange={e => setForm({ ...form, birthday: e.target.value })} /></MField>
        <MField label="首要联系人"><MSwitch checked={!!form.isPrimary} onChange={v => setForm({ ...form, isPrimary: v })} label="设为该客户首要联系人" /></MField>
        <MGroupTitle>其他</MGroupTitle>
        <MField label="联系人编号"><MInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></MField>
        <MField label="备注"><MTextarea value={form.remark || ""} onChange={e => setForm({ ...form, remark: e.target.value })} /></MField>
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除联系人" onConfirm={onDelete} danger confirmText="删除" />
    </>
  );
}
