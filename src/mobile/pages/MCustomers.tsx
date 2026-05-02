import { useState } from "react";
import { customerApi } from "@/services/api";
import { useInfiniteList } from "../hooks/useInfiniteList";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/context/CurrentUserContext";
import type { Customer } from "@/types";
import { Phone, Download, CheckSquare } from "lucide-react";
import { exportCsv } from "@/lib/csv";
import { MPageHeader, MSearchBar, MList, MCard, MTag, MFab, MSheet, MField, MInput, MTextarea, MSelect, MButton, MChipFilter, MLoadMore, MConfirm, MRow, MCheckbox, MIconBtn, MBulkBar } from "../components/MUI";

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
const SEA_OPTS = [{ value: "all", label: "全部" }, { value: "私海", label: "私海" }, { value: "公海", label: "公海" }];

export default function MCustomers() {
  const { current } = useCurrentUser();
  const { toast } = useToast();
  const { items, total, loading, hasMore, setFilter, loadMore, reload } = useInfiniteList<Customer>(customerApi.list, { pageSize: 15 });
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [sea, setSea] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkSheet, setBulkSheet] = useState<null | "sea" | "status">(null);
  const [bulkSeaValue, setBulkSeaValue] = useState<"公海" | "私海">("私海");
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("active");

  const onSearch = (v: string) => { setKeyword(v); setFilter({ keyword: v }); };
  const toggleId = (id: string) => setSelectedIds((s) => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const openCreate = () => { setEditing({ stage: "lead", level: "B", status: "potential", seaStatus: "私海", ownerId: current.id, contact: "", phone: "", email: "", industry: "制造业", address: "", name: "", code: "" }); setEditOpen(true); };
  const openEdit = (c: Customer) => { setEditing({ ...c }); setEditOpen(true); setViewOpen(false); };

  const save = async () => {
    if (!editing?.name) return toast({ title: "请填写客户名称" });
    if (editing.id) { await customerApi.update(editing.id, editing); toast({ title: "已更新" }); }
    else { await customerApi.create({ ...editing, createdAt: new Date().toISOString().slice(0, 10), code: `CUS-${Date.now().toString().slice(-6)}` } as any); toast({ title: "已创建" }); }
    setEditOpen(false); reload();
  };

  const doDelete = async () => { if (!delId) return; await customerApi.remove(delId); setDelId(null); setViewOpen(false); toast({ title: "已删除" }); reload(); };

  const doExport = async () => {
    const all = await customerApi.all();
    exportCsv("customers", all, [
      { header: "编号", value: (c) => c.code }, { header: "名称", value: (c) => c.name },
      { header: "状态", value: (c) => STATUS_LABEL[c.status || "potential"] || "—" },
      { header: "区域", value: (c) => c.region || "" }, { header: "公海", value: (c) => c.seaStatus || "私海" },
      { header: "联系人", value: (c) => c.contact }, { header: "电话", value: (c) => c.phone },
      { header: "创建", value: (c) => c.createdAt },
    ]);
    toast({ title: "已导出 CSV" });
  };

  const applyBulkSea = async () => {
    await Promise.all(selectedIds.map((id) => customerApi.update(id, { seaStatus: bulkSeaValue } as any)));
    toast({ title: `已转入${bulkSeaValue}` });
    setBulkSheet(null); setSelectedIds([]); setSelectMode(false); reload();
  };
  const applyBulkStatus = async () => {
    await Promise.all(selectedIds.map((id) => customerApi.update(id, {
      status: bulkStatusValue as any,
      stage: (bulkStatusValue === "potential" || bulkStatusValue === "intent") ? "lead" : "formal",
    })));
    toast({ title: "已批量更新状态" });
    setBulkSheet(null); setSelectedIds([]); setSelectMode(false); reload();
  };

  return (
    <div>
      <MPageHeader title="客户档案" subtitle={`共 ${total} 个客户`}
        action={<div className="flex gap-1">
          <MIconBtn icon={CheckSquare} onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }} active={selectMode} title="批量" />
          <MIconBtn icon={Download} onClick={doExport} title="导出" />
        </div>}
      />
      <MSearchBar value={keyword} onChange={onSearch} placeholder="搜索客户名称 / 编号 / 联系人" />
      <MChipFilter value={sea} onChange={(v) => { setSea(v); setFilter({ seaStatus: v }); }} options={SEA_OPTS} />
      <MChipFilter value={status} onChange={(v) => { setStatus(v); setFilter({ status: v }); }} options={STATUS_OPTS} />
      {selectMode && (
        <MBulkBar count={selectedIds.length} onCancel={() => { setSelectMode(false); setSelectedIds([]); }}>
          <button onClick={() => selectedIds.length && setBulkSheet("sea")} className="text-[11px] px-2.5 h-7 rounded-full bg-card border border-foreground/15">公海/私海</button>
          <button onClick={() => selectedIds.length && setBulkSheet("status")} className="text-[11px] px-2.5 h-7 rounded-full bg-card border border-foreground/15">改状态</button>
        </MBulkBar>
      )}

      <MList loading={loading && items.length === 0} empty={!loading && items.length === 0}>
        {items.map((c) => (
          <MCard key={c.id} onClick={() => { if (selectMode) toggleId(c.id); else { setViewing(c); setViewOpen(true); } }}>
            <div className="flex items-start gap-3">
              {selectMode && <div onClick={(e) => { e.stopPropagation(); toggleId(c.id); }} className="pt-1"><MCheckbox checked={selectedIds.includes(c.id)} onChange={() => toggleId(c.id)} /></div>}
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
                  {c.seaStatus === "公海" && <MTag variant="cobalt">公海</MTag>}
                </div>
              </div>
            </div>
          </MCard>
        ))}
        {items.length > 0 && <MLoadMore hasMore={hasMore} loading={loading} onLoad={loadMore} />}
      </MList>

      {!selectMode && <MFab onClick={openCreate} />}

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
            <MRow label="公海状态" value={viewing.seaStatus} />
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
            <MField label="公海状态">
              <MSelect value={editing.seaStatus ?? "私海"} onChange={(v) => setEditing({ ...editing, seaStatus: v as any })} options={[{ value: "私海", label: "私海" }, { value: "公海", label: "公海" }]} />
            </MField>
            <MField label="级别">
              <MSelect value={editing.level ?? "B"} onChange={(v) => setEditing({ ...editing, level: v as any })} options={[{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }]} />
            </MField>
            <MField label="行业"><MInput value={editing.industry ?? ""} onChange={(e) => setEditing({ ...editing, industry: e.target.value })} /></MField>
            <MField label="区域"><MInput value={editing.region ?? ""} onChange={(e) => setEditing({ ...editing, region: e.target.value })} /></MField>
            <MField label="联系人"><MInput value={editing.contact ?? ""} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></MField>
            <MField label="手机"><MInput value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></MField>
            <MField label="邮箱"><MInput type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></MField>
            <MField label="法人"><MInput value={editing.legalPerson ?? ""} onChange={(e) => setEditing({ ...editing, legalPerson: e.target.value })} /></MField>
            <MField label="税号"><MInput value={editing.taxNo ?? ""} onChange={(e) => setEditing({ ...editing, taxNo: e.target.value })} /></MField>
            <MField label="地址"><MInput value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></MField>
            <MField label="备注"><MTextarea value={editing.remark ?? ""} onChange={(e) => setEditing({ ...editing, remark: e.target.value })} /></MField>
          </div>
        )}
      </MSheet>

      <MSheet open={bulkSheet === "sea"} onOpenChange={(o) => !o && setBulkSheet(null)} title="批量调整 公海/私海"
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setBulkSheet(null)}>取消</MButton><MButton className="flex-1" onClick={applyBulkSea}>应用</MButton></div>}
      >
        <MField label="目标"><MSelect value={bulkSeaValue} onChange={(v) => setBulkSeaValue(v as any)} options={[{ value: "私海", label: "私海" }, { value: "公海", label: "公海" }]} /></MField>
        <p className="text-xs text-foreground/55">共 {selectedIds.length} 位客户将被调整</p>
      </MSheet>

      <MSheet open={bulkSheet === "status"} onOpenChange={(o) => !o && setBulkSheet(null)} title="批量修改客户状态"
        footer={<div className="flex gap-2"><MButton variant="ghost" className="flex-1" onClick={() => setBulkSheet(null)}>取消</MButton><MButton className="flex-1" onClick={applyBulkStatus}>应用</MButton></div>}
      >
        <MField label="新状态"><MSelect value={bulkStatusValue} onChange={setBulkStatusValue} options={STATUS_OPTS.filter(o => o.value !== "all")} /></MField>
        <p className="text-xs text-foreground/55">共 {selectedIds.length} 位客户将被修改</p>
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={(o) => !o && setDelId(null)} title="删除客户？" description="此操作不可撤销" onConfirm={doDelete} confirmText="删除" danger />
    </div>
  );
}
