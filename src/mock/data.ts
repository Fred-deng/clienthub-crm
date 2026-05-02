// Mock 数据生成，使用 mockjs。所有数据在内存中，提供 CRUD 能力。
import Mock from "mockjs";
import type {
  Customer, Product, Supplier, PurchaseOrder, Contract, SalesOrder, Payment, Employee, Contact,
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
  const type = Random.pick(["software", "hardware"]) as Customer["type"];
  const stage = Random.pick(["lead", "lead", "formal", "formal", "formal"]) as Customer["stage"];
  const name = (Random as any).cnCompany();
  return {
    id: `c${i + 1}`,
    code: `CUS-${pad(1001 + i)}`,
    name,
    taxNo: "91" + Mock.mock(/[0-9A-Z]{16}/),
    type,
    status: Random.pick(["active", "active", "potential", "inactive", "lost"]) as Customer["status"],
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
export const suppliers: Supplier[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `s${i + 1}`,
  code: `SUP-${pad(3001 + i)}`,
  name: Random.pick(["深圳华研电子", "东莞精工科技", "广州智控", "苏州博远工控", "上海联讯"]) + " #" + (i + 1),
  contact: Random.cname(),
  phone: Mock.mock(/^1[3-9]\d{9}$/),
  category: Random.pick(["工控机", "外设", "线缆", "电源", "综合"]),
  payable: Random.integer(0, 150000),
  createdAt: Random.date("yyyy-MM-dd"),
}));

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
  return {
    id: `po${i + 1}`,
    code: `PO-2024-${pad(101 + i)}`,
    supplierId: sup.id,
    supplierName: sup.name,
    status,
    items,
    totalAmount: total,
    paid: status === "received" ? Random.integer(0, total) : 0,
    createdAt: Random.date("yyyy-MM-dd"),
    expectedAt: Random.date("yyyy-MM-dd"),
    remark: "",
  };
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
  return {
    id: `so${i + 1}`,
    code: `SO-2024-${pad(801 + i)}`,
    customerId: cus.id,
    customerName: cus.name,
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
