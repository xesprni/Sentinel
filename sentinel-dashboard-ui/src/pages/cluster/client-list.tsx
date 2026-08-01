import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getClusterClientState, modifyClusterSingleConfig } from "@/api/cluster";
import { CLUSTER_MODE_CLIENT, type ClusterAppClientState } from "@/types/cluster";
import { toast } from "sonner";

const clientStateLabel: Record<number, string> = { 0: "未连接", 1: "连接中", 2: "已连接" };

export default function ClusterClientListPage() {
  const { app = "" } = useParams();
  const [editing, setEditing] = useState<ClusterAppClientState | null>(null);
  const { data: response, isLoading } = useQuery({
    queryKey: ["cluster-client", app],
    queryFn: () => getClusterClientState(app),
    enabled: !!app,
  });
  const clients = response?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Token Client 列表</h1>
        <p className="text-sm text-muted-foreground">{app} · 查看连接状态并修改目标 Token Server</p>
      </div>
      {!response?.success && response ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{response.msg}</div>
      ) : isLoading ? (
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Server IP</TableHead>
                <TableHead>Server 端口</TableHead>
                <TableHead>请求超时</TableHead>
                <TableHead>连接状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const config = client.state.clientConfig;
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">{client.id}</TableCell>
                    <TableCell>{config.serverHost || "-"}</TableCell>
                    <TableCell>{config.serverPort || "-"}</TableCell>
                    <TableCell>{config.requestTimeout ? `${config.requestTimeout} ms` : "-"}</TableCell>
                    <TableCell><Badge variant={config.clientState === 2 ? "default" : "secondary"}>{clientStateLabel[config.clientState ?? 0] || "未知"}</Badge></TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setEditing(client)}>编辑配置</Button></TableCell>
                  </TableRow>
                );
              })}
              {clients.length === 0 && <TableRow><TableCell colSpan={6}><EmptyState title="暂无 Token Client" description="请先在集群分配页为实例指定 Client 角色" /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
      {editing && <ClientConfigDialog key={editing.id} app={app} client={editing} open onOpenChange={(open) => !open && setEditing(null)} />}
    </div>
  );
}

function ClientConfigDialog({ app, client, open, onOpenChange }: { app: string; client: ClusterAppClientState; open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const config = client.state.clientConfig;
  const [serverHost, setServerHost] = useState(config.serverHost || "");
  const [serverPort, setServerPort] = useState(String(config.serverPort || 18730));
  const [requestTimeout, setRequestTimeout] = useState(String(config.requestTimeout || 20));
  const saveMut = useMutation({
    mutationFn: () => modifyClusterSingleConfig(app, client.ip, client.commandPort, {
      mode: CLUSTER_MODE_CLIENT,
      clientConfig: {
        serverHost: serverHost.trim(),
        serverPort: Number(serverPort),
        requestTimeout: Number(requestTimeout),
      },
    }),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ["cluster-client"] });
        toast.success("Client 配置已推送");
        onOpenChange(false);
      } else toast.error(res.msg);
    },
  });
  const valid = serverHost.trim() !== "" && Number(serverPort) > 0 && Number(serverPort) <= 65535 && Number(requestTimeout) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>编辑 {client.id}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Token Server IP</Label><Input value={serverHost} onChange={(event) => setServerHost(event.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Server 端口</Label><Input type="number" value={serverPort} onChange={(event) => setServerPort(event.target.value)} /></div>
            <div className="space-y-2"><Label>请求超时 (ms)</Label><Input type="number" value={requestTimeout} onChange={(event) => setRequestTimeout(event.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={() => saveMut.mutate()} disabled={!valid || saveMut.isPending}>保存并推送</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
