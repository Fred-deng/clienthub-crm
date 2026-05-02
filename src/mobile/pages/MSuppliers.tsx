// 供应商管理（移动端）— 1:1 复刻 PC 端 Suppliers
import { useEffect, useMemo, useState } from "react";
import { Star, Trash2, Phone, Download } from "lucide-react";
import { toast } from "sonner";
import {
  MPageHeader, MSearchBar, MCard, MList, MTag, MFab, MSheet, MField, MInput, MTextarea,
  MSelect, MSwitch, MButton, MConfirm, MGroupTitle, MAccordion,
} from "../components/MUI";
import { supplierApi, supplierContactApi, employeeApi, purchaseApi } from "@/services/api";
import { useCategories, categoryStore } from "@/services/categories";
import { fmtMoney } from "@/lib/format";
import { exportCsv } from "@/lib/csv";
import type { Supplier, SupplierContact, Employee, PurchaseOrder } from "@/types";

const empty: Omit<Supplier, "id"> = {
  code: "", name: "", taxNo: "",
  contact: "", phone: "", contactPosition: "",
  secondaryContact: "", secondaryContactPhone: "",
  address: "", addressDetail: "",
  buyerId: "", assistantIds: [],
  bankAccountName: "", bankName: "", bankAccountNo: "",
  remark: "", attachment: "",
  category: "ipc", payable: 0,
  createdAt: new Date().toISOString().slice(0, 10),
};

export default function MSuppliers() {
  const cats = useCategories();
  const [list, setList] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allPur, setAllPur] = useState<PurchaseOrder[]>([]);
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>(empty);
  const [scts, setScts] = useState<SupplierContact[]>([]);
  const [delId, setDelId] = useState<string | null>(null);
  const [scOpen, setScOpen] = useState(false);
  const [scForm, setScForm] = useState<Partial<Omit<SupplierContact, "id">>>({});

  const reload = async () => setList(await supplierApi.all());
  useEffect(() => {
    reload();
    employeeApi.all().then(setEmployees);
    purchaseApi.all().then(setAllPur);
  }, []);

  const payByS = useMemo(() => {
    const m = new Map<string, number>();
    allPur.filter(o => o.status !== "cancelled" && o.status !== "draft").forEach(o => {
      const r = Math.max((o.contractAmount || o.totalAmount) - (o.paid || 0), 0);
      m.set(o.supplierId, (m.get(o.supplierId) || 0) + r);
    });
    return m;
  }, [allPur]);

  const filtered = list.filter(s => {
    if (!keyword) return true;
    const k = keyword.toLowerCase();
    return s.name.toLowerCase().includes(k) || s.code.toLowerCase().includes(k) || (s.contact || "").toLowerCase().includes(k);
  });

  const openCreate = () => {
    setForm({ ...empty, code: `SUP-${Date.now().toString().slice(-6)}` });
    setEditing(null); setScts([]); setOpen(true);
  };
  const openEdit = async (s: Supplier) => {
    setForm({ ...empty, ...s, assistantIds: s.assistantIds ?? [] });
    setEditing(s); setOpen(true);
    const r = await supplierContactApi.list({ supplierId: s.id, pageSize: 100 });
    setScts(r.list);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("请输入供应商名称");
    if (editing) { await supplierApi.update(editing.id, form); toast.success("已更新"); }
    else { await supplierApi.create(form); toast.success("已创建"); }
    setOpen(false); reload();
  };

  const onDelete = async () => {
    if (!delId) return;
    const linked = allPur.filter(p => p.supplierId === delId).length;
    if (linked > 0) { toast.error(`存在 ${linked} 笔采购单`); setDelId(null); return; }
    await supplierApi.remove(delId); toast.success("已删除"); setDelId(null); reload();
  };

  const empName = (id?: string) => employees.find(e => e.id === id)?.name ?? "—";

  const submitSC = async () => {
    if (!editing || !scForm.name?.trim() || !scForm.phone?.trim()) return toast.error("姓名/电话必填");
    await supplierContactApi.create({
      code: `GLXR-${Date.now().toString().slice(-6)}`,
      supplierId: editing.id, supplierName: editing.name,
      name: scForm.name!, phone: scForm.phone!,
      position: scForm.position || "", email: scForm.email || "",
      wechat: scForm.wechat || "", isPrimary: !!scForm.isPrimary,
      remark: scForm.remark || "", createdAt: new Date().toISOString().slice(0, 10),
    } as any);
    setScOpen(false); setScForm({});
    const r = await supplierContactApi.list({ supplierId: editing.id, pageSize: 100 });
    setScts(r.list);
  };

  const exportAll = async () => {
    const all = await supplierApi.all();
    exportCsv("suppliers", all, [
      { header: "编号", value: s => s.code }, { header: "供应商", value: s => s.name },
      { header: "分类", value: s => categoryStore.labelOf(s.category) },
      { header: "联系人", value: s => s.contact }, { header: "电话", value: s => s.phone },
      { header: "应付", value: s => payByS.get(s.id) || 0 },
    ]);
  };

  return (
    <>
      <MPageHeader title="供应商管理" subtitle={`共 ${filtered.length} 家`}
        action={<button onClick={exportAll} className="size-9 rounded-full bg-foreground/[0.06] flex items-center justify-center"><Download className="h-4 w-4" /></button>} />
      <MSearchBar value={keyword} onChange={setKeyword} placeholder="搜索名称/编号/联系人" />

      <MList empty={filtered.length === 0}>
        {filtered.map(s => {
          const pay = payByS.get(s.id) || 0;
          return (
            <MCard key={s.id} onClick={() => openEdit(s)}>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-cobalt/15 text-cobalt flex items-center justify-center font-display font-black shrink-0">{s.name.slice(0, 1)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[14px] truncate">{s.name}</span>
                    <MTag variant="cobalt">{categoryStore.labelOf(s.category)}</MTag>
                  </div>
                  <div className="text-[11px] text-foreground/50 mt-0.5 font-mono">{s.code} · {empName(s.buyerId)}</div>
                  <div className="text-[12px] text-foreground/70 mt-1.5">{s.contact || "—"} · {s.phone || "—"}</div>
                  {pay > 0 && <div className="text-[12px] mt-1 font-mono text-tomato font-bold">应付 {fmtMoney(pay)}</div>}
                </div>
              </div>
            </MCard>
          );
        })}
      </MList>

      <MFab onClick={openCreate} />

      <MSheet open={open} onOpenChange={setOpen} size="full" title={editing ? "编辑供应商" : "新增供应商"}
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setOpen(false)} className="flex-1">取消</MButton><MButton onClick={submit} className="flex-1">{editing ? "保存修改" : "创建"}</MButton></div>}>
        <MGroupTitle>企业档案</MGroupTitle>
        <MField label="供应商名称" required><MInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></MField>
        <MField label="编号" required><MInput value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></MField>
        <MField label="税号"><MInput value={form.taxNo || ""} onChange={e => setForm({ ...form, taxNo: e.target.value })} /></MField>
        <MField label="分类">
          <MSelect value={categoryStore.normalize(form.category)} onChange={v => setForm({ ...form, category: v as any })}
            options={cats.map(c => ({ value: c.id, label: c.label }))} />
        </MField>
        <MGroupTitle>主要联系人</MGroupTitle>
        <MField label="联系人姓名"><MInput value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} /></MField>
        <MField label="联系人电话"><MInput value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></MField>
        <MField label="联系人职务"><MInput value={form.contactPosition || ""} onChange={e => setForm({ ...form, contactPosition: e.target.value })} /></MField>
        <MField label="次要联系人"><MInput value={form.secondaryContact || ""} onChange={e => setForm({ ...form, secondaryContact: e.target.value })} /></MField>
        <MField label="次要联系电话"><MInput value={form.secondaryContactPhone || ""} onChange={e => setForm({ ...form, secondaryContactPhone: e.target.value })} /></MField>
        <MGroupTitle>地址信息</MGroupTitle>
        <MField label="地址"><MInput value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></MField>
        <MField label="详细地址"><MInput value={form.addressDetail || ""} onChange={e => setForm({ ...form, addressDetail: e.target.value })} /></MField>
        <MGroupTitle>采购归属</MGroupTitle>
        <MField label="采购负责人">
          <MSelect value={form.buyerId || ""} onChange={v => setForm({ ...form, buyerId: v })}
            options={employees.map(e => ({ value: e.id, label: `${e.name}（${e.role}）` }))} placeholder="请选择" />
        </MField>
        <MGroupTitle>银行账户</MGroupTitle>
        <MField label="开户名称"><MInput value={form.bankAccountName || ""} onChange={e => setForm({ ...form, bankAccountName: e.target.value })} /></MField>
        <MField label="开户银行"><MInput value={form.bankName || ""} onChange={e => setForm({ ...form, bankName: e.target.value })} /></MField>
        <MField label="银行账号"><MInput value={form.bankAccountNo || ""} onChange={e => setForm({ ...form, bankAccountNo: e.target.value })} className="font-mono" /></MField>
        <MGroupTitle>备注</MGroupTitle>
        <MField label="备注"><MTextarea value={form.remark || ""} onChange={e => setForm({ ...form, remark: e.target.value })} /></MField>

        {editing && (
          <>
            <MAccordion title="供应商联系人" badge={<MTag variant="cobalt">{scts.length}</MTag>} defaultOpen
              action={<button onClick={() => setScOpen(true)} className="text-[11px] px-2 h-7 rounded-full bg-foreground text-[hsl(var(--paper))] font-semibold">新增</button>}>
              {scts.length === 0 ? <div className="text-center py-4 text-[12px] text-foreground/40">暂无联系人</div> :
                <div className="space-y-1.5">
                  {scts.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-foreground/[0.03]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-semibold text-[13px]">{c.name}{c.isPrimary && <Star className="h-3 w-3 fill-tomato text-tomato" />}</div>
                        <div className="text-[11px] text-foreground/55 font-mono">{c.phone} · {c.position || "—"}</div>
                      </div>
                      <a href={`tel:${c.phone}`} className="size-7 rounded-full bg-mint/30 flex items-center justify-center"><Phone className="h-3 w-3" /></a>
                      <button onClick={async () => { await supplierContactApi.remove(c.id); const r = await supplierContactApi.list({ supplierId: editing.id, pageSize: 100 }); setScts(r.list); }} className="ml-1 size-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              }
            </MAccordion>
            <div className="mt-3"><MButton variant="danger" onClick={() => { setDelId(editing.id); setOpen(false); }} className="w-full"><Trash2 className="h-3.5 w-3.5" />删除供应商</MButton></div>
          </>
        )}
      </MSheet>

      {/* 联系人新增 */}
      <MSheet open={scOpen} onOpenChange={setScOpen} title="新增供应商联系人"
        footer={<div className="flex gap-2"><MButton variant="ghost" onClick={() => setScOpen(false)} className="flex-1">取消</MButton><MButton onClick={submitSC} className="flex-1">创建</MButton></div>}>
        <MField label="姓名" required><MInput value={scForm.name || ""} onChange={e => setScForm({ ...scForm, name: e.target.value })} /></MField>
        <MField label="电话" required><MInput value={scForm.phone || ""} onChange={e => setScForm({ ...scForm, phone: e.target.value })} /></MField>
        <MField label="职务"><MInput value={scForm.position || ""} onChange={e => setScForm({ ...scForm, position: e.target.value })} /></MField>
        <MField label="邮箱"><MInput value={scForm.email || ""} onChange={e => setScForm({ ...scForm, email: e.target.value })} /></MField>
        <MField label="微信"><MInput value={scForm.wechat || ""} onChange={e => setScForm({ ...scForm, wechat: e.target.value })} /></MField>
        <MField label="主联系人"><MSwitch checked={!!scForm.isPrimary} onChange={v => setScForm({ ...scForm, isPrimary: v })} label="设为主联系人" /></MField>
        <MField label="备注"><MTextarea value={scForm.remark || ""} onChange={e => setScForm({ ...scForm, remark: e.target.value })} /></MField>
      </MSheet>

      <MConfirm open={!!delId} onOpenChange={v => !v && setDelId(null)} title="删除供应商" onConfirm={onDelete} danger confirmText="删除" />
    </>
  );
}
