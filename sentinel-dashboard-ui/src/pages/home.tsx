import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getMachines } from "@/api/app";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ShieldOff, FlaskConical, Cpu, UserCheck, Flame,
  BarChart3, GitFork, Server,
  Route, Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApps } from "@/hooks/use-apps";

interface MenuCard {
  label: string;
  path: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

const normalMenuCards: MenuCard[] = [
  { label: "流控规则", path: "/dashboard/flow", desc: "配置流量控制规则", icon: ShieldOff, color: "text-blue-500" },
  { label: "流控规则 (推送)", path: "/dashboard/v2/flow", desc: "配置流控规则 (动态推送)", icon: ShieldOff, color: "text-blue-400" },
  { label: "熔断规则", path: "/dashboard/degrade", desc: "配置熔断降级规则", icon: FlaskConical, color: "text-orange-500" },
  { label: "系统规则", path: "/dashboard/system", desc: "配置系统保护规则", icon: Cpu, color: "text-purple-500" },
  { label: "授权规则", path: "/dashboard/authority", desc: "配置黑白名单授权", icon: UserCheck, color: "text-emerald-500" },
  { label: "热点规则", path: "/dashboard/paramFlow", desc: "配置热点参数限流", icon: Flame, color: "text-red-500" },
  { label: "实时监控", path: "/dashboard/metric", desc: "查看实时监控数据", icon: BarChart3, color: "text-cyan-500" },
  { label: "簇点链路", path: "/dashboard/identity", desc: "查看资源调用链路", icon: GitFork, color: "text-indigo-500" },
  { label: "机器列表", path: "/dashboard/app", desc: "查看和管理机器", icon: Server, color: "text-gray-500" },
];

const gatewayMenuCards: MenuCard[] = [
  { label: "网关请求链路", path: "/dashboard/gateway/identity", desc: "查看网关 Route 与 API 调用链路", icon: Webhook, color: "text-blue-500" },
  { label: "API 管理", path: "/dashboard/gateway/api", desc: "配置自定义 API 分组", icon: Route, color: "text-emerald-500" },
  { label: "网关流控规则", path: "/dashboard/gateway/flow", desc: "配置 Route 与 API 流控", icon: ShieldOff, color: "text-orange-500" },
  { label: "实时监控", path: "/dashboard/metric", desc: "查看实时监控数据", icon: BarChart3, color: "text-cyan-500" },
  { label: "系统规则", path: "/dashboard/system", desc: "配置系统保护规则", icon: Cpu, color: "text-slate-500" },
  { label: "熔断规则", path: "/dashboard/degrade", desc: "配置熔断降级规则", icon: FlaskConical, color: "text-red-500" },
];

export default function HomePage() {
  const { app } = useParams<{ app: string }>();
  const { data: apps } = useApps();

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <EmptyState title="请从左侧选择一个应用" description="选择应用后可查看和管理规则" />
      </div>
    );
  }

  const isGateway = apps?.find((item) => item.app === app)?.appType === 1;
  const menuCards = isGateway ? gatewayMenuCards : normalMenuCards;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{app}</h1>
      <MachineSummary app={app} />
      <div>
        <h2 className="text-lg font-semibold mb-3">功能菜单</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {menuCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={`${item.path}/${app}`}>
                <Card className="hover:shadow-md hover:border-foreground/10 transition-all cursor-pointer group">
                  <CardContent className="flex items-center gap-3 py-4 px-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:scale-105 transition-transform">
                      <Icon className={`h-4.5 w-4.5 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MachineSummary({ app }: { app: string }) {
  const qc = useQuery({
    queryKey: ["machines", app],
    queryFn: async () => {
      const res = await getMachines(app);
      return res.data || [];
    },
    enabled: !!app,
    refetchInterval: 10_000,
  });

  const machines = qc.data || [];
  const healthy = machines.filter((m) => m.healthy).length;
  const unhealthy = machines.length - healthy;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card>
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">机器总数</p>
          <p className="text-2xl font-bold">{machines.length}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">健康</p>
          <p className="text-2xl font-bold text-emerald-600">{healthy}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">失联</p>
          <p className="text-2xl font-bold text-destructive">{unhealthy}</p>
        </CardContent>
      </Card>
    </div>
  );
}
