import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileSidebarOpen((value) => !value);
    } else {
      setSidebarCollapsed((value) => !value);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden">
      {mobileSidebarOpen && <button type="button" aria-label="关闭侧边栏" className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setMobileSidebarOpen(false)} />}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-hidden bg-background transition-all duration-200 md:relative md:z-auto",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "md:w-0 md:-translate-x-full" : "md:w-64 md:translate-x-0",
        )}
      >
        <Sidebar collapsed={false} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={toggleSidebar} collapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
