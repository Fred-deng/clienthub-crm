import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("zh-CN", { hour12: false });
  const date = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative riso-grain">
        <div className="memphis-blob-mustard" />
        <div className="memphis-blob-mint" />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-20 flex items-center justify-between px-8 lg:px-12 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground/60 hover:text-foreground" />
              <div className="hidden md:flex items-center gap-2.5 rounded-full bg-card border-2 border-foreground/10 px-5 h-11 w-72 lg:w-96 focus-within:border-tomato transition-colors">
                <Search className="h-4 w-4 text-foreground/40 shrink-0" />
                <input
                  type="text"
                  placeholder="搜索客户、合同、订单..."
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-xs text-foreground/60 font-medium">{date}</span>
                <span className="text-xs font-mono tabular-nums text-foreground/80">{time}</span>
              </div>
              <div className="size-11 rounded-full bg-mustard border-2 border-foreground flex items-center justify-center font-display font-black text-foreground -rotate-3">
                陈
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="px-8 lg:px-12 pb-12 max-w-[1600px] mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
