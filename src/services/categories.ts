// 统一的「产品分类」注册表：产品库存可手动增删，供应商/采购明细/销售明细全部从这里取分类。
// 数据持久化到 localStorage。其它模块通过 useCategories 订阅变更。

import { useEffect, useState, useSyncExternalStore } from "react";

export interface CategoryItem {
  id: string;     // 与 Product.category 兼容（保持 software/ipc/pda… 等原有 id）
  label: string;  // 显示名称
}

const STORAGE_KEY = "app.product.categories.v1";

// 原产品分类（id 保持不变，便于与 mock 数据兼容；biz 规则 category==='software' 也保持有效）
const PRODUCT_SEEDS: CategoryItem[] = [
  { id: "software", label: "软件" },
  { id: "ipc",      label: "工控机" },
  { id: "pda",      label: "PDA" },
  { id: "mouse",    label: "鼠标" },
  { id: "cable",    label: "线缆" },
  { id: "power",    label: "电源" },
  { id: "other",    label: "其他" },
];

// 供应商历史使用的「中文分类标签」→ 统一 id 的映射，融合现有数据
export const supplierCategoryAlias: Record<string, string> = {
  "软件": "software",
  "工控机": "ipc",
  "外设": "mouse",   // 外设并入「鼠标/外设」
  "鼠标": "mouse",
  "PDA": "pda",
  "线缆": "cable",
  "电源": "power",
  "综合": "other",
  "其他": "other",
  "服务": "service",
};

// 供应商曾用过、但产品分类里不存在的，补充进来
const SUPPLIER_EXTRA_SEEDS: CategoryItem[] = [
  { id: "service", label: "服务" },
];

function load(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...PRODUCT_SEEDS, ...SUPPLIER_EXTRA_SEEDS];
    const parsed = JSON.parse(raw) as CategoryItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...PRODUCT_SEEDS, ...SUPPLIER_EXTRA_SEEDS];
    return parsed;
  } catch {
    return [...PRODUCT_SEEDS, ...SUPPLIER_EXTRA_SEEDS];
  }
}

let cache: CategoryItem[] = load();
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach((l) => l());
}

export const categoryStore = {
  getAll(): CategoryItem[] {
    return cache;
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  add(label: string): CategoryItem | null {
    const trimmed = label.trim();
    if (!trimmed) return null;
    if (cache.some((c) => c.label === trimmed)) return null;
    // 生成稳定 id：英文/数字 → slug；中文 → cat_时间戳
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    let id = slug || `cat_${Date.now().toString(36)}`;
    if (cache.some((c) => c.id === id)) id = `${id}_${Date.now().toString(36).slice(-4)}`;
    const item = { id, label: trimmed };
    cache = [...cache, item];
    persist();
    return item;
  },
  remove(id: string): boolean {
    // 保护核心 id（与 mock / 业务规则强耦合）
    const PROTECTED = new Set(["software"]);
    if (PROTECTED.has(id)) return false;
    const next = cache.filter((c) => c.id !== id);
    if (next.length === cache.length) return false;
    cache = next;
    persist();
    return true;
  },
  rename(id: string, label: string): boolean {
    const trimmed = label.trim();
    if (!trimmed) return false;
    const idx = cache.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    cache = cache.map((c, i) => (i === idx ? { ...c, label: trimmed } : c));
    persist();
    return true;
  },
  /** 兼容旧值：传入 id 或中文标签，返回当前显示名 */
  labelOf(value: string | undefined | null): string {
    if (!value) return "—";
    const hit = cache.find((c) => c.id === value);
    if (hit) return hit.label;
    // 旧数据：直接是中文标签
    const aliasId = supplierCategoryAlias[value];
    if (aliasId) {
      const a = cache.find((c) => c.id === aliasId);
      if (a) return a.label;
    }
    return value;
  },
  /** 把任意值（旧的中文标签或 id）规范化为 id；找不到则返回原值 */
  normalize(value: string | undefined | null): string {
    if (!value) return "";
    if (cache.some((c) => c.id === value)) return value;
    const aliasId = supplierCategoryAlias[value];
    if (aliasId && cache.some((c) => c.id === aliasId)) return aliasId;
    return value;
  },
};

export function useCategories(): CategoryItem[] {
  return useSyncExternalStore(
    (cb) => categoryStore.subscribe(cb),
    () => categoryStore.getAll(),
    () => categoryStore.getAll(),
  );
}

/** 便捷：仅在挂载时取一次（非响应式场景） */
export function getCategoryLabel(value: string | undefined | null): string {
  return categoryStore.labelOf(value);
}
