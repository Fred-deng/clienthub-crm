// 集中类型定义，方便后端对接

export type CustomerType = "software" | "hardware";
export type CustomerStage = "lead" | "formal"; // 潜在 / 正式
export type CustomerLevel = "A" | "B" | "C";
export type CustomerStatus = "active" | "inactive" | "potential" | "lost"; // 客户状态
export type CompanyNature = "国企" | "民营" | "外资" | "合资" | "上市公司" | "事业单位" | "其他";
export type CooperationStatus = "未合作" | "意向中" | "合作中" | "已暂停" | "已终止";
export type CustomerCategory = "战略客户" | "重点客户" | "普通客户" | "潜在客户";
export type CustomerSource = "电话开发" | "网络推广" | "客户介绍" | "展会" | "陌拜" | "其他";
export type SeaStatus = "私海" | "公海";

export interface Customer {
  id: string;
  // —— 基础信息 ——
  code: string;          // 客户编号
  name: string;          // 客户全称
  taxNo?: string;        // 税号
  type: CustomerType;    // 客户类型
  status?: CustomerStatus; // 客户状态
  region?: string;       // 归属区域

  // —— 联系信息 ——
  contact: string;       // 联系人
  phone: string;
  email: string;
  registeredAddress?: string; // 注册地址
  businessScope?: string;     // 经营范围
  address: string;            // 通讯地址(保留)

  // —— 工商信息 ——
  legalPerson?: string;       // 法定代表人
  companyNature?: CompanyNature;
  industry: string;           // 所属行业
  registeredAt?: string;      // 注册时间
  registeredCapital?: number; // 注册资金（万元）
  paidInCapital?: number;     // 实缴资金（万元）
  scale?: string;             // 客户规模
  insuredCount?: number;      // 参保人数

  // —— 合作信息 ——
  firstCooperationAt?: string;  // 首次合作时间
  cooperationStatus?: CooperationStatus;
  cooperationProducts?: string; // 合作产品/服务
  ownerId: string;              // 销售负责人

  // —— 客户管理 ——
  category?: CustomerCategory;  // 客户类别
  source?: CustomerSource;      // 客户来源
  seaStatus?: SeaStatus;        // 公海状态
  lastVisitAt?: string;         // 最近拜访时间
  nextVisitAt?: string;         // 下次拜访日期

  // —— 其他信息 ——
  invoiceInfo?: string;         // 开票信息
  introducer?: string;          // 介绍人

  // —— 业务字段（保留） ——
  stage: CustomerStage;
  level: CustomerLevel;
  totalAmount: number;
  receivable: number;
  createdAt: string;
  remark?: string;
}

export type ProductCategory = "software" | "ipc" | "pda" | "mouse" | "cable" | "power" | "other";

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  safetyStock: number;
  supplierId?: string;
  spec?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact: string;
  phone: string;
  category: string;
  payable: number;
  createdAt: string;
}

export type PurchaseStatus = "draft" | "ordered" | "received" | "cancelled";
export interface PurchaseItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}
export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  totalAmount: number;
  paid: number;
  createdAt: string;
  expectedAt: string;
  remark?: string;
}

export type ContractStatus = "draft" | "active" | "completed" | "terminated";
export interface Contract {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  title: string;
  status: ContractStatus;
  amount: number;
  signedAt: string;
  startAt: string;
  endAt: string;
  ownerId: string;
  remark?: string;
}

export type SalesStatus = "pending" | "shipped" | "delivered" | "cancelled";
export interface SalesItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}
export interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  contractId?: string;
  status: SalesStatus;
  items: SalesItem[];
  totalAmount: number;
  received: number; // 已回款
  ownerId: string;
  createdAt: string;
  deliveredAt?: string;
  remark?: string;
}

export type PaymentDirection = "in" | "out"; // in=回款 out=付供应商
export interface Payment {
  id: string;
  code: string;
  direction: PaymentDirection;
  refType: "sales" | "purchase";
  refId: string;
  refCode: string;
  partyName: string;
  amount: number;
  method: "对公转账" | "现金" | "支票" | "支付宝" | "微信";
  paidAt: string;
  remark?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: "销售" | "销售总监" | "管理员";
  phone: string;
  email: string;
}

export interface Paged<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  [key: string]: any;
}
