
# 移动端 vs PC 端 全面校验报告

已逐页对比 12 个移动端页面（M*）与对应 PC 页面的筛选项、显示字段、操作能力。

## 一、筛选完全一致 ✅（无需改动）

| 页面 | 已对齐项 |
|---|---|
| MDashboard | BizTabs（全部/软件/硬件） |
| MProducts | 关键词、分类 chip、低库存切换 |
| MCustomers | 关键词、状态、公海/私海（CustomerStats 已支持点击） |
| MSuppliers | 关键词搜索（PC 端也仅此一项） |
| MSales | 关键词（合同号/客户/明细产品）、状态 chip、日期、业务 chip |
| MPurchases | 关键词（单号/供应商/合同名）、状态、日期、业务 chip |
| MReceivables / MPayables | 业务 chip、状态 chip、关键词、日期 |
| MReconciliation | 应收/应付切换、状态 chip、关键词 |

## 二、需要改善的问题清单

### 1. MPayments（财务收支）— 显示溢出 + 缺详情入口
- **问题 A**：KPI 用 `fmtMoney` 显示完整金额，3 列 grid 在 360px 屏会溢出/截断
- **问题 B**：流水卡片无任何点击响应，无法查看完整备注、金额拆分（PC 端有 Toast 详情）
- **修复**：
  - KPI 与副标题改用 `fmtMoneyShort`
  - 卡片 onClick 打开"收支详情" Sheet：基本信息 + 软硬件金额拆分

### 2. MFollowUps / MContacts — 客户筛选体验差
- **问题**：客户筛选用原生 `<select>`，长公司名在 `max-w-[40vw]` 内被截断；客户多时无法搜索
- **修复**：新增通用组件 `MPickerChip`（底部抽屉 + 搜索框 + 列表），替换原生 select；支持按客户名/编号搜索

### 3. 通用组件补充
- 在 `src/mobile/components/MUI.tsx` 新增 `MPickerChip`，可复用到未来其他长列表筛选场景

## 三、按用户先前确认保持现状的项

- MReceivables / MPayables / MReconciliation **不补加 CSV 导出**（PC 端也未提供）
- MSuppliers **不补加导出按钮**

## 四、技术变更明细

| 文件 | 修改 |
|---|---|
| `src/mobile/components/MUI.tsx` | + `MPickerChip` 组件（抽屉式可搜索选择器） |
| `src/mobile/pages/MPayments.tsx` | KPI/Header 改 `fmtMoneyShort`；新增 `viewing` 状态与详情 Sheet；卡片 onClick |
| `src/mobile/pages/MFollowUps.tsx` | 客户原生 select → `MPickerChip` |
| `src/mobile/pages/MContacts.tsx` | 客户原生 select → `MPickerChip` |

## 五、不在本次范围

- 移动端表单字段（新增/编辑 Sheet）已与 PC 1:1 对齐，本轮不做改动
- 批量操作（MCustomers 转公海/私海、MSales/MPurchases 批量改状态）已对齐
