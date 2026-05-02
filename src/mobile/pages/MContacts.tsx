import { useState, useEffect } from "react";
import { contactApi, customerApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import type { Contact, Customer } from "@/types";
import { Phone, Star } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MConfirm, MRow } from "../components/MUI";

export default function MContacts() {
  const { current } = useCurrentUser();
  const { toast } = useToast();
  const { data, loading, setFilter, reload } = usePagedList<Contact>(contactApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [view, setView] = useState<Contact | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  useEffect(() => { customerApi.all().then(setCustomers); }, []);

  const onSearch = (v: string) => { setKeyword(v); setFilter({ keyword: v }); };
  const openCreate = () => setEditing({ ownerId: current.id, isPrimary: false, name: "", phone: "", customerId: "", customerName: "", code: "" }) || setEditOpen(true);
  const save = async () => {
    if (!editing?.name || !editing.customerId) return toast({ title: "请填写姓名和所属客户" });
    const cus = customers.find(c => c.id === editing.customerId);
    const payload = { ...editing, customerName: cus?.name ?? editing.customerName };
    if (editing.id) await contactApi.update(editing.id, payload);
    else await contactApi.create({ ...payload, createdAt: new Date().toISOString().slice(0, 10), code: `CON-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await contactApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };

  return (
    <div>
      <MPageHeader title="联系人" subtitle={`共 ${data.total} 位联系人`} />
      <MSearchBar value={keyword} onChange={onSearch} placeholder="姓名 / 客户 / 手机号" />
      <MList loading={loading && !data.list.length} empty={!loading && !data.list.length}>
        {data.list.map((c) => (
          <MCard key={c.id} onClick={() => setView(c)}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-cobalt/15 flex items-center justify-center text-cobalt font-bold shrink-0">{c.name.slice(0, 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{c.name}</span>
                  {c.isPrimary && <Star className="h-3 w-3 fill-mustard text-mustard" />}
                  {c.position && <span className="text-[11px] text-foreground/50 shrink-0">· {c.position}</span>}
                </div>
                <div className="text-[11px] text-foreground/55 truncate mt-0.5">{c.customerName}</div>
                <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{c.phone}</div>
              </div>
              <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="size-9 rounded-full bg-mint/20 flex items-center justify-center"><Phone className="h-4 w-4 text-foreground/75" /></a>
            </div>
          </MCard>
        ))}
      </MList>
      <MFab onClick={openCreate} />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title={view?.name ?? "联系人"}
        footer={view && (
          <div className="flex gap-2">
            <MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton>
            <MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton>
          </div>
        )}
      >
        {view && <div>
          <MRow label="编号" value={view.code} mono />
          <MRow label="客户" value={view.customerName} />
          <MRow label="职位" value={view.position} />
          <MRow label="手机" value={view.phone} mono />
          <MRow label="邮箱" value={view.email} />
          <MRow label="微信" value={(view as any).wechat} />
          <MRow label="生日" value={view.birthday} />
          <MRow label="主联系人" value={view.isPrimary ? "是" : "否"} />
          <MRow label="备注" value={view.remark} />
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑联系人" : "新建联系人"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="所属客户" required><MSelect value={editing.customerId ?? ""} onChange={(v) => setEditing({ ...editing, customerId: v })} options={[{ value: "", label: "请选择" }, ...customers.map(c => ({ value: c.id, label: c.name }))]} /></MField>
          <MField label="姓名" required><MInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></MField>
          <MField label="手机" required><MInput value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></MField>
          <MField label="职位"><MInput value={editing.position ?? ""} onChange={(e) => setEditing({ ...editing, position: e.target.value })} /></MField>
          <MField label="邮箱"><MInput value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></MField>
          <MField label="主联系人"><MSelect value={editing.isPrimary ? "1" : "0"} onChange={(v) => setEditing({ ...editing, isPrimary: v === "1" })} options={[{ value: "0", label: "否" }, { value: "1", label: "是" }]} /></MField>
          <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除联系人？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
