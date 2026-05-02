// 通用 CSV 导出工具（支持中文 / Excel）
export type CsvColumn<T> = {
  header: string;
  /** 取值函数；返回 string | number | undefined */
  value: (row: T) => string | number | undefined | null;
};

function escapeCell(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(",")).join("\n");
  // BOM for Excel UTF-8 兼容
  const csv = "\uFEFF" + head + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
