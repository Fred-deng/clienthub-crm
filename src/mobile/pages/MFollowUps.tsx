import { useState, useEffect } from "react";
import { followUpApi, customerApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import type { FollowUp, Customer } from "@/types";
import { CalendarDays, Phone } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MConfirm, MRow } from "../components/MUI";

const WAYS = ["电话", "拜访", "微信", "邮件", "短信", "其他"] as const;
const OPP = ["意向初探", "需求确认", "方案沟通", "报价中", "商务谈判", "已签约", "已流失"] as const;
const WAY_OPTS = [{ value: "all", label: "全部" }, ...WAYS.map(w => ({ value: w, label: w }))];

export default function MFollowUps() {
  const { current } = useCurrentUser();
  const { toast } = useToast();
  const { data, loading, setFilter, reload } = usePagedList<FollowUp>(followUpApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState(""); const [way, setWay] = useState("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<FollowUp> | null>(null);
  const [view, setView] = useState<FollowUp | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  useEffect(() => { customerApi.all().then(setCustomers); }, []);

  const openCreate = () => { setEditing({ ownerId: current.id, contactWay: "电话", contactDate: new Date().toISOString().slice(0, 10), subject: "", content: "" }); setEditOpen(true); };
  const save = async () => {
    if (!editing?.subject || !editing.customerId) return toast({ title: "请填写主题与客户" });
    const cus = customers.find(c => c.id === editing.customerId);
    const payload = { ...editing, customerName: cus?.name ?? "" };
    if (editing.id) await followUpApi.update(editing.id, payload);
    else await followUpApi.create({ ...payload, createdAt: new Date().toISOString().slice(0, 10), code: `FU-${Date.now().toString().slice(-6)}` } as any);
    toast({ title: "已保存" }); setEditOpen(false); reload();
  };
  const doDelete = async () => { if (!delId) return; await followUpApi.remove(delId); setDelId(null); setView(null); toast({ title: "已删除" }); reload(); };

  return (
    <div>
      <MPageHeader title="跟进记录" subtitle={`共 ${data.total} 条`} />
      <MSearchBar value={keyword} onChange={(v) => { setKeyword(v); setFilter({ keyword: v }); }} placeholder="搜索客户/主题/内容" />
      <MChipFilter value={way} onChange={(v) => { setWay(v); setFilter({ contactWay: v }); }} options={WAY_OPTS} />
      <MList loading={loading && !data.list.length} empty={!loading && !data.list.length}>
        {data.list.map((f) => (
          <MCard key={f.id} onClick={() => setView(f)}>
            <div className="flex items-center gap-2 mb-1.5">
              <MTag variant="cobalt">{f.contactWay}</MTag>
              {f.oppStatus && <MTag variant="mustard">{f.oppStatus}</MTag>}
              <span className="text-[11px] text-foreground/45 ml-auto">{f.contactDate}</span>
            </div>
            <div className="font-semibold text-sm truncate">{f.subject}</div>
            <div className="text-[11px] text-foreground/55 truncate mt-0.5">{f.customerName}{f.contactName ? ` · ${f.contactName}` : ""}</div>
            <div className="text-[12px] text-foreground/70 mt-1.5 line-clamp-2">{f.content}</div>
          </MCard>
        ))}
      </MList>
      <MFab onClick={openCreate} />

      <MSheet open={!!view} onOpenChange={(o) => !o && setView(null)} title="跟进详情"
        footer={view && (<div className="flex gap-2"><MButton variant="outline" className="flex-1" onClick={() => setDelId(view.id)}>删除</MButton><MButton className="flex-1" onClick={() => { setEditing(view); setEditOpen(true); setView(null); }}>编辑</MButton></div>)}
      >
        {view && <div>
          <MRow label="编号" value={view.code} mono />
          <MRow label="客户" value={view.customerName} />
          <MRow label="联系人" value={view.contactName} />
          <MRow label="主题" value={view.subject} />
          <MRow label="联系方式" value={view.contactWay} />
          <MRow label="商机状态" value={view.oppStatus} />
          <MRow label="联系日期" value={view.contactDate} />
          <MRow label="下次回访" value={view.nextVisitAt} />
          <MRow label="意向产品" value={view.intentProduct} />
          <MRow label="预计金额" value={view.expectedAmount ? `¥${view.expectedAmount.toLocaleString()}` : "—"} mono />
          <MRow label="预计签单" value={view.expectedSignAt} />
          <div className="mt-3 p-3 rounded-xl bg-foreground/[0.04] text-[13px] whitespace-pre-wrap">{view.content}</div>
        </div>}
      </MSheet>

      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑跟进" : "新建跟进"}
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton><MButton className="flex-1" onClick={save}>保存</MButton></div>}
      >
        {editing && <div>
          <MField label="客户" required><MSelect value={editing.customerId ?? ""} onChange={(v) => setEditing({ ...editing, customerId: v })} options={[{ value: "", label: "请选择" }, ...customers.map(c => ({ value: c.id, label: c.name }))]} /></MField>
          <MField label="主题" required><MInput value={editing.subject ?? ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></MField>
          <MField label="联系方式"><MSelect value={editing.contactWay ?? "电话"} onChange={(v) => setEditing({ ...editing, contactWay: v as any })} options={WAYS.map(w => ({ value: w, label: w }))} /></MField>
          <MField label="商机状态"><MSelect value={editing.oppStatus ?? ""} onChange={(v) => setEditing({ ...editing, oppStatus: v as any })} options={[{ value: "", label: "—" }, ...OPP.map(o => ({ value: o, label: o }))]} /></MField>
          <MField label="联系日期"><MInput type="date" value={editing.contactDate ?? ""} onChange={(e) => setEditing({ ...editing, contactDate: e.target.value })} /></MField>
          <MField label="下次回访"><MInput type="date" value={editing.nextVisitAt ?? ""} onChange={(e) => setEditing({ ...editing, nextVisitAt: e.target.value })} /></MField>
          <MField label="意向产品"><MInput value={editing.intentProduct ?? ""} onChange={(e) => setEditing({ ...editing, intentProduct: e.target.value })} /></MField>
          <MField label="预计金额"><MInput type="number" value={editing.expectedAmount ?? ""} onChange={(e) => setEditing({ ...editing, expectedAmount: Number(e.target.value) })} /></MField>
          <MField label="跟进内容" required><MTextarea value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="min-h-[120px]" /></MField>
          <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
        </div>}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除该跟进记录？" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
