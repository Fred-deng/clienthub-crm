import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import type { Customer } from "@/types";
import { Phone, MapPin } from "lucide-react";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MLoadMore, MConfirm, MRow } from "../components/MUI";

const STATUS_OPTS = [
  { value: "all", label: "全部" },
  { value: "active", label: "合作中" },
  { value: "intent", label: "意向" },
  { value: "potential", label: "潜在" },
  { value: "paused", label: "暂停" },
  { value: "inactive", label: "停用" },
  { value: "lost", label: "已流失" },
];
const STATUS_LABEL: Record<string, string> = { active: "合作中", intent: "意向", potential: "潜在", paused: "暂停", inactive: "停用", lost: "流失" };
const STATUS_VARIANT: Record<string, "mint" | "mustard" | "tomato" | "muted"> = { active: "mint", intent: "mustard", potential: "mustard", paused: "muted", inactive: "muted", lost: "tomato" };

export default function MCustomers() {
  const { current } = useCurrentUser();
  const { toast } = useToast();
  const { query, data, loading, setFilter, reload } = usePagedList<Customer>(customerApi.list, { pageSize: 20 });
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const onSearch = (v: string) => { setKeyword(v); setFilter({ keyword: v }); };
  const onStatus = (v: string) => { setStatus(v); setFilter({ status: v }); };

  const openCreate = () => { setEditing({ stage: "lead", level: "B", status: "potential", ownerId: current.id, contact: "", phone: "", email: "", industry: "制造业", address: "", name: "", code: "" }); setEditOpen(true); };
  const openEdit = (c: Customer) => { setEditing({ ...c }); setEditOpen(true); setViewOpen(false); };

  const save = async () => {
    if (!editing?.name) return toast({ title: "请填写客户名称" });
    if (editing.id) {
      await customerApi.update(editing.id, editing);
      toast({ title: "已更新" });
    } else {
      await customerApi.create({ ...editing, createdAt: new Date().toISOString().slice(0, 10), code: `CUS-${Date.now().toString().slice(-6)}` } as any);
      toast({ title: "已创建" });
    }
    setEditOpen(false);
    reload();
  };

  const doDelete = async () => {
    if (!delId) return;
    await customerApi.remove(delId);
    setDelId(null); setViewOpen(false);
    toast({ title: "已删除" });
    reload();
  };

  return (
    <div>
      <MPageHeader title="客户档案" subtitle={`共 ${data.total} 个客户`} />
      <MSearchBar value={keyword} onChange={onSearch} placeholder="搜索客户名称 / 编号 / 联系人" />
      <MChipFilter value={status} onChange={onStatus} options={STATUS_OPTS} />

      <MList loading={loading && data.list.length === 0} empty={!loading && data.list.length === 0}>
        {data.list.map((c) => (
          <MCard key={c.id} onClick={() => { setViewing(c); setViewOpen(true); }}>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-br from-mustard to-tomato/70 flex items-center justify-center font-display font-black text-foreground shrink-0">{c.name.slice(0, 1)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-[14px] truncate flex-1">{c.name}</h3>
                  <MTag variant={STATUS_VARIANT[c.status ?? "potential"]}>{STATUS_LABEL[c.status ?? "potential"]}</MTag>
                </div>
                <div className="text-[11px] font-mono text-foreground/45 mt-0.5">{c.code} · {c.level} · {c.industry}</div>
                <div className="flex items-center gap-3 text-[11px] text-foreground/55 mt-1.5">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.contact}</span>
                  <span className="truncate">{c.phone}</span>
                </div>
              </div>
            </div>
          </MCard>
        ))}
        <MLoadMore hasMore={false} loading={loading} onLoad={() => {}} />
      </MList>

      <MFab onClick={openCreate} />

      {/* 详情 */}
      <MSheet open={viewOpen} onOpenChange={setViewOpen} title={viewing?.name ?? "客户详情"}
        footer={viewing && (
          <div className="flex gap-2">
            <MButton variant="outline" className="flex-1" onClick={() => setDelId(viewing.id)}>删除</MButton>
            <MButton variant="ghost" className="flex-1" onClick={() => window.location.assign(`tel:${viewing.phone}`)}>呼叫</MButton>
            <MButton className="flex-1" onClick={() => openEdit(viewing)}>编辑</MButton>
          </div>
        )}
      >
        {viewing && (
          <div>
            <MRow label="客户编号" value={viewing.code} mono />
            <MRow label="状态" value={<MTag variant={STATUS_VARIANT[viewing.status ?? "potential"]}>{STATUS_LABEL[viewing.status ?? "potential"]}</MTag>} />
            <MRow label="级别" value={viewing.level} />
            <MRow label="行业" value={viewing.industry} />
            <MRow label="区域" value={viewing.region} />
            <MRow label="联系人" value={viewing.contact} />
            <MRow label="手机" value={viewing.phone} mono />
            <MRow label="邮箱" value={viewing.email} />
            <MRow label="法人" value={viewing.legalPerson} />
            <MRow label="税号" value={viewing.taxNo} mono />
            <MRow label="注册资金" value={viewing.registeredCapital ? `${viewing.registeredCapital} 万` : "—"} />
            <MRow label="地址" value={viewing.address} />
            <MRow label="备注" value={viewing.remark} />
          </div>
        )}
      </MSheet>

      {/* 编辑 */}
      <MSheet open={editOpen} onOpenChange={setEditOpen} title={editing?.id ? "编辑客户" : "新建客户"}
        footer={
          <div className="flex gap-2">
            <MButton variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</MButton>
            <MButton className="flex-1" onClick={save}>保存</MButton>
          </div>
        }
      >
        {editing && (
          <div>
            <MField label="客户名称" required><MInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></MField>
            <MField label="状态">
              <MSelect value={editing.status ?? "potential"} onChange={(v) => setEditing({ ...editing, status: v as any, stage: (v === "potential" || v === "intent") ? "lead" : "formal" })} options={STATUS_OPTS.filter(o => o.value !== "all")} />
            </MField>
            <MField label="级别">
              <MSelect value={editing.level ?? "B"} onChange={(v) => setEditing({ ...editing, level: v as any })} options={[{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }]} />
            </MField>
            <MField label="行业"><MInput value={editing.industry ?? ""} onChange={(e) => setEditing({ ...editing, industry: e.target.value })} /></MField>
            <MField label="联系人"><MInput value={editing.contact ?? ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></MField>
            <MField label="手机"><MInput value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></MField>
            <MField label="邮箱"><MInput type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></MField>
            <MField label="地址"><MInput value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></MField>
            <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
          </div>
        )}
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除客户？" description="此操作不可撤销" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
