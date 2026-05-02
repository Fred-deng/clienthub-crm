// 集中类型定义，方便后端对接

// —— 发票记录（采购/销售子表共用） ——
export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceType: string;
  invoiceDate: string;
  amount: number;
  taxRate: number;
  taxAmount?: number;
  buyerOrSeller?: string;
  status?: string;
  attachment?: string;
  remark?: string;
}

export type CustomerStage = "lead" | "formal"; // 潜在 / 正式
export type CustomerLevel = "A" | "B" | "C";
// 客户状态（已整合：合并原「合作状态/阶段」为统一生命周期）
export type CustomerStatus = "potential" | "intent" | "active" | "paused" | "inactive" | "lost";
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

// —— 客户联系人 ——
export interface Contact {
  id: string;
  code: string;            // 联系人编号
  customerId: string;      // 所属客户
  customerName: string;    // 客户名称（冗余便于展示）
  name: string;            // 联系人姓名
  phone: string;           // 手机号
  position?: string;       // 职位
  email?: string;
  address?: string;
  birthday?: string;
  ownerId: string;         // 销售负责人
  isPrimary: boolean;      // 首要联系人
  remark?: string;
  attachment?: string;
  createdAt: string;
}

// —— 客户跟进记录 ——
export type FollowUpContactWay = "电话" | "拜访" | "微信" | "邮件" | "短信" | "其他";
export type FollowUpOppStatus = "意向初探" | "需求确认" | "方案沟通" | "报价中" | "商务谈判" | "已签约" | "已流失";

export interface FollowUp {
  id: string;
  code: string;             // 跟进记录编号
  customerId: string;       // 关联客户
  customerName: string;
  customerStatus?: string;  // 客户状态（冗余）
  contactId?: string;       // 关联联系人
  contactName?: string;
  ownerId: string;          // 负责人
  subject: string;          // 主题
  content: string;          // 跟进记录内容
  contactWay: FollowUpContactWay; // 联系形式
  salesLead?: string;       // 销售线索
  oppStatus?: FollowUpOppStatus; // 商机状态
  contactDate: string;      // 联系日期
  nextVisitAt?: string;     // 下次回访日期
  intentProduct?: string;   // 意向产品
  expectedAmount?: number;  // 预计金额
  expectedSignAt?: string;  // 预计签单时间
  attachment?: string;
  remark?: string;
  createdAt: string;
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
  // —— 企业档案 ——
  code: string;
  name: string;
  taxNo?: string;

  // —— 联系人信息（默认主联系人） ——
  contact: string;
  phone: string;
  contactPosition?: string;
  secondaryContact?: string;
  secondaryContactPhone?: string;

  // —— 地址信息 ——
  address?: string;
  addressDetail?: string;

  // —— 采购归属 ——
  buyerId?: string;
  assistantIds?: string[];

  // —— 银行账户 ——
  bankAccountName?: string;
  bankName?: string;
  bankAccountNo?: string;

  // —— 备注与附件 ——
  remark?: string;
  attachment?: string;

  // —— 业务字段 ——
  category: string;
  payable: number;
  createdAt: string;
}

// —— 供应商联系人（子表） ——
export interface SupplierContact {
  id: string;
  code: string;
  supplierId: string;
  supplierName: string;
  name: string;          // 姓名
  phone: string;         // 电话
  position?: string;     // 职务
  email?: string;
  wechat?: string;
  isPrimary: boolean;    // 主联系人
  remark?: string;
  createdAt: string;
}

export type PurchaseStatus = "draft" | "ordered" | "received" | "cancelled";
export interface PurchaseItem {
  productId: string;       // 若为新建产品，可在保存时回填
  productName: string;
  category?: ProductCategory;
  qty: number;
  price: number;
}
export interface PurchaseOrder {
  id: string;
  code: string;                 // 采购订单号

  // —— 申请信息 ——
  applicantId: string;          // 申请人
  department?: string;          // 所属部门
  appliedAt: string;            // 申请日期

  // —— 合同与签约 ——
  supplierId: string;           // 供应商
  supplierName: string;
  contractTitle?: string;       // 合同名称
  signingParty?: string;        // 签约单位（我方主体）
  signedAt?: string;            // 签订日期
  contractExpireAt?: string;    // 合同到期日
  contractAmount?: number;      // 合同金额
  linkedSalesContract?: boolean;// 是否关联销售合同
  linkedSalesContractId?: string;

  // —— 采购执行 ——
  buyerId?: string;             // 采购经理

  // —— 附件 ——
  contractAttachments?: string[];
  invoiceAttachments?: string[];

  // —— 发票管理（子表，供应商开给我方） ——
  invoices?: InvoiceRecord[];

  // —— 业务字段 ——
  status: PurchaseStatus;
  items: PurchaseItem[];
  totalAmount: number;          // 明细合计
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
export type SalesContractProperty = "新签" | "续签" | "升级" | "补充" | "其他";
export type SalesMode = "普通销售" | "渠道销售" | "项目销售" | "服务销售";
export interface SalesItem {
  productId: string;
  productName: string;
  category?: ProductCategory;
  qty: number;
  price: number;
}
export interface SalesOrder {
  id: string;
  // —— 基础信息 ——
  code: string;                       // 合同编号
  customerId: string;
  customerName: string;
  contractTitle?: string;             // 合同名称
  contractExpireDate?: string;        // 合同到期日期(基础区)
  contractAmount?: number;            // 合同金额
  salesMode?: SalesMode;              // 销售方式
  contractProperty?: SalesContractProperty; // 合同属性
  taxNo?: string;                     // 统一社会信用代码

  // —— 申请与组织 ——
  applicantId?: string;               // 申请人
  department?: string;                // 所属部门
  appliedAt?: string;                 // 申请日期

  // —— 签约与结算 ——
  signedAt?: string;                  // 合同签订日
  contractExpireAt?: string;          // 合同到期日
  accountManagerId?: string;          // 客户经理
  assistantIds?: string[];            // 协助人
  isSettled?: boolean;                // 是否结算
  isPartyA?: boolean;                 // 是否甲方

  // —— 费用信息 ——
  serviceFee?: number;                // 约定服务费
  outsourceFee?: number;              // 外包费用
  salesFee?: number;                  // 销售费用
  productStdCost?: number;            // 产品标准成本

  // —— 附件与备注 ——
  contractAttachments?: string[];     // 合同附件
  stampedContractAttachments?: string[]; // 双方盖章合同扫描件
  licenseAttachments?: string[];      // 营业执照
  invoiceAttachments?: string[];      // 开票资料
  otherAttachments?: string[];        // 其他附件

  // —— 发票管理（子表，我方开给客户） ——
  invoices?: InvoiceRecord[];

  // —— 业务字段（保留） ——
  contractId?: string;
  status: SalesStatus;
  items: SalesItem[];
  totalAmount: number;                // 明细合计
  received: number;                   // 已回款
  ownerId: string;
  createdAt: string;                  // 下单日 / 创建日
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

// —— 库存变动日志 ——
export type StockLogAction = "create" | "update" | "delete" | "in" | "out" | "adjust";
export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  action: StockLogAction;     // create=新建产品 update=信息修改 delete=删除 in=入库 out=出库 adjust=手工调整
  delta: number;              // 数量变化（正/负，0 表示非数量变更）
  beforeStock: number;
  afterStock: number;
  refType?: "purchase" | "sales" | "manual";
  refId?: string;
  refCode?: string;
  operator?: string;
  remark?: string;
  createdAt: string;
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
