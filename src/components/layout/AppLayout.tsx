import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export default function AppLayout() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("zh-CN", { hour12: false });
  const date = now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-accent pulse-dot" />
                <span className="text-muted-foreground font-mono uppercase tracking-wider">System Online</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <span className="text-muted-foreground">{date}</span>
              <span className="font-mono tabular-nums text-foreground">{time} <span className="text-muted-foreground">CST</span></span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto grid-bg">
            <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
