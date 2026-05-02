// Mock 数据生成，使用 mockjs。所有数据在内存中，提供 CRUD 能力。
import Mock from "mockjs";
import type {
  Customer, Product, Supplier, SupplierContact, PurchaseOrder, Contract, SalesOrder, Payment, Employee, Contact, FollowUp, InvoiceRecord,
} from "@/types";

const Random = Mock.Random;
Random.extend({
  cnCompany() {
    const prefix = Random.pick(["华兴", "蓝图", "星辰", "瀚海", "中创", "鼎盛", "宏远", "智联", "极光", "北辰", "顺达", "金石", "云图", "锐捷"]);
    const mid = Random.pick(["精密", "智能", "科技", "信息", "自动化", "电子", "数据", "工业"]);
    const suffix = Random.pick(["有限公司", "股份有限公司", "集团", "(中国)有限公司", "研究院"]);
    return prefix + mid + suffix;
  },
});

const pad = (n: number, len = 4) => String(n).padStart(len, "0");
const todayStr = () => new Date().toISOString().slice(0, 10);

// ---------- Employees ----------
export const employees: Employee[] = [
  { id: "u1", name: "陈立新", role: "管理员", phone: "13800000001", email: "chen@optic.com" },
  { id: "u2", name: "林超华", role: "销售总监", phone: "13800000002", email: "lin@optic.com" },
  { id: "u3", name: "张慧敏", role: "销售", phone: "13800000003", email: "zhang@optic.com" },
  { id: "u4", name: "王志强", role: "销售", phone: "13800000004", email: "wang@optic.com" },
  { id: "u5", name: "李文博", role: "销售", phone: "13800000005", email: "li@optic.com" },
];

// ---------- Customers ----------
export const customers: Customer[] = Array.from({ length: 48 }).map((_, i) => {
  const status = Random.pick([
    "active", "active", "active",
    "intent", "intent",
    "potential",
    "paused",
    "inactive",
    "lost",
  ]) as Customer["status"];
  const stage: Customer["stage"] = (status === "potential" || status === "intent") ? "lead" : "formal";
  const name = (Random as any).cnCompany();
  return {
    id: `c${i + 1}`,
    code: `CUS-${pad(1001 + i)}`,
    name,
    taxNo: "91" + Mock.mock(/[0-9A-Z]{16}/),
    status,
    region: Random.pick(["华东", "华南", "华北", "华中", "西南", "西北", "东北"]),
    stage,
    level: Random.pick(["A", "B", "C"]) as Customer["level"],
    contact: Random.cname(),
    phone: Mock.mock(/^1[3-9]\d{9}$/),
    email: Random.email(),
    industry: Random.pick(["制造业", "能源", "物流", "金融", "教育", "医疗", "政府", "电力"]),
    registeredAddress: Random.county(true),
    businessScope: "信息技术服务；" + Random.pick(["软件开发", "系统集成", "智能硬件销售", "工业自动化"]) + "；技术咨询。",
    address: Random.county(true),
    legalPerson: Random.cname(),
    companyNature: Random.pick(["国企", "民营", "民营", "外资", "合资", "上市公司"]) as any,
    registeredAt: Random.date("yyyy-MM-dd"),
    registeredCapital: Random.integer(100, 10000),
    paidInCapital: Random.integer(50, 8000),
    scale: Random.pick(["小型(<50人)", "中型(50-500人)", "大型(500-2000人)", "超大型(>2000人)"]),
    insuredCount: Random.integer(10, 3000),
    firstCooperationAt: Random.date("yyyy-MM-dd"),
    cooperationStatus: Random.pick(["未合作", "意向中", "合作中", "合作中", "已暂停"]) as any,
    cooperationProducts: Random.pick(["MES 系统", "ERP + 工控机", "PDA + WMS", "BI 平台", "运维服务"]),
    ownerId: Random.pick(["u3", "u4", "u5"]),
    category: Random.pick(["战略客户", "重点客户", "普通客户", "潜在客户"]) as any,
    source: Random.pick(["电话开发", "网络推广", "客户介绍", "展会", "陌拜"]) as any,
    seaStatus: Random.pick(["私海", "私海", "私海", "公海"]) as any,
    lastVisitAt: Random.date("yyyy-MM-dd"),
    nextVisitAt: Random.date("yyyy-MM-dd"),
    invoiceInfo: name + " / " + Mock.mock(/[0-9]{16}/) + " / 工商银行",
    introducer: Random.pick(["", "", Random.cname()]),
    totalAmount: Random.integer(0, 800000),
    receivable: stage === "formal" ? Random.integer(0, 200000) : 0,
    createdAt: Random.date("yyyy-MM-dd"),
    remark: Random.csentence(8, 20),
  };
});

// ---------- Products ----------
const productSeed: Array<Partial<Product>> = [
  { name: "工业控制器 IPC-7200", category: "ipc", unit: "台", price: 12800, cost: 9000, spec: "Intel i5/16G/512G SSD" },
  { name: "工业控制器 IPC-3300", category: "ipc", unit: "台", price: 8800, cost: 6200, spec: "Intel i3/8G/256G SSD" },
  { name: "加固型 PDA-V3", category: "pda", unit: "台", price: 4500, cost: 3000, spec: "安卓12 / IP67" },
  { name: "手持数据终端 PDA-S1", category: "pda", unit: "台", price: 2800, cost: 1900, spec: "扫码 / 4G" },
  { name: "工业鼠标 (有线)", category: "mouse", unit: "个", price: 120, cost: 60, spec: "防尘防水" },
  { name: "无线办公鼠标", category: "mouse", unit: "个", price: 89, cost: 35 },
  { name: "军工级电源线 5m", category: "cable", unit: "条", price: 65, cost: 28 },
  { name: "工业级 USB 数据线", category: "cable", unit: "条", price: 32, cost: 12 },
  { name: "300W 工业电源", category: "power", unit: "个", price: 380, cost: 220 },
  { name: "MES 制造执行系统", category: "software", unit: "套", price: 188000, cost: 0, spec: "标准版含基础模块" },
  { name: "WMS 仓储管理系统", category: "software", unit: "套", price: 98000, cost: 0 },
  { name: "ERP 一体化系统", category: "software", unit: "套", price: 268000, cost: 0 },
  { name: "数据分析 BI 平台", category: "software", unit: "套", price: 88000, cost: 0 },
];

export const products: Product[] = productSeed.map((p, i) => ({
  id: `p${i + 1}`,
  code: `PRD-${pad(2001 + i)}`,
  name: p.name!,
  category: p.category!,
  unit: p.unit!,
  price: p.price!,
  cost: p.cost!,
  stock: p.category === "software" ? 9999 : Random.integer(5, 200),
  safetyStock: p.category === "software" ? 0 : 20,
  spec: p.spec,
  supplierId: p.category === "software" ? undefined : `s${Random.integer(1, 5)}`,
}));

// ---------- Suppliers ----------
export const suppliers: Supplier[] = Array.from({ length: 8 }).map((_, i) => {
  const name = Random.pick(["深圳华研电子", "东莞精工科技", "广州智控", "苏州博远工控", "上海联讯"]) + " #" + (i + 1);
  const buyerPool = ["u3", "u4", "u5"];
  const buyerId = Random.pick(buyerPool);
  const assistants = Random.shuffle(buyerPool.filter((b) => b !== buyerId)).slice(0, Random.integer(0, 2));
  return {
    id: `s${i + 1}`,
    code: `SUP-${pad(3001 + i)}`,
    name,
    taxNo: "91" + Mock.mock(/[0-9A-Z]{16}/),
    contact: Random.cname(),
    phone: Mock.mock(/^1[3-9]\d{9}$/),
    contactPosition: Random.pick(["销售经理", "客户经理", "商务经理", "总经理", "项目经理"]),
    secondaryContact: Random.pick(["", Random.cname(), Random.cname()]),
    secondaryContactPhone: Mock.mock(/^1[3-9]\d{9}$/),
    address: Random.county(true),
    addressDetail: Random.pick(["科技园 A 座 808", "高新大厦 12F", "工业园 3 号厂房", "创新大厦 9 楼"]),
    buyerId,
    assistantIds: assistants,
    bankAccountName: name,
    bankName: Random.pick(["工商银行", "建设银行", "招商银行", "中国银行", "交通银行"]) + Random.pick(["深圳分行", "上海分行", "北京分行"]),
    bankAccountNo: Mock.mock(/[0-9]{16,19}/),
    remark: "",
    attachment: "",
    category: Random.pick(["工控机", "外设", "线缆", "电源", "综合"]),
    payable: Random.integer(0, 150000),
    createdAt: Random.date("yyyy-MM-dd"),
  };
});

// ---------- Purchase orders ----------
export const purchases: PurchaseOrder[] = Array.from({ length: 22 }).map((_, i) => {
  const sup = Random.pick(suppliers);
  const items = Array.from({ length: Random.integer(1, 3) }).map(() => {
    const prod = Random.pick(products.filter((p) => p.category !== "software"));
    const qty = Random.integer(5, 50);
    return { productId: prod.id, productName: prod.name, qty, price: prod.cost };
  });
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const status = Random.pick(["draft", "ordered", "received", "received"]) as PurchaseOrder["status"];
  const applicant = Random.pick(employees);
  const linked = Random.boolean();
  const contractAmt = total + Random.integer(0, 5000);
  const titlePool = ["触摸一体机销售合同", "工控机批量采购合同", "PDA 设备年度采购合同", "工业线缆采购框架合同", "电源模块采购合同"];
  return {
    id: `po${i + 1}`,
    code: `CG-2024-${pad(101 + i)}`,
    applicantId: applicant.id,
    department: Random.pick(["集马科技", "集马科技 · 采购部", "集马科技 · 项目部"]),
    appliedAt: Random.date("yyyy-MM-dd"),
    supplierId: sup.id,
    supplierName: sup.name,
    contractTitle: Random.pick(titlePool),
    signingParty: "集马科技",
    signedAt: Random.date("yyyy-MM-dd"),
    contractExpireAt: Random.date("yyyy-MM-dd"),
    contractAmount: contractAmt,
    linkedSalesContract: linked,
    linkedSalesContractId: "",
    buyerId: Random.pick(["u3", "u4", "u5"]),
    contractAttachments: [`${sup.name}_采购合同.pdf`],
    invoiceAttachments: [],
    invoices: (() => {
      if (status === "draft") return [];
      const n = Random.integer(0, 3);
      const out: InvoiceRecord[] = [];
      let remain = total;
      for (let k = 0; k < n; k++) {
        const rate = Random.pick([6, 9, 13]);
        const amt = k === n - 1 ? remain : Math.floor(remain / (n - k) * Random.float(0.5, 1.2, 0, 0));
        if (amt <= 0) break;
        remain -= amt;
        out.push({
          id: `pinv-${i}-${k}`,
          invoiceNo: "24" + Mock.mock(/[0-9]{8}/),
          invoiceType: Random.pick(["增值税专用发票", "增值税普通发票", "电子专用发票"]),
          invoiceDate: Random.date("yyyy-MM-dd"),
          amount: amt,
          taxRate: rate,
          taxAmount: Number((amt * rate / (100 + rate)).toFixed(2)),
          buyerOrSeller: sup.name,
          status: Random.pick(["已收到", "已收到", "未收到"]),
          remark: "",
        });
      }
      return out;
    })(),
    status,
    items,
    totalAmount: total,
    paid: status === "received" ? Random.integer(0, total) : 0,
    createdAt: Random.date("yyyy-MM-dd"),
    expectedAt: Random.date("yyyy-MM-dd"),
    remark: "",
  };
});

// ---------- Supplier contacts ----------
export const supplierContacts: SupplierContact[] = [];
suppliers.forEach((s, si) => {
  const n = Random.integer(1, 3);
  for (let i = 0; i < n; i++) {
    supplierContacts.push({
      id: `sc-${si}-${i}`,
      code: `GLXR-${pad(20001 + supplierContacts.length)}`,
      supplierId: s.id,
      supplierName: s.name,
      name: i === 0 ? s.contact : Random.cname(),
      phone: i === 0 ? s.phone : Mock.mock(/^1[3-9]\d{9}$/),
      position: i === 0 ? (s.contactPosition || "销售经理") : Random.pick(["销售经理", "客户经理", "技术支持", "商务经理", "财务对接"]),
      email: Random.email(),
      wechat: Mock.mock(/[a-z0-9_]{6,12}/),
      isPrimary: i === 0,
      remark: "",
      createdAt: Random.date("yyyy-MM-dd"),
    });
  }
});

// ---------- Contracts ----------
export const contracts: Contract[] = Array.from({ length: 30 }).map((_, i) => {
  const cus = Random.pick(customers.filter((c) => c.stage === "formal"));
  const status = Random.pick(["draft", "active", "active", "active", "completed"]) as Contract["status"];
  return {
    id: `ct${i + 1}`,
    code: `CN-2024-${pad(501 + i)}`,
    customerId: cus.id,
    customerName: cus.name,
    title: Random.pick(["年度系统服务合同", "硬件采购合同", "软件实施合同", "运维服务合同", "定制开发合同"]),
    status,
    amount: Random.integer(50000, 1500000),
    signedAt: Random.date("yyyy-MM-dd"),
    startAt: Random.date("yyyy-MM-dd"),
    endAt: Random.date("yyyy-MM-dd"),
    ownerId: cus.ownerId,
    remark: Random.csentence(6, 15),
  };
});

// ---------- Sales orders ----------
const salesContractTitlePool = ["年度系统服务合同", "工控设备销售合同", "MES 项目实施合同", "运维服务合同", "定制开发合同"];
export const salesOrders: SalesOrder[] = Array.from({ length: 40 }).map((_, i) => {
  const cus = Random.pick(customers.filter((c) => c.stage === "formal"));
  const items = Array.from({ length: Random.integer(1, 4) }).map(() => {
    const prod = Random.pick(products);
    const qty = Random.integer(1, 10);
    return { productId: prod.id, productName: prod.name, qty, price: prod.price };
  });
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);
  const status = Random.pick(["pending", "shipped", "delivered", "delivered"]) as SalesOrder["status"];
  const received = status === "delivered" ? Random.pick([total, total, Math.floor(total * 0.5), 0]) : 0;
  const applicant = Random.pick(employees.filter((e) => e.role !== "管理员"));
  const account = Random.pick(["u3", "u4", "u5"]);
  const assistants = Random.shuffle(["u3", "u4", "u5"].filter((b) => b !== account)).slice(0, Random.integer(0, 2));
  return {
    id: `so${i + 1}`,
    code: `XSHT${Mock.mock(/[0-9]{8}/)}MA`,
    customerId: cus.id,
    customerName: cus.name,
    contractTitle: Random.pick(salesContractTitlePool),
    contractExpireDate: Random.date("yyyy-MM-dd"),
    contractAmount: total,
    salesMode: Random.pick(["普通销售", "渠道销售", "项目销售", "服务销售"]) as any,
    contractProperty: Random.pick(["新签", "新签", "续签", "升级", "补充"]) as any,
    taxNo: cus.taxNo,
    applicantId: applicant.id,
    department: Random.pick(["销售一部", "销售二部", "大客户部", "项目部"]),
    appliedAt: Random.date("yyyy-MM-dd"),
    signedAt: Random.date("yyyy-MM-dd"),
    contractExpireAt: Random.date("yyyy-MM-dd"),
    accountManagerId: account,
    assistantIds: assistants,
    isSettled: Random.boolean(),
    isPartyA: Random.boolean(),
    serviceFee: Random.integer(0, 20000),
    outsourceFee: Random.integer(0, 15000),
    salesFee: Random.integer(0, 10000),
    productStdCost: Math.floor(total * 0.6),
    contractAttachments: [`销售合同_${cus.name}.pdf`],
    stampedContractAttachments: [],
    licenseAttachments: [],
    invoiceAttachments: [],
    otherAttachments: [],
    invoices: (() => {
      if (status === "pending") return [];
      const n = Random.integer(0, 3);
      const out: InvoiceRecord[] = [];
      let remain = total;
      for (let k = 0; k < n; k++) {
        const rate = Random.pick([6, 9, 13]);
        const amt = k === n - 1 ? remain : Math.floor(remain / (n - k));
        if (amt <= 0) break;
        remain -= amt;
        out.push({
          id: `sinv-${i}-${k}`,
          invoiceNo: "24" + Mock.mock(/[0-9]{8}/),
          invoiceType: Random.pick(["增值税专用发票", "增值税普通发票", "电子专用发票"]),
          invoiceDate: Random.date("yyyy-MM-dd"),
          amount: amt,
          taxRate: rate,
          taxAmount: Number((amt * rate / (100 + rate)).toFixed(2)),
          buyerOrSeller: cus.name,
          status: Random.pick(["已开具", "已开具", "待开具"]),
          remark: "",
        });
      }
      return out;
    })(),
    contractId: Random.pick([undefined, ...contracts.map((c) => c.id).slice(0, 5)]),
    status,
    items,
    totalAmount: total,
    received,
    ownerId: cus.ownerId,
    createdAt: Random.date("yyyy-MM-dd"),
    deliveredAt: status === "delivered" ? Random.date("yyyy-MM-dd") : undefined,
    remark: "",
  };
});

// ---------- Payments ----------
export const payments: Payment[] = [
  ...salesOrders
    .filter((s) => s.received > 0)
    .map((s, i) => ({
      id: `pay-in-${i}`,
      code: `RC-${pad(7001 + i)}`,
      direction: "in" as const,
      refType: "sales" as const,
      refId: s.id,
      refCode: s.code,
      partyName: s.customerName,
      amount: s.received,
      method: Random.pick(["对公转账", "支票", "支付宝"]) as Payment["method"],
      paidAt: s.deliveredAt || todayStr(),
      remark: "",
    })),
  ...purchases
    .filter((p) => p.paid > 0)
    .map((p, i) => ({
      id: `pay-out-${i}`,
      code: `PY-${pad(8001 + i)}`,
      direction: "out" as const,
      refType: "purchase" as const,
      refId: p.id,
      refCode: p.code,
      partyName: p.supplierName,
      amount: p.paid,
      method: Random.pick(["对公转账", "支票"]) as Payment["method"],
      paidAt: p.createdAt,
      remark: "",
    })),
];

// ---------- Contacts ----------
const positionPool = ["采购经理", "信息总监", "技术总监", "总经理", "财务主管", "项目经理", "运维主管", "副总经理"];
export const contacts: Contact[] = [];
customers.forEach((c, ci) => {
  const n = Random.integer(1, 4);
  for (let i = 0; i < n; i++) {
    contacts.push({
      id: `ct-${ci}-${i}`,
      code: `LXR-${pad(9001 + contacts.length)}`,
      customerId: c.id,
      customerName: c.name,
      name: i === 0 ? c.contact : Random.cname(),
      phone: i === 0 ? c.phone : Mock.mock(/^1[3-9]\d{9}$/),
      position: Random.pick(positionPool),
      email: i === 0 ? c.email : Random.email(),
      address: c.address,
      birthday: Random.date("yyyy-MM-dd"),
      ownerId: c.ownerId,
      isPrimary: i === 0,
      remark: "",
      attachment: "",
      createdAt: Random.date("yyyy-MM-dd"),
    });
  }
});

// ---------- Follow-ups ----------
const subjectPool = ["首次电话沟通", "需求调研", "产品演示", "方案讲解", "报价沟通", "合同细节确认", "售后回访", "项目进度跟进"];
const contactWayPool = ["电话", "拜访", "微信", "邮件", "短信", "其他"] as const;
const oppStatusPool = ["意向初探", "需求确认", "方案沟通", "报价中", "商务谈判", "已签约", "已流失"] as const;
const intentProductPool = ["MES 制造执行系统", "WMS 仓储管理系统", "ERP 一体化系统", "BI 平台", "工控机 IPC-7200", "PDA-V3", "运维服务"];
const salesLeadPool = ["官网注册", "电话咨询", "展会扫码", "客户介绍", "广告投放", "陌拜"];

export const followUps: FollowUp[] = [];
customers.forEach((c, ci) => {
  const n = Random.integer(0, 3);
  const cContacts = contacts.filter((x) => x.customerId === c.id);
  for (let i = 0; i < n; i++) {
    const ct = cContacts.length ? Random.pick(cContacts) : undefined;
    followUps.push({
      id: `fu-${ci}-${i}`,
      code: `GJ-${pad(10001 + followUps.length)}`,
      customerId: c.id,
      customerName: c.name,
      customerStatus: c.status,
      contactId: ct?.id,
      contactName: ct?.name,
      ownerId: c.ownerId,
      subject: Random.pick(subjectPool),
      content: Random.cparagraph(1, 3),
      contactWay: Random.pick(contactWayPool as any) as any,
      salesLead: Random.pick(salesLeadPool),
      oppStatus: Random.pick(oppStatusPool as any) as any,
      contactDate: Random.date("yyyy-MM-dd"),
      nextVisitAt: Random.date("yyyy-MM-dd"),
      intentProduct: Random.pick(intentProductPool),
      expectedAmount: Random.integer(10000, 800000),
      expectedSignAt: Random.date("yyyy-MM-dd"),
      attachment: "",
      remark: "",
      createdAt: Random.date("yyyy-MM-dd"),
    });
  }
});

// ---------- Stock logs ----------
import type { StockLog } from "@/types";
export const stockLogs: StockLog[] = products.map((p, i) => ({
  id: `sl-init-${i}`,
  productId: p.id,
  productName: p.name,
  action: "create",
  delta: p.stock,
  beforeStock: 0,
  afterStock: p.stock,
  refType: "manual",
  operator: "系统初始化",
  remark: "初始化导入库存",
  createdAt: todayStr(),
}));
