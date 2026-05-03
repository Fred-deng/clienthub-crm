import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, ShoppingCart, Wallet, Menu as MenuIcon,
  UserSquare2, MessageSquareText, Package, Truck, FileBox,
  ArrowDownToLine, ArrowUpFromLine, Scale, X, ChevronRight, ChevronDown, Bell, Receipt,
} from "lucide-react";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { cn } from "@/lib/utils";

// 与 PC 端菜单顺序一致：仪表盘 / 客户 / 销售 / 收支 / 更多
const tabs = [
  { to: "/m", label: "仪表盘", icon: LayoutDashboard, end: true },
  { to: "/m/customers", label: "客户", icon: Users },
  { to: "/m/sales", label: "销售", icon: Receipt },
  { to: "/m/payments", label: "收支", icon: Wallet },
];

// 抽屉菜单 — 完全按照 PC 端 AppSidebar 的分组与顺序
const drawerItems = [
  { group: "工作台", items: [
    { to: "/m", label: "控制面板", icon: LayoutDashboard, end: true },
  ]},
  { group: "业务", items: [
    { to: "/m/customers", label: "客户管理", icon: Users },
    { to: "/m/contacts", label: "客户联系人", icon: UserSquare2 },
    { to: "/m/follow-ups", label: "跟进记录", icon: MessageSquareText },
    { to: "/m/products", label: "产品库存", icon: Package },
    { to: "/m/suppliers", label: "供应商", icon: Truck },
  ]},
  { group: "交易", items: [
    { to: "/m/purchases", label: "采购订单", icon: FileBox },
    { to: "/m/sales", label: "销售订单", icon: Receipt },
    { to: "/m/payments", label: "财务收支", icon: Wallet },
  ]},
  { group: "账款", items: [
    { to: "/m/receivables", label: "应收账款", icon: ArrowDownToLine },
    { to: "/m/payables", label: "应付账款", icon: ArrowUpFromLine },
    { to: "/m/reconciliation", label: "账款核对", icon: Scale },
  ]},
];

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { current, all, setCurrent } = useCurrentUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("jm.mdrawer.collapsedGroups") || "{}"); } catch { return {}; }
  });
  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem("jm.mdrawer.collapsedGroups", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-foreground/40 z-50 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[80%] max-w-[340px] bg-card z-50 shadow-2xl transition-transform overflow-y-auto",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-gradient-to-br from-mustard to-tomato flex items-center justify-center font-display font-black text-foreground">
              {current.name.slice(0, 1)}
            </div>
            <div>
              <div className="font-bold text-sm">{current.name}</div>
              <div className="text-[11px] text-foreground/55">{current.role}</div>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full hover:bg-foreground/5 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 border-b border-foreground/10">
          <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/45 mb-2 px-2">切换操作人</div>
          <div className="flex flex-wrap gap-1.5">
            {all.map((e) => (
              <button
                key={e.id}
                onClick={() => setCurrent(e.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border",
                  e.id === current.id
                    ? "bg-foreground text-[hsl(var(--paper))] border-foreground"
                    : "border-foreground/15 text-foreground/70"
                )}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
        <nav className="p-2">
          {drawerItems.map((g) => (
            <div key={g.group} className="mb-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/45 px-3 py-2">· {g.group}</div>
              {g.items.map((it) => {
                const active = it.end ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
                return (
                  <button
                    key={it.to}
                    onClick={() => { nav(it.to); onClose(); }}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                      active ? "bg-foreground text-[hsl(var(--paper))]" : "hover:bg-foreground/5")}
                  >
                    <it.icon className={cn("h-4 w-4", active ? "text-[hsl(var(--paper))]" : "text-foreground/55")} />
                    <span className="flex-1 text-sm">{it.label}</span>
                    <ChevronRight className={cn("h-4 w-4", active ? "text-[hsl(var(--paper))]/60" : "text-foreground/30")} />
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default function MobileLayout() {
  const [drawer, setDrawer] = useState(false);
  const loc = useLocation();
  // 详情/编辑由 Sheet 承担，移动页本身保持单层；底部 nav 始终显示。
  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="h-12 flex items-center justify-between px-4 border-b border-foreground/10 bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-foreground flex items-stretch overflow-hidden">
            <span className="flex-1 flex items-center justify-center text-[10px] font-display font-black bg-tomato text-[hsl(var(--paper))]">J</span>
            <span className="flex-1 flex items-center justify-center text-[10px] font-display font-black text-mustard">M</span>
          </div>
          <span className="font-display font-bold text-[14px]">集马<span className="text-tomato">·</span>科技</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="size-9 rounded-full hover:bg-foreground/5 flex items-center justify-center">
            <Bell className="h-4 w-4 text-foreground/65" />
          </button>
          <button onClick={() => setDrawer(true)} className="size-9 rounded-full hover:bg-foreground/5 flex items-center justify-center">
            <MenuIcon className="h-4 w-4 text-foreground/75" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-foreground/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5 h-14">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "h-full flex flex-col items-center justify-center gap-0.5 text-[10px]",
                    isActive ? "text-tomato" : "text-foreground/55"
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              onClick={() => setDrawer(true)}
              className="h-full w-full flex flex-col items-center justify-center gap-0.5 text-[10px] text-foreground/55"
            >
              <MenuIcon className="h-[18px] w-[18px]" />
              <span>更多</span>
            </button>
          </li>
        </ul>
      </nav>

      <Drawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}
