import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { assignAllClusterServers, getClusterAppState } from "@/api/cluster";
import {
  CLUSTER_MODE_CLIENT,
  CLUSTER_MODE_SERVER,
  type ClusterAssignMap,
  type ClusterMachineState,
} from "@/types/cluster";
import { toast } from "sonner";

type MachineRole = "server" | "client" | "unassigned";

interface AssignmentRow {
  id: string;
  ip: string;
  commandPort: number;
  role: MachineRole;
  targetServerId: string;
  serverPort: string;
  namespaces: string;
  maxAllowedQps: string;
}

interface ExternalServer {
  id: string;
  host: string;
  port: number;
}

export default function ClusterAssignManagePage() {
  const { app = "" } = useParams();
  const { data: response, isLoading } = useQuery({
    queryKey: ["cluster-assign-state", app],
    queryFn: () => getClusterAppState(app),
    enabled: !!app,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">集群分配管理</h1>
        <p className="text-sm text-muted-foreground">{app} · 指定 Server、Client 归属和未分配实例，一次性推送完整拓扑</p>
      </div>
      {!response?.success && response ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{response.msg}</div>
      ) : isLoading ? (
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      ) : response?.data?.length ? (
        <AssignmentEditor key={JSON.stringify(response.data)} app={app} machines={response.data} />
      ) : (
        <EmptyState title="暂无可分配机器" description="应用实例上报且引入集群流控依赖后，可在此配置集群拓扑" />
      )}
    </div>
  );
}

function buildInitialState(machines: ClusterMachineState[], app: string): { rows: AssignmentRow[]; externalServers: ExternalServer[] } {
  const serverIdByAddress = new Map<string, string>();
  for (const machine of machines) {
    if (machine.state.stateInfo.mode === CLUSTER_MODE_SERVER && machine.state.server) {
      serverIdByAddress.set(`${machine.ip}:${machine.state.server.port}`, `${machine.ip}@${machine.commandPort}`);
    }
  }

  const externalByAddress = new Map<string, ExternalServer>();
  const rows = machines.map((machine): AssignmentRow => {
    const mode = machine.state.stateInfo.mode;
    const config = machine.state.client?.clientConfig;
    let targetServerId = "";
    if (mode === CLUSTER_MODE_CLIENT && config?.serverHost && config.serverPort > 0) {
      const address = `${config.serverHost}:${config.serverPort}`;
      targetServerId = serverIdByAddress.get(address) || `external@${address}`;
      if (!serverIdByAddress.has(address)) {
        externalByAddress.set(address, { id: targetServerId, host: config.serverHost, port: config.serverPort });
      }
    }
    return {
      id: `${machine.ip}@${machine.commandPort}`,
      ip: machine.ip,
      commandPort: machine.commandPort,
      role: mode === CLUSTER_MODE_SERVER ? "server" : mode === CLUSTER_MODE_CLIENT ? "client" : "unassigned",
      targetServerId,
      serverPort: String(machine.state.server?.port || 18730),
      namespaces: (machine.state.server?.namespaceSet || ["default", app]).join(", "),
      maxAllowedQps: String(machine.state.server?.flow?.maxAllowedQps ?? 20000),
    };
  });
  return { rows, externalServers: [...externalByAddress.values()] };
}

function AssignmentEditor({ app, machines }: { app: string; machines: ClusterMachineState[] }) {
  const qc = useQueryClient();
  const initial = buildInitialState(machines, app);
  const [rows, setRows] = useState(initial.rows);
  const [externalServers, setExternalServers] = useState(initial.externalServers);
  const [externalHost, setExternalHost] = useState("");
  const [externalPort, setExternalPort] = useState("18730");

  const appServers = rows.filter((row) => row.role === "server");
  const serverOptions = [
    ...appServers.map((row) => ({ id: row.id, label: `${row.id} · ${row.serverPort}` })),
    ...externalServers.map((server) => ({ id: server.id, label: `${server.host}:${server.port}（外部）` })),
  ];

  const updateRow = (id: string, patch: Partial<AssignmentRow>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  };

  const addExternalServer = () => {
    const host = externalHost.trim();
    const port = Number(externalPort);
    if (!host || port <= 0 || port > 65535) return;
    const id = `external@${host}:${port}`;
    if (!externalServers.some((server) => server.id === id)) {
      setExternalServers((current) => [...current, { id, host, port }]);
    }
    setExternalHost("");
  };

  const saveMut = useMutation({
    mutationFn: () => {
      const clusterMap: ClusterAssignMap[] = appServers.map((server) => ({
        machineId: server.id,
        ip: server.ip,
        port: Number(server.serverPort),
        belongToApp: true,
        clientSet: rows.filter((row) => row.role === "client" && row.targetServerId === server.id).map((row) => row.id),
        namespaceSet: server.namespaces.split(",").map((value) => value.trim()).filter(Boolean),
        maxAllowedQps: Number(server.maxAllowedQps),
      }));
      for (const external of externalServers) {
        const clients = rows.filter((row) => row.role === "client" && row.targetServerId === external.id).map((row) => row.id);
        if (clients.length) {
          clusterMap.push({
            machineId: external.host,
            ip: external.host,
            port: external.port,
            belongToApp: false,
            clientSet: clients,
          });
        }
      }
      const validTargets = new Set([...appServers.map((server) => server.id), ...externalServers.map((server) => server.id)]);
      const remainingList = rows
        .filter((row) => row.role === "unassigned" || (row.role === "client" && !validTargets.has(row.targetServerId)))
        .map((row) => row.id);
      return assignAllClusterServers(app, { clusterMap, remainingList });
    },
    onSuccess: (res) => {
      if (res.success) {
        const failures = [...(res.data?.failedServerSet || []), ...(res.data?.failedClientSet || [])];
        toast.success(failures.length ? `分配已推送，${failures.length} 个实例失败` : "集群分配已全部推送");
        qc.invalidateQueries({ queryKey: ["cluster-assign-state"] });
        qc.invalidateQueries({ queryKey: ["cluster-server"] });
        qc.invalidateQueries({ queryKey: ["cluster-client"] });
      } else toast.error(res.msg);
    },
  });

  const invalidServer = appServers.some((server) => Number(server.serverPort) <= 0 || Number(server.serverPort) > 65535 || Number(server.maxAllowedQps) < 0 || !server.namespaces.trim());
  const invalidClient = rows.some((row) => row.role === "client" && !row.targetServerId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
        <div className="space-y-1"><Label>外部 Server IP</Label><Input className="w-52" value={externalHost} onChange={(event) => setExternalHost(event.target.value)} placeholder="10.0.0.10" /></div>
        <div className="space-y-1"><Label>端口</Label><Input className="w-28" type="number" value={externalPort} onChange={(event) => setExternalPort(event.target.value)} /></div>
        <Button variant="outline" onClick={addExternalServer} disabled={!externalHost.trim()}>添加外部 Server</Button>
        <div className="ml-auto flex gap-2 text-xs text-muted-foreground"><Badge variant="secondary">Server {appServers.length}</Badge><Badge variant="secondary">Client {rows.filter((row) => row.role === "client").length}</Badge><Badge variant="secondary">未分配 {rows.filter((row) => row.role === "unassigned").length}</Badge></div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>实例</TableHead><TableHead className="w-[160px]">角色</TableHead><TableHead>角色配置</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell><p className="font-mono text-xs">{row.id}</p><p className="text-xs text-muted-foreground">Sentinel command port</p></TableCell>
                <TableCell>
                  <Select value={row.role} onValueChange={(value) => { if (value) updateRow(row.id, { role: value as MachineRole, targetServerId: value === "client" ? row.targetServerId : "" }); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="server">Server</SelectItem><SelectItem value="client">Client</SelectItem><SelectItem value="unassigned">未分配</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {row.role === "server" ? (
                    <div className="grid min-w-[620px] grid-cols-3 gap-2">
                      <div><Label className="text-xs">服务端口</Label><Input type="number" value={row.serverPort} onChange={(event) => updateRow(row.id, { serverPort: event.target.value })} /></div>
                      <div><Label className="text-xs">命名空间</Label><Input value={row.namespaces} onChange={(event) => updateRow(row.id, { namespaces: event.target.value })} /></div>
                      <div><Label className="text-xs">最大 QPS</Label><Input type="number" value={row.maxAllowedQps} onChange={(event) => updateRow(row.id, { maxAllowedQps: event.target.value })} /></div>
                    </div>
                  ) : row.role === "client" ? (
                    <Select value={row.targetServerId || "none"} onValueChange={(value) => updateRow(row.id, { targetServerId: !value || value === "none" ? "" : value })}>
                      <SelectTrigger className="min-w-[300px]"><SelectValue placeholder="选择 Token Server" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">请选择 Token Server</SelectItem>{serverOptions.map((server) => <SelectItem key={server.id} value={server.id}>{server.label}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <span className="text-sm text-muted-foreground">该实例会退出集群模式</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {(invalidClient || invalidServer) && <p className="text-sm text-destructive">请补全 Client 的目标 Server，并检查 Server 端口、命名空间和最大 QPS。</p>}
      <Button onClick={() => saveMut.mutate()} disabled={invalidClient || invalidServer || saveMut.isPending}>{saveMut.isPending ? "推送中..." : "保存并全量推送"}</Button>
    </div>
  );
}
