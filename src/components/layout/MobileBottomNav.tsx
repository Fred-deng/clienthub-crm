// 移动端底部 5 项 Tab 导航；其余菜单走顶部 SidebarTrigger（抽屉）
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, Wallet, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "看板", icon: LayoutDashboard, exact: true },
  { to: "/customers", label: "客户", icon: Users },
  { to: "/sales", label: "销售", icon: Receipt },
  { to: "/reconciliation", label: "账款", icon: Wallet },
];

export function MobileBottomNav() {
  const { toggleSidebar } = useSidebar();
  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-card/95 backdrop-blur border-t border-foreground/10",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <ul className="grid grid-cols-5 h-14">
        {tabs.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  "h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-tomato"
                    : "text-foreground/55 hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("h-[18px] w-[18px]", isActive && "stroke-[2.4]")} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-foreground/55 hover:text-foreground"
            aria-label="更多菜单"
          >
            <Menu className="h-[18px] w-[18px]" />
            <span>更多</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
