import { useRef, useState } from "react";
import { Plus, FileText, Trash2, Upload, Link2, Image as ImageIcon, FileArchive, FileSpreadsheet, FileType2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 通用「附件」组件（多附件 + 上传前/后两态）。
// - 单值模式：传入 string + onSingleChange
// - 多值模式：传入 string[] + onChange
//
// 设计：上传前显示一块虚线 dropzone（提示「点击或拖入」），
// 上传后变为卡片列表（图标 + 文件名 + 操作）。

interface BaseProps {
  label?: string;
  hint?: string;
  accept?: string;
  className?: string;
}

interface MultiProps extends BaseProps {
  value: string[];
  onChange: (v: string[]) => void;
}

interface SingleProps extends BaseProps {
  singleValue: string;
  onSingleChange: (v: string) => void;
}

type Props = MultiProps | SingleProps;

const isSingle = (p: Props): p is SingleProps => "onSingleChange" in p;

const fileIconFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return ImageIcon;
  if (["zip", "rar", "7z"].includes(ext)) return FileArchive;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return FileType2;
  return FileText;
};

export function AttachmentField(props: Props) {
  const items: string[] = isSingle(props) ? (props.singleValue ? [props.singleValue] : []) : (props.value || []);
  const [draft, setDraft] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setItems = (next: string[]) => {
    if (isSingle(props)) {
      props.onSingleChange(next[0] ?? "");
    } else {
      props.onChange(next);
    }
  };

  const append = (name: string) => {
    const v = name.trim();
    if (!v) return;
    if (isSingle(props)) setItems([v]);
    else setItems([...(props.value || []), v]);
  };

  const removeAt = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => append(f.name));
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitLink = () => {
    if (!draft.trim()) return;
    append(draft);
    setDraft("");
    setLinkOpen(false);
  };

  const empty = items.length === 0;

  return (
    <div className={"space-y-2 " + (props.className || "")}>
      {/* 上传前：dropzone */}
      {empty && !linkOpen && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setHover(true); }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setHover(false);
            onPickFiles(e.dataTransfer.files);
          }}
          className={
            "group relative rounded-xl border-2 border-dashed transition-all cursor-pointer px-4 py-5 flex flex-col items-center justify-center text-center " +
            (hover
              ? "border-tomato bg-tomato/5"
              : "border-foreground/15 bg-foreground/[0.02] hover:border-foreground/30 hover:bg-foreground/[0.04]")
          }
        >
          <div className="size-10 rounded-full bg-foreground/[0.06] group-hover:bg-foreground/10 flex items-center justify-center mb-2 transition-colors">
            <Upload className="h-4 w-4 text-foreground/55" />
          </div>
          <div className="text-[12px] font-semibold text-foreground/75">点击或拖入文件上传</div>
          <div className="text-[10px] text-foreground/45 mt-0.5">
            {props.hint || "支持 PDF / Word / Excel / 图片 / 压缩包"}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLinkOpen(true); }}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cobalt hover:underline"
          >
            <Link2 className="h-3 w-3" /> 或粘贴链接
          </button>
        </div>
      )}

      {/* 链接输入 */}
      {empty && linkOpen && (
        <div className="flex gap-2 items-center">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="附件链接或文件名"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submitLink(); }
              if (e.key === "Escape") { setLinkOpen(false); setDraft(""); }
            }}
          />
          <Button type="button" size="sm" onClick={submitLink}>确定</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setLinkOpen(false); setDraft(""); }}>取消</Button>
        </div>
      )}

      {/* 上传后：文件卡片列表 */}
      {!empty && (
        <div className="space-y-1.5">
          {items.map((f, i) => {
            const Icon = fileIconFor(f);
            return (
              <div
                key={i}
                className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-card border border-foreground/10 hover:border-foreground/25 transition-colors"
              >
                <div className="size-8 rounded-md bg-cobalt/10 text-cobalt flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-foreground truncate">{f}</div>
                  <div className="text-[10px] text-foreground/45 mono uppercase tracking-wide">已上传</div>
                </div>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity size-7 rounded-md hover:bg-tomato/10 text-foreground/45 hover:text-tomato inline-flex items-center justify-center"
                  onClick={() => removeAt(i)}
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {!isSingle(props) && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-foreground/15 hover:border-foreground/35 hover:bg-foreground/[0.03] text-[11px] text-foreground/55 hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" /> 继续添加
            </button>
          )}
          {isSingle(props) && (
            <button
              type="button"
              onClick={() => { setItems([]); fileRef.current?.click(); }}
              className="text-[10px] text-foreground/50 hover:text-cobalt"
            >
              重新选择
            </button>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple={!isSingle(props)}
        accept={props.accept}
        className="hidden"
        onChange={(e) => onPickFiles(e.target.files)}
      />
    </div>
  );
}
