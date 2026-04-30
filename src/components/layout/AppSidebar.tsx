import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText, Receipt, Wallet, Truck, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "控制面板", url: "/", icon: LayoutDashboard, dot: "tomato" },
  { title: "客户管理", url: "/customers", icon: Users, dot: "mustard" },
  { title: "产品库存", url: "/products", icon: Package, dot: "mint" },
  { title: "供应商", url: "/suppliers", icon: Truck, dot: "cobalt" },
  { title: "采购管理", url: "/purchases", icon: ShoppingCart, dot: "mustard" },
  { title: "合同管理", url: "/contracts", icon: FileText, dot: "tomato" },
  { title: "销售订单", url: "/sales", icon: Receipt, dot: "mint" },
  { title: "财务收支", url: "/payments", icon: Wallet, dot: "cobalt" },
  { title: "数据报表", url: "/reports", icon: BarChart3, dot: "mustard" },
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

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-7 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-tomato flex items-center justify-center font-display font-black text-primary-foreground text-2xl -rotate-6 shadow-[4px_4px_0_0_hsl(var(--cobalt))]">
            墨
          </div>
          <div className="font-display font-bold text-2xl tracking-tight leading-none">
            墨印<span className="text-tomato">.</span>
            <div className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-muted-foreground mt-1">CRM Suite</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        "rounded-xl h-10 px-3 transition-all hover:bg-sidebar-accent " +
                        (active ? "bg-sidebar-accent font-bold text-foreground shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)]" : "text-foreground/60 hover:text-foreground font-medium")
                      }
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <span
                          className={
                            "size-2 rounded-full transition-transform shrink-0 " +
                            dotMap[item.dot] +
                            (active ? " scale-150" : "")
                          }
                        />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5">
        <div className="rounded-3xl p-5 bg-cobalt text-secondary-foreground flex flex-col gap-3">
          <div className="text-[10px] opacity-80 font-bold tracking-[0.2em] uppercase">月度对账提醒</div>
          <div className="font-display italic text-base leading-snug">
            “本月还有 <span className="text-mustard not-italic font-bold">12</span> 笔账单待核对”
          </div>
          <button className="py-2.5 rounded-2xl bg-mustard text-foreground font-bold text-sm hover:-translate-y-0.5 transition-transform">
            前往核对
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
