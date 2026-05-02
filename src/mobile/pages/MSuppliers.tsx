import { useState } from "react";
import { supplierApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@/types";
import { Truck, Phone } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MFab, MSheet, MField, MInput, MTextarea, MButton, MConfirm, MRow } from "../components/MUI";

export default function MSuppliers() {
  const { toast } = useToast();
  const { data, loading, setFilter, reload } = usePagedList<Supplier>(supplierApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null);
  const [view, setView] = useState<Supplier | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const openCreate = () => { setEditing({ name: "", contact: "", phone: "", category: "硬件", payable: 0, code: "" }); setEditOpen(true); };
  const save = async () => {
    if (!editing?.name) return toast({ title: "请填写名称" });
    if (editing.id) await supplierApi.update(editing.id, editing);
    else await supplierApi.create({ ...editing, createdAt: new Date().toISOString().slice(0, 10), code: `SUP-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await supplierApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };

  return (
    <div>
      <MPageHeader title="供应商" subtitle={`共 ${data.total} 家`} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="搜索供应商" />
      <MList loading={loading && !data.list.length} empty={!loading && !data.list.length}>
        {data.list.map((s) => (
          <MCard key={s.id} onClick={() => setView(s)}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-cobalt/15 flex items-center justify-center"><Truck className="h-5 w-5 text-cobalt" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{s.name}</div>
                <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{s.code} · {s.category}</div>
                <div className="text-[11px] text-foreground/55 mt-1">{s.contact} · {s.phone}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-foreground/45">应付</div>
                <div className="font-mono font-bold tabular-nums text-sm">¥{(s.payable / 10000).toFixed(1)}万</div>
              </div>
            </div>
          </MCard>
        ))}
      </MList>
      <MFab onClick={openCreate} />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title={view?.name ?? "供应商"}
        footer={view && (<div className="flex gap-2"><MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton><MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton></div>)}
      >
        {view && <div>
          <MRow label="编号" value={view.code} mono />
          <MRow label="类别" value={view.category} />
          <MRow label="联系人" value={view.contact} />
          <MRow label="电话" value={view.phone} mono />
          <MRow label="税号" value={view.taxNo} mono />
          <MRow label="地址" value={view.address} />
          <MRow label="开户行" value={view.bankName} />
          <MRow label="账号" value={view.bankAccountNo} mono />
          <MRow label="应付" value={`¥${view.payable.toLocaleString()}`} mono />
          <MRow label="备注" value={view.remark} />
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑供应商" : "新建供应商"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="名称" required><MInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></MField>
          <MField label="类别"><MInput value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></MField>
          <MField label="联系人"><MInput value={editing.contact ?? ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></MField>
          <MField label="电话"><MInput value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></MField>
          <MField label="税号"><MInput value={editing.taxNo ?? ""} onChange={(e) => setEditing({ ...editing, taxNo: e.target.value })} /></MField>
          <MField label="地址"><MInput value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></MField>
          <MField label="开户行"><MInput value={editing.bankName ?? ""} onChange={(e) => setEditing({ ...editing, bankName: e.target.value })} /></MField>
          <MField label="账号"><MInput value={editing.bankAccountNo ?? ""} onChange={(e) => setEditing({ ...editing, bankAccountNo: e.target.value })} /></MField>
          <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除供应商？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
