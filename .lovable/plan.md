# 数据逻辑与显示合理性 · 全面审计

我把全部 14 个页面、6 个服务和关键公共组件都过了一遍，按"严重→中→轻"分级列出**仍存在的问题**。用户已确认大部分流程没问题，下面这些是**剩余值得修复**的。

---

## 一、严重（数据正确性 / 会误导业务）

### 1. 采购订单"草稿"状态不应记入应付，但报表把它算进去了
- `Payables.tsx`、`Suppliers.tsx`、`Sidebar 待核对账单`、`statsApi.payable` 都用 `contractAmount - paid` 一刀切计算应付。
- 草稿（draft）和已取消（cancelled）的订单也被计入"未付"，导致：
  - 应付账款看板虚高
  - 供应商列表"应付"列、Sidebar"待核对账单"数字偏大
- **修：聚合时过滤掉 `status ∈ {draft, cancelled}`**（销售侧同理过滤 `cancelled`）。

### 2. 销售合同列表"合同金额 = 明细合计"已强绑定，原"合同金额"输入名存实亡
- `Sales.tsx onSubmit` 写入时 `contractAmount = totalAmount`，但表单还保留 `contractAmount` 字段定义，`Receivables` 又优先用 `contractAmount`，没人能再独立修改它。
- **修二选一**：
  - A. 删除合同金额字段（最简单，与现状一致）
  - B. 还原一个"合同金额"输入框，只在留空时回退为明细合计

### 3. 库存调整在"已送达/已入库"状态下，行内日志和实际扣减口径不同
- `Sales.tsx` / `Purchases.tsx` 在状态保持 `delivered/received` 时执行 "revert + reapply"，但 **revert 用的是 editing（旧明细），reapply 用的是 payload（新明细）**。如果中途用户**取消**，前端只把 reapply 写完，再点一次又会被 revert 一次，导致重复扣减。  
  实际：因为 `await purchaseApi.update` 在中间，库存是同步内存，不会等待 await 但仍然顺序执行——目前看安全。**但订单删除路径只判断 `order.status === "delivered"` 是否为撤销条件，未处理"未保存的删除场景"**。轻微问题，留意。
- **修**：把扣减/回滚封装为单一事务函数 `syncStockOnSave(prev, next)`，避免散落分支。

### 4. 销售订单状态可以编辑，**但客户经理变更不会更新销售业绩归属**
- Dashboard / 报表"销售员业绩"按 `o.ownerId` 聚合。
- 表单里改 `accountManagerId` 时联动写了 `ownerId`（line 390），但**协助人/历史快照不会回写**，老订单的 ownerId 不会自动迁移。属于产品决策，**需确认：客户经理变更是否要影响历史业绩归属？**

---

## 二、中（显示不准 / 体验问题）

### 5. Dashboard "本月销售总额" 软硬件拆分用的是按比例分摊，可能与真实合计不符
- `splitSales` 用「明细金额比例 × contractAmount」拆分，对纯软件/纯硬件准确，但如果 `contractAmount ≠ items 合计` 且**舍入有差**，软件+硬件 ≠ 总额（已用 `Math.round` 缓解，但报表与详情可能差 1 分）。
- **修**：在 KPI hint 中直接展示 `软+硬 = 总额`，或在 `splitOrderAmounts` 兜底校验。

### 6. 应收 / 应付页"账龄(天)" 起算日选择不一致
- 应收用 `signedAt ?? createdAt`
- 应付用 `appliedAt || createdAt`
- 二者口径不一致；同一笔订单换边看就变了。**修：统一为"签约/下单的较早者"，或都以 `createdAt`**。

### 7. 应收账款的"已开票"列**未按 biz tab 拆分**
- `Receivables.tsx` 切换"软件/硬件"时，contract / received 都跟着切，但 `invoiced` 字段始终是全订单的发票总额，导致**软件 tab 下"已开票 > 合同金额"看起来异常**。
- **修**：发票按软硬件比例拆，或在非 all tab 下隐藏发票列。

### 8. 财务收支 tfoot 的"回款合计 / 付款合计"用的是 `enriched`（已按 biz 过滤后的当前页），与 KPI 卡口径一致 ✅，但 tfoot 文案 `本页 X 笔 / 共 Y 笔` 中的 Y 仍是后端原始 `data.total`（未经 biz 过滤），切到"软件"会出现"本页 3 笔 / 共 30 笔"严重不对应。  
- **修**：tfoot 显示 `本页 X 笔（共 Y 笔，按业务过滤已展示 Z 笔）`。

### 9. Sales 列表 tfoot colSpan 漏算"业务/属性"列
- `Sales.tsx:310` `<td colSpan={6}>` 之后是 合同金额/已回款/已开票，再 `colSpan={3}`。表头一共 12 列；6+1+1+1+3 = 12 ✅。  
- 但 **"已开票"对应的 `<td className="num text-cobalt">` 与表头"已开票"列对得上，可"客户经理 / 签订日 / 操作"被合并为 colSpan=3**——客户经理与签订日没有对应的合计单元格，列底部空白看着乱。  
- **修**：tfoot 增加客户经理处空白 td，签订日处显示最早签约日，提升可读性。

### 10. 客户管理"客户列表"表头有"应收"列 → 已动态聚合 ✅，但**`customer.totalAmount` / `customer.receivable` 字段在 `mock/data.ts` 仍是随机值**，新增客户时默认 0，存在但不再使用。
- **修**：从 `Customer` 类型移除 `totalAmount` / `receivable`（防止其他地方误用），或在 mock 初始化时清零。

### 11. 跟进记录列表搜索字段不全
- `followUpApi` 的 `searchFields` 包含 `subject/content`，但**不含 `oppStatus` / `salesLead` / `intentProduct`**。常见需求是按"意向产品"搜索，找不到。
- **修**：扩充 `searchFields`。

---

## 三、轻（体验细节）

### 12. Sidebar"待核对账单"文案叫"本月还有 X 笔"，实际算的是**全部未结清订单**（不带月份过滤）
- 与 Dashboard "本月销售" 月度口径不一致，文案误导。
- **修**：要么改文案为"待结清账单"，要么真的按本月过滤。

### 13. 产品库存"低库存"判断对软件类不友好
- 列表过滤 `low = stock <= safetyStock && category !== "software"`，但**新增/编辑产品的安全库存默认 10**，给软件分类创建产品时安全库存 10 没意义。
- **修**：表单中切到 software 时安全库存禁用并清零。

### 14. 操作日志 `items` 子表 diff 仅比较 `productName×qty`，不含价格变化
- 如果用户只改单价，订单操作日志不会记录（明细子表日志能查到，但订单总日志看不出来）。
- **修**：diff 描述加上"明细变更：单价/分类调整"标识，或附 totalAmount 变更行。

---

## 修复路线建议（按价值排序）

```text
P0 修严重数据：
  1) Payables/Sidebar/Receivables/statsApi 全部按状态过滤草稿/取消
  2) 决定合同金额字段去留（建议：删除该输入，确认列名"合同金额"对应明细合计）
  3) 库存联动函数封装 syncStockOnSave(prev,next)

P1 修显示不准：
  4) 应收/应付账龄起算日统一
  5) 应收发票按 biz 拆分（或非 all tab 隐藏列）
  6) 财务收支 tfoot 文案修正
  7) Sales tfoot colSpan 调整

P2 体验优化：
  8) Sidebar 待核对文案 / 范围统一
  9) 跟进记录搜索扩字段
 10) 软件分类安全库存禁用
 11) 客户经理变更归属决策（需你确认）
 12) 订单总日志补价格变更
 13) 移除 customer.totalAmount/receivable 残留字段
```

---

## 需要你拍板的两件事
- **A. 合同金额是否独立于明细？**（销售/采购）
  - 选保留独立 → 我恢复输入框，列表分别显示"合同金额"与"明细合计"
  - 选去掉 → 我删除字段，统一用明细合计
- **B. 修改客户经理是否要把历史订单 ownerId 一并迁移？**
  - 是 → 切换时弹确认"将 N 笔旧订单一并改为新经理"
  - 否 → 保持现状（历史订单业绩归属不变）

确认后我按 P0→P2 顺序一次性修复。
