// 集中类型定义，方便后端对接

export type CustomerType = "software" | "hardware";
export type CustomerStage = "lead" | "formal"; // 潜在 / 正式
export type CustomerLevel = "A" | "B" | "C";

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  stage: CustomerStage;
  level: CustomerLevel;
  contact: string;
  phone: string;
  email: string;
  industry: string;
  address: string;
  ownerId: string; // 销售员
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
