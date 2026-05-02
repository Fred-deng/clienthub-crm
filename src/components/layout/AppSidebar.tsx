import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText, Receipt, Wallet, Truck, BarChart3, Contact as ContactIcon, ClipboardList, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { salesApi, purchaseApi } from "@/services/api";

const groups = [
  {
    label: "工作台",
    items: [
      { title: "控制面板", url: "/", icon: LayoutDashboard, dot: "tomato" },
    ],
  },
  {
    label: "业务",
    items: [
      { title: "客户管理", url: "/customers", icon: Users, dot: "mustard" },
      { title: "客户联系人", url: "/contacts", icon: ContactIcon, dot: "tomato" },
      { title: "跟进记录", url: "/follow-ups", icon: ClipboardList, dot: "mustard" },
      { title: "产品库存", url: "/products", icon: Package, dot: "mint" },
      { title: "供应商", url: "/suppliers", icon: Truck, dot: "cobalt" },
    ],
  },
  {
    label: "交易",
    items: [
      { title: "采购订单", url: "/purchases", icon: ShoppingCart, dot: "mustard" },
      { title: "销售订单", url: "/sales", icon: Receipt, dot: "mint" },
      { title: "财务收支", url: "/payments", icon: Wallet, dot: "cobalt" },
    ],
  },
  {
    label: "账款",
    items: [
      { title: "应收账款", url: "/receivables", icon: ArrowDownLeft, dot: "tomato" },
      { title: "应付账款", url: "/payables", icon: ArrowUpRight, dot: "cobalt" },
    ],
  },
  {
    label: "分析",
    items: [
      { title: "数据报表", url: "/reports", icon: BarChart3, dot: "mustard" },
    ],
  },
];

const dotMap: Record<string, string> = {
  tomato: "bg-tomato",
  mustard: "bg-mustard",
  mint: "bg-mint",
  cobalt: "bg-cobalt",
};

export function AppSidebar() {
  const { pathname } = useLocation();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const [pending, setPending] = useState(0);
  useEffect(() => {
    Promise.all([salesApi.all(), purchaseApi.all()]).then(([sales, purs]) => {
      const a = sales.filter((o) => o.status !== "cancelled" && (o.contractAmount ?? o.totalAmount) - (o.received || 0) > 0).length;
      const b = purs.filter((o) => o.status !== "cancelled" && o.status !== "draft" && (o.contractAmount || o.totalAmount) - (o.paid || 0) > 0).length;
      setPending(a + b);
    });
  }, [pathname]);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="size-10 rounded-xl bg-foreground flex items-stretch justify-center font-display font-black overflow-hidden shadow-[2px_2px_0_0_hsl(var(--tomato))]">
              <span className="flex-1 flex items-center justify-center text-[15px] leading-none bg-tomato text-[hsl(var(--paper))]">J</span>
              <span className="flex-1 flex items-center justify-center text-[15px] leading-none text-mustard">M</span>
            </div>
            <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full bg-mint ring-2 ring-sidebar" />
          </div>
          <div className="leading-none min-w-0">
            <div className="font-display font-bold text-[17px] tracking-tight whitespace-nowrap">
              集马<span className="text-tomato">·</span>科技
            </div>
            <div className="text-[9px] font-mono font-medium tracking-[0.28em] uppercase text-foreground/45 mt-1.5">
              JM · CRM 2026
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 mt-2">
        {groups.map((g) => (
          <SidebarGroup key={g.label} className="mb-1">
            <div className="px-3 pt-3 pb-1.5 text-[9px] font-bold tracking-[0.3em] uppercase text-foreground/35 font-mono">
              · {g.label}
            </div>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={
                          "rounded-xl h-9 px-3 transition-all " +
                          (active
                            ? "bg-card font-bold text-foreground shadow-[2px_2px_0_0_hsl(var(--foreground)/0.08)] border border-foreground/8"
                            : "text-foreground/55 hover:text-foreground hover:bg-card/60 font-medium")
                        }
                      >
                        <NavLink to={item.url} className="flex items-center gap-3">
                          <span
                            className={
                              "size-1.5 rounded-full transition-all shrink-0 " +
                              dotMap[item.dot] +
                              (active ? " ring-4 ring-current/0 scale-150" : " opacity-70")
                            }
                          />
                          <span className="text-[13px] tracking-tight">{item.title}</span>
                          {active && (
                            <span className="ml-auto font-mono text-[9px] text-foreground/40">
                              ●
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="relative rounded-2xl p-5 bg-cobalt text-secondary-foreground flex flex-col gap-3 overflow-hidden">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-mustard/15 blur-2xl" />
          <div className="absolute -left-6 -bottom-6 size-20 rounded-full bg-tomato/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[9px] opacity-80 font-bold tracking-[0.28em] uppercase relative">
            <span className="size-1 rounded-full bg-mint" />
            账款核对
          </div>
          <div className="font-display italic text-[14px] leading-snug relative opacity-95">
            还有 <span className="text-mustard not-italic font-bold">{pending}</span> 笔账款待结清
          </div>
          <button className="py-2 rounded-full bg-[hsl(var(--paper))] text-foreground font-bold text-[11px] hover:bg-mustard transition-colors relative tracking-wide">
            前往核对 →
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
