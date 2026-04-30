import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText, Receipt, Wallet, Truck, BarChart3,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const coreItems = [
  { title: "控制面板", url: "/", icon: LayoutDashboard },
  { title: "客户管理", url: "/customers", icon: Users },
  { title: "产品库存", url: "/products", icon: Package },
  { title: "供应商", url: "/suppliers", icon: Truck },
];

const bizItems = [
  { title: "采购管理", url: "/purchases", icon: ShoppingCart },
  { title: "合同管理", url: "/contracts", icon: FileText },
  { title: "销售订单", url: "/sales", icon: Receipt },
];

const finItems = [
  { title: "财务收支", url: "/payments", icon: Wallet },
  { title: "数据报表", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderGroup = (label: string, items: typeof coreItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={
                    active
                      ? "bg-primary/10 text-primary border-l-2 border-primary rounded-none font-medium"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent rounded-none"
                  }
                >
                  <NavLink to={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary flex items-center justify-center shrink-0">
            <div className="size-3 border-2 border-primary-foreground rotate-45" />
          </div>
          <div className="font-bold text-lg tracking-tight text-foreground">
            OPTIC<span className="text-primary">CRM</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {renderGroup("核心模块", coreItems)}
        {renderGroup("业务流程", bizItems)}
        {renderGroup("财务分析", finItems)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 bg-sidebar-accent/50 border border-sidebar-border">
          <div className="size-8 bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">陈</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-foreground truncate">陈立新</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase">ADMIN · OL</div>
          </div>
          <div className="size-2 rounded-full bg-accent pulse-dot" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
