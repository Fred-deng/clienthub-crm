import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, Search, Download, Users as UsersIcon, Star, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataPanel } from "@/components/common/DataPanel";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { customerApi, contactApi, employeeApi } from "@/services/api";
import { usePagedList } from "@/hooks/usePagedList";
import { fmtMoney, customerStageLabel, customerTypeLabel } from "@/lib/format";
import type { Customer, Contact, Employee } from "@/types";
import { useEffect, ReactNode } from "react";

const emptyCustomer: Omit<Customer, "id"> = {
  code: "", name: "", taxNo: "", type: "software", status: "potential", region: "",
  stage: "lead", level: "B",
  contact: "", phone: "", email: "",
  registeredAddress: "", businessScope: "", address: "",
  legalPerson: "", companyNature: "民营", industry: "",
  registeredAt: "", registeredCapital: 0, paidInCapital: 0,
  scale: "", insuredCount: 0,
  firstCooperationAt: "", cooperationStatus: "未合作", cooperationProducts: "",
  ownerId: "u3",
  category: "潜在客户", source: "电话开发", seaStatus: "私海",
  lastVisitAt: "", nextVisitAt: "",
  invoiceInfo: "", introducer: "",
  totalAmount: 0, receivable: 0,
  createdAt: new Date().toISOString().slice(0, 10), remark: "",
};

// —— 分组小标题（参考截图：深色 chip + 长分割线） ——
function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-12 flex items-center gap-3 mt-2 first:mt-0">
      <span className="inline-flex items-center px-3 h-7 rounded-md bg-foreground text-background text-xs font-semibold tracking-wide">
        {children}
      </span>
      <div className="flex-1 h-px bg-foreground/10" />
    </div>
  );
}

function Field({ label, required, span = 4, children }: { label: string; required?: boolean; span?: number; children: ReactNode }) {
  const spanClass: Record<number, string> = {
    3: "col-span-12 md:col-span-6 lg:col-span-3",
    4: "col-span-12 md:col-span-6 lg:col-span-4",
    6: "col-span-12 md:col-span-6",
    12: "col-span-12",
  };
  return (
    <div className={spanClass[span] || spanClass[4]}>
      <Label className="text-xs text-foreground/70 mb-1.5 block">
        {label}{required && <span className="text-tomato ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function Customers() {
  const { query, data, loading, reload, setFilter, setPage } = usePagedList(customerApi.list);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => { employeeApi.all().then(setEmployees); }, []);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Omit<Customer, "id">>({ defaultValues: emptyCustomer });

  const openCreate = () => {
    reset({ ...emptyCustomer, code: `CUS-${Date.now().toString().slice(-6)}` });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Customer) => {
    reset({ ...emptyCustomer, ...c });
    setEditing(c);
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await customerApi.update(editing.id, values);
      toast.success("客户已更新");
    } else {
      await customerApi.create(values);
      toast.success("客户已创建");
    }
    setOpen(false);
    reload();
  });

  const onDelete = async () => {
    if (!deletingId) return;
    await customerApi.remove(deletingId);
    toast.success("客户已删除");
    setDeletingId(null);
    reload();
  };

  const ownerName = (id: string) => employees.find(e => e.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="客户管理"
        meta="CUSTOMER REGISTRY"
        subtitle="软件客户与硬件客户档案，区分潜在与正式客户。"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />导出</Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />新增客户</Button>
          </>
        }
      />

      <DataPanel
        title="客户列表"
        subtitle={`Customer registry · ${data.total} records`}
        accent="tomato"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <Input
                placeholder="搜索名称 / 编号 / 联系人"
                className="pl-9 h-9 w-60 text-xs rounded-full"
                onChange={(e) => setFilter({ keyword: e.target.value })}
              />
            </div>
            <Select value={query.type ?? "all"} onValueChange={(v) => setFilter({ type: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="software">软件客户</SelectItem>
                <SelectItem value="hardware">硬件客户</SelectItem>
              </SelectContent>
            </Select>
            <Select value={query.stage ?? "all"} onValueChange={(v) => setFilter({ stage: v })}>
              <SelectTrigger className="h-9 w-28 text-xs rounded-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="lead">潜在客户</SelectItem>
                <SelectItem value="formal">正式客户</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>编号</th>
                <th>客户</th>
                <th>类型</th>
                <th>类别</th>
                <th>区域</th>
                <th>负责人</th>
                <th>联系人</th>
                <th>电话</th>
                <th className="num">应收</th>
                <th className="num">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr className="empty"><td colSpan={10} className="empty">加载中…</td></tr>}
              {!loading && data.list.length === 0 && (
                <tr className="empty"><td colSpan={10} className="empty">暂无客户数据</td></tr>
              )}
              {data.list.map((c) => {
                const avatarTone = c.type === "software" ? "bg-cobalt text-white" : "bg-mint text-foreground";
                return (
                  <tr key={c.id}>
                    <td className="mono">{c.code}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={"size-8 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0 " + avatarTone}>
                          {c.name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{c.name}</div>
                          <div className="text-[11px] text-foreground/45 truncate">{c.industry || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={"cell-chip " + (c.type === "software" ? "bg-cobalt/10 text-cobalt ring-1 ring-cobalt/20" : "bg-mint/20 text-foreground ring-1 ring-mint/40")}>
                        {customerTypeLabel(c.type)}
                      </span>
                    </td>
                    <td className="text-foreground/70">{c.category || "—"}</td>
                    <td className="text-foreground/70">{c.region || "—"}</td>
                    <td className="text-foreground/70">{ownerName(c.ownerId)}</td>
                    <td>{c.contact}</td>
                    <td className="mono">{c.phone}</td>
                    <td className="num">{fmtMoney(c.receivable)}</td>
                    <td className="num">
                      <div className="inline-flex gap-1">
                        <Link to={`/contacts?customerId=${c.id}`} title="查看联系人" className="size-8 rounded-full hover:bg-cobalt/10 text-foreground/55 hover:text-cobalt inline-flex items-center justify-center transition-colors">
                          <UsersIcon className="h-3.5 w-3.5" />
                        </Link>
                        <button className="size-8 rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground inline-flex items-center justify-center transition-colors" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="size-8 rounded-full hover:bg-tomato/10 text-foreground/55 hover:text-tomato inline-flex items-center justify-center transition-colors" onClick={() => setDeletingId(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={query.page!}
          pageSize={query.pageSize!}
          total={data.total}
          onPageChange={setPage}
        />
      </DataPanel>

      {/* —— 客户表单（按业务字段分组） —— */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "编辑客户" : "新增客户"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-12 gap-x-4 gap-y-3 text-sm">
            {/* 基础信息 */}
            <GroupTitle>基础信息</GroupTitle>
            <Field label="客户全称" required><Input placeholder="请输入客户全称" {...register("name", { required: true })} /></Field>
            <Field label="客户编号"><Input placeholder="请输入客户编号" {...register("code", { required: true })} /></Field>
            <Field label="税号"><Input placeholder="请输入税号" {...register("taxNo")} /></Field>
            <Field label="客户类型">
              <Select value={watch("type")} onValueChange={(v: any) => setValue("type", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="software">软件客户</SelectItem>
                  <SelectItem value="hardware">硬件客户</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="客户状态">
              <Select value={watch("status") || ""} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="potential">潜在</SelectItem>
                  <SelectItem value="active">活跃</SelectItem>
                  <SelectItem value="inactive">沉默</SelectItem>
                  <SelectItem value="lost">流失</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="归属区域"><Input placeholder="请输入归属区域" {...register("region")} /></Field>

            {/* 联系信息 */}
            <GroupTitle>联系信息</GroupTitle>
            <Field label="联系人"><Input {...register("contact")} /></Field>
            <Field label="电话"><Input {...register("phone")} /></Field>
            <Field label="邮箱"><Input {...register("email")} /></Field>
            <Field label="注册地址" span={6}><Input placeholder="请输入注册地址" {...register("registeredAddress")} /></Field>
            <Field label="通讯地址" span={6}><Input {...register("address")} /></Field>
            <Field label="经营范围" span={12}>
              <Textarea rows={2} placeholder="请输入经营范围" {...register("businessScope")} />
            </Field>

            {/* 工商信息 */}
            <GroupTitle>工商信息</GroupTitle>
            <Field label="法定代表人"><Input placeholder="请输入法定代表人" {...register("legalPerson")} /></Field>
            <Field label="公司性质">
              <Select value={watch("companyNature") || ""} onValueChange={(v: any) => setValue("companyNature", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["国企","民营","外资","合资","上市公司","事业单位","其他"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="所属行业">
              <Select value={watch("industry") || ""} onValueChange={(v: any) => setValue("industry", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["制造业","能源","物流","金融","教育","医疗","政府","电力"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="注册时间"><Input type="date" {...register("registeredAt")} /></Field>
            <Field label="注册资金（万元）"><Input type="number" step="0.01" {...register("registeredCapital", { valueAsNumber: true })} /></Field>
            <Field label="实缴资金（万元）"><Input type="number" step="0.01" {...register("paidInCapital", { valueAsNumber: true })} /></Field>
            <Field label="客户规模"><Input placeholder="请输入客户规模" {...register("scale")} /></Field>
            <Field label="参保人数"><Input type="number" {...register("insuredCount", { valueAsNumber: true })} /></Field>

            {/* 合作信息 */}
            <GroupTitle>合作信息</GroupTitle>
            <Field label="首次合作时间"><Input type="date" {...register("firstCooperationAt")} /></Field>
            <Field label="合作状态">
              <Select value={watch("cooperationStatus") || ""} onValueChange={(v: any) => setValue("cooperationStatus", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["未合作","意向中","合作中","已暂停","已终止"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="合作产品/服务"><Input placeholder="请输入合作产品/服务" {...register("cooperationProducts")} /></Field>
            <Field label="销售负责人">
              <Select value={watch("ownerId")} onValueChange={(v: any) => setValue("ownerId", v)}>
                <SelectTrigger><SelectValue placeholder="选择销售负责人" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}（{e.role}）</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* 客户管理 */}
            <GroupTitle>客户管理</GroupTitle>
            <Field label="客户类别">
              <Select value={watch("category") || ""} onValueChange={(v: any) => setValue("category", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["战略客户","重点客户","普通客户","潜在客户"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="客户来源">
              <Select value={watch("source") || ""} onValueChange={(v: any) => setValue("source", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  {["电话开发","网络推广","客户介绍","展会","陌拜","其他"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="公海状态">
              <Select value={watch("seaStatus") || ""} onValueChange={(v: any) => setValue("seaStatus", v)}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="私海">私海</SelectItem>
                  <SelectItem value="公海">公海</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="最近拜访时间"><Input type="date" {...register("lastVisitAt")} /></Field>
            <Field label="下次拜访日期"><Input type="date" {...register("nextVisitAt")} /></Field>
            <Field label="客户等级">
              <Select value={watch("level")} onValueChange={(v: any) => setValue("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A 重点</SelectItem>
                  <SelectItem value="B">B 普通</SelectItem>
                  <SelectItem value="C">C 一般</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* 其他信息 */}
            <GroupTitle>其他信息</GroupTitle>
            <Field label="开票信息" span={4}><Input placeholder="请输入开票信息" {...register("invoiceInfo")} /></Field>
            <Field label="介绍人" span={4}><Input placeholder="请输入介绍人" {...register("introducer")} /></Field>
            <Field label="备注" span={12}>
              <Textarea rows={2} placeholder="请输入备注信息" {...register("remark")} />
            </Field>

            <DialogFooter className="col-span-12 mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">{editing ? "保存修改" : "创建客户"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        title="删除客户"
        description="删除后无法恢复，与该客户关联的合同/订单不会被自动清理。"
        onConfirm={onDelete}
      />
    </>
  );
}
