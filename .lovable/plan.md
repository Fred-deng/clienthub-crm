
# 移动端 UI 显示问题全面审查

通过 iPhone 14 Pro 视口（390×844）对 12 个移动端页面进行实测截图，发现以下显示问题：

## 🔴 必须修复的遮挡问题

### 1. 列表卡片右下角操作图标被 FAB 按钮遮挡
**触发页面**：MSales、MPurchases、MPayments、MCustomers（含选择圆圈）、MFollowUps、MContacts、MProducts、MReceivables、MPayables
- 现象：卡片底部一行的"登记付款/发票/日志/删除"4 个 IconBtn 被右下角红色 FAB（"+ 新建/登记付款"）覆盖；客户卡片的右上选择圆圈也被遮挡
- 根因：FAB 定位 `bottom-20 right-4`，列表 `MList` 仅有 `pb-4`，最后一张卡片的右下区域必落在 FAB 圆角范围内
- 修复：`MList` 增加底部内边距 `pb-32`（约 128px），让最后几行卡片高过 FAB 区域；同时 FAB 与卡片 z 层级保持

### 2. 顶部 KPI 卡片被吸顶 Header 遮挡
**触发页面**：MReceivables、MPayables、MCustomers、MPayments
- 现象：滚动后或首屏，"合同总额/已开票"等 KPI 上半截被 `MPageHeader` 吸顶遮挡，看到的是"…73.5 万"截断字
- 根因：MPageHeader 是 `sticky top-12 z-20`，KPI 区在它正下方但 Header 透明背景透出错位；`MReceivables/MPayables/MPayments` 的 `<MPageHeader>` 无 sticky 关闭参数
- 修复：将 KPI 密集页面的 MPageHeader 设为 `sticky={false}`（与 MReconciliation 一致），或给 KPI 容器加 `relative z-0`

### 3. MProducts 分类筛选 chip 行最右侧被截断
- 现象："线缆" chip 右侧贴边；MChipFilter 容器是 `overflow-x-auto` 但视觉上看不到滚动提示
- 修复：MChipFilter 的滚动容器右侧加 `pr-4` 让最后一项有呼吸空间

## 🟡 体验改善项

### 4. MPayments 顶部 KPI 在 360px 屏仍可能换行折叠
- 截图显示"¥327.4万 / ¥31.5万 / ¥295.7万"已经折成两行
- 修复：KPI 卡片 padding 从 `p-3.5` 减为 `px-3 py-2.5`，字号从 `text-xl` 改为 `text-lg`

### 5. CustomerStats 移动端 chip 区第二行第一颗"全部 48"在 KPI 收起时贴住 Header
- 修复：CustomerStats `mobile` 变体顶部加 `pt-1`

### 6. MFab 标签"+ 新建"在某些页面（如 MPayables）实际是"登记付款"，宽度 `px-5` 在小屏占比偏大
- 修复：FAB 改为 `px-4` + 文字 `text-[13px]`

### 7. 卡片底部操作行被 FAB 遮挡时"删除"危险动作可能误触 FAB
- 修复：列表底部增加"已到底"占位（同 #1），并保证 IconBtn 行与 FAB 不重叠

## 变更清单

| 文件 | 改动 |
|---|---|
| `src/mobile/components/MUI.tsx` | `MList` 默认 `pb-32`；`MChipFilter` 容器右侧 `pr-4`；`MFab` padding/字号收紧；`MKpi` 紧凑化 |
| `src/mobile/pages/MReceivables.tsx` | `MPageHeader` 加 `sticky={false}` |
| `src/mobile/pages/MPayables.tsx` | `MPageHeader` 加 `sticky={false}` |
| `src/mobile/pages/MPayments.tsx` | `MPageHeader` 加 `sticky={false}`；KPI grid 加 `min-w-0` |
| `src/mobile/pages/MCustomers.tsx` | `MPageHeader` 加 `sticky={false}` |
| `src/components/common/CustomerStats.tsx` | mobile 变体顶部 padding 增加 |

预计 6 个文件、~10 处改动。
