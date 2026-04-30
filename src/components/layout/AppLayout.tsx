import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, Bell, Command } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("zh-CN", { hour12: false });
  const date = now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
  const hour = now.getHours();
  const greet = hour < 6 ? "夜深了" : hour < 12 ? "早安" : hour < 18 ? "下午好" : "晚上好";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative riso-grain">
        <div className="memphis-blob-mustard" />
        <div className="memphis-blob-mint" />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-16 flex items-center justify-between px-8 lg:px-10 shrink-0 border-b border-foreground/[0.06]">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-foreground/55 hover:text-foreground rounded-lg" />
              <div className="hidden md:flex items-center gap-2.5 rounded-full bg-card/70 backdrop-blur border border-foreground/10 px-4 h-10 w-72 lg:w-[380px] focus-within:border-foreground/30 focus-within:bg-card transition-all">
                <Search className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
                <input
                  type="text"
                  placeholder="搜索客户、合同、订单..."
                  className="bg-transparent outline-none text-sm flex-1 placeholder:text-foreground/35"
                />
                <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-foreground/40 font-mono bg-foreground/5 px-1.5 py-0.5 rounded border border-foreground/10">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end leading-tight">
                <span className="text-[10px] text-foreground/45 font-mono uppercase tracking-wider">{date}</span>
                <span className="text-xs font-mono tabular-nums text-foreground/75 font-semibold">{time}</span>
              </div>
              <div className="h-7 w-px bg-foreground/10 hidden lg:block" />
              <button className="relative size-9 rounded-full hover:bg-card border border-transparent hover:border-foreground/10 flex items-center justify-center text-foreground/55 hover:text-foreground transition-all">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-tomato" />
              </button>
              <div className="flex items-center gap-2.5 pl-1">
                <div className="hidden xl:flex flex-col items-end leading-tight">
                  <span className="text-[10px] text-foreground/45">{greet}</span>
                  <span className="text-xs font-bold">陈雨晴</span>
                </div>
                <div className="size-9 rounded-full bg-gradient-to-br from-mustard to-[hsl(32_72%_50%)] flex items-center justify-center font-display font-black text-foreground text-sm ring-2 ring-card shadow-sm">
                  陈
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="px-8 lg:px-12 pb-16 max-w-[1600px] mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
