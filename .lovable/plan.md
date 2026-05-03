
# 移动端数据逻辑全面校验报告

已系统对比 12 个移动端页面与 PC 端的数据获取、聚合公式、关联表合并、过滤逻辑。

## ✅ 数据逻辑完全一致（11 个页面）

| 页面 | 已核对的关键逻辑 |
|---|---|
| MDashboard | 单一 `statsApi.dashboard()` 数据源，BizFilter 切换字段 |
| MProducts | 低库存判定 `stock <= safetyStock && category !== "software"` |
| MCustomers | `deriveCustomerStage(status)` 同步 stage、批量改状态联动 |
| MSuppliers | 分类 normalize、应付聚合 `payByS` |
| MContacts / MFollowUps | 按 customerId 预过滤 + 客户端搜索 |
| MSales / MPurchases | `splitSales/splitPurchase` biz 拆分、`contractAmount ?? totalAmount` 回退 |
| MPayments | `splitPayment + matchFilter` 与 PC 同公式 |
| MReceivables | 按 customer 聚合、`oldest = min(createdAt)`、aging 计算、客户 level 联表 |
| MPayables | 按 supplier 聚合、`category` 联表、aging |

## 🟡 需要修复的问题（仅 1 处）

### MReconciliation — 切换"应收/应付"tab 时未清空登记付款 Sheet 状态
**现象**：用户在"应收"tab 打开某客户的"登记回款"Sheet 后未提交，直接切换到"应付"，`pay` state 仍指向应收 Row，UI 显示与 tab 不匹配。

**修复**：在两个 tab 切换按钮的 onClick 中追加 `setPay(null)`。

```tsx
<button onClick={() => { setTab("in"); setPay(null); }} ...>
<button onClick={() => { setTab("out"); setPay(null); }} ...>
```

## ℹ️ 设计上一致、非 bug 的项（不修）

| 现象 | 说明 |
|---|---|
| MReceivables/MPayables 显示订单上的客户名/供应商名快照 | PC 端同样：业务历史保留原则，改名不回溯 |
| MSales/MPurchases 卡片大数字显示 `totalAmount` 而非 `contractAmount` | PC 列表同字段；已付/未付才用 contractAmount |
| MReconciliation KPI 不受"仅未结清/搜索"影响、只受日期影响 | `all` 已应用日期过滤，与 PC `kpiSource = all.filter(inRange)` 同源 |
| MProducts 低库存判定用 raw category key | PC 同逻辑；自定义新分类也会进入低库存判定 |
| MFollowUps/MContacts 切客户重新 fetch | PC 用 usePagedList 同样触发重新加载 |
| MPayments totals 受 biz/方向/日期/搜索全部影响 | PC 同源 `enriched` |

## 变更清单

| 文件 | 改动 |
|---|---|
| `src/mobile/pages/MReconciliation.tsx` | tab 切换按钮 onClick 追加 `setPay(null)`（2 处） |

仅 1 行级别的微改，预计 1 个工具调用完成。
