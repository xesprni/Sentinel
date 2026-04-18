import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useApps } from "@/hooks/use-apps";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
}

const normalMenuItems = [
  { path: "/dashboard/home", label: "首页" },
  { path: "/dashboard/flow/:app", label: "流控规则", v2: false },
  { path: "/dashboard/v2/flow/:app", label: "流控规则 (推送)", v2: true },
  { path: "/dashboard/degrade/:app", label: "熔断规则" },
  { path: "/dashboard/system/:app", label: "系统规则" },
  { path: "/dashboard/authority/:app", label: "授权规则" },
  { path: "/dashboard/paramFlow/:app", label: "热点规则" },
  { path: "/dashboard/cluster/server/:app", label: "集群 Server 列表" },
  { path: "/dashboard/cluster/client/:app", label: "集群 Client 列表" },
  { path: "/dashboard/cluster/assign_manage/:app", label: "集群分配管理" },
  { path: "/dashboard/cluster/single/:app", label: "集群单机配置" },
  { path: "/dashboard/metric/:app", label: "实时监控" },
  { path: "/dashboard/identity/:app", label: "簇点链路" },
  { path: "/dashboard/app/:app", label: "机器列表" },
];

const gatewayMenuItems = [
  { path: "/dashboard/gateway/identity/:app", label: "网关请求链路" },
  { path: "/dashboard/gateway/api/:app", label: "API 管理" },
  { path: "/dashboard/gateway/flow/:app", label: "网关流控规则" },
  { path: "/dashboard/metric/:app", label: "实时监控" },
  { path: "/dashboard/system/:app", label: "系统规则" },
  { path: "/dashboard/degrade/:app", label: "熔断规则" },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const { data: apps } = useApps();
  const { app: selectedApp } = useParams();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const filteredApps = (apps || []).filter((a) =>
    a.app.toLowerCase().includes(search.toLowerCase()),
  );

  const currentApp = apps?.find((a) => a.app === selectedApp);
  const isGateway = currentApp?.appType === 1;
  const menuItems = selectedApp ? (isGateway ? gatewayMenuItems : normalMenuItems) : [];

  const resolvePath = (path: string) => path.replace(":app", selectedApp || "");

  if (collapsed) {
    return null;
  }

  return (
    <aside className="w-64 border-r bg-sidebar-background text-sidebar-foreground flex flex-col h-full">
      <div className="p-3 border-b">
        <h2 className="text-sm font-semibold mb-2">应用列表</h2>
        <Input
          placeholder="搜索应用..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filteredApps.map((app) => (
            <Link
              key={app.app}
              to={`/dashboard/home?app=${app.app}`}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 rounded-md text-sm hover:bg-sidebar-accent transition-colors",
                selectedApp === app.app && "bg-sidebar-accent font-medium",
              )}
            >
              <span className="truncate">{app.app}</span>
              {app.appType === 1 && (
                <Badge variant="secondary" className="text-xs ml-1 shrink-0">网关</Badge>
              )}
            </Link>
          ))}
        </div>
      </ScrollArea>
      {selectedApp && menuItems.length > 0 && (
        <div className="border-t p-2">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-1">菜单</h3>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const resolvedPath = resolvePath(item.path);
              const isActive = location.pathname === resolvedPath;
              return (
                <Link
                  key={item.path}
                  to={resolvedPath}
                  className={cn(
                    "block px-3 py-1.5 rounded-md text-sm hover:bg-sidebar-accent transition-colors",
                    isActive && "bg-sidebar-accent font-medium text-sidebar-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
