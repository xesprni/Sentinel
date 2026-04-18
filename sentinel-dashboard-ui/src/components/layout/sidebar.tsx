import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useApps } from "@/hooks/use-apps";
import { cn } from "@/lib/utils";
import {
  Home, ShieldOff, FlaskConical, Cpu, UserCheck, Flame,
  BarChart3, GitFork, Server, Settings2,
  Network, Webhook, Route, X, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

const normalMenuItems: MenuItem[] = [
  { path: "/dashboard/home/:app", label: "首页", icon: Home, group: "概览" },
  { path: "/dashboard/flow/:app", label: "流控规则", icon: ShieldOff, group: "规则管理" },
  { path: "/dashboard/v2/flow/:app", label: "流控规则 (推送)", icon: ShieldOff, group: "规则管理" },
  { path: "/dashboard/degrade/:app", label: "熔断规则", icon: FlaskConical, group: "规则管理" },
  { path: "/dashboard/system/:app", label: "系统规则", icon: Cpu, group: "规则管理" },
  { path: "/dashboard/authority/:app", label: "授权规则", icon: UserCheck, group: "规则管理" },
  { path: "/dashboard/paramFlow/:app", label: "热点规则", icon: Flame, group: "规则管理" },
  { path: "/dashboard/metric/:app", label: "实时监控", icon: BarChart3, group: "监控" },
  { path: "/dashboard/identity/:app", label: "簇点链路", icon: GitFork, group: "监控" },
  { path: "/dashboard/app/:app", label: "机器列表", icon: Server, group: "监控" },
  { path: "/dashboard/cluster/server/:app", label: "集群 Server", icon: Server, group: "集群" },
  { path: "/dashboard/cluster/client/:app", label: "集群 Client", icon: Network, group: "集群" },
  { path: "/dashboard/cluster/assign_manage/:app", label: "集群分配", icon: Settings2, group: "集群" },
  { path: "/dashboard/cluster/single/:app", label: "集群单机配置", icon: Network, group: "集群" },
];

const gatewayMenuItems: MenuItem[] = [
  { path: "/dashboard/gateway/identity/:app", label: "网关请求链路", icon: Webhook, group: "网关" },
  { path: "/dashboard/gateway/api/:app", label: "API 管理", icon: Route, group: "网关" },
  { path: "/dashboard/gateway/flow/:app", label: "网关流控规则", icon: ShieldOff, group: "网关" },
  { path: "/dashboard/metric/:app", label: "实时监控", icon: BarChart3, group: "监控" },
  { path: "/dashboard/system/:app", label: "系统规则", icon: Cpu, group: "规则管理" },
  { path: "/dashboard/degrade/:app", label: "熔断规则", icon: FlaskConical, group: "规则管理" },
];

function groupMenuItems(items: MenuItem[]) {
  const groups: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const key = item.group || "其他";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

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
  const grouped = groupMenuItems(menuItems);

  const resolvePath = (path: string) => path.replace(":app", selectedApp || "");

  if (collapsed) {
    return null;
  }

  return (
    <aside className="w-64 border-r bg-sidebar-background text-sidebar-foreground flex flex-col h-full">
      {/* App search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索应用..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm pl-8"
          />
        </div>
      </div>

      {/* App list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {filteredApps.map((app) => {
            const healthy = (app.machines || []).some((m) => m.healthy);
            const isActive = selectedApp === app.app;
            return (
              <Link
                key={app.app}
                to={`/dashboard/home/${app.app}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-sidebar-accent transition-colors",
                  isActive && "bg-sidebar-accent font-medium",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", healthy ? "bg-emerald-500" : "bg-gray-300")} />
                <span className="truncate flex-1">{app.app}</span>
                {app.appType === 1 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">网关</Badge>
                )}
                {isActive && (
                  <Link to="/dashboard/home" onClick={(e) => e.stopPropagation()} className="shrink-0 hover:bg-sidebar-accent rounded-sm p-0.5">
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Link>
                )}
              </Link>
            );
          })}
          {filteredApps.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">暂无应用</p>
          )}
        </div>
      </ScrollArea>

      {/* Menu */}
      {selectedApp && menuItems.length > 0 && (
        <ScrollArea className="border-t max-h-[45vh]">
          <div className="p-2">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">{group}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const resolvedPath = resolvePath(item.path);
                    const isActive = location.pathname === resolvedPath;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={resolvedPath}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          isActive
                            ? "font-medium"
                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        )}
                        style={isActive ? { backgroundColor: "var(--sentinel-primary-light)", color: "var(--sentinel-primary)" } : undefined}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
