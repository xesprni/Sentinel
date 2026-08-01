import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { getClusterServerState, unbindClusterServer } from "@/api/cluster";
import type { ClusterAppServerState } from "@/types/cluster";
import { toast } from "sonner";

export default function ClusterServerListPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const [detail, setDetail] = useState<ClusterAppServerState | null>(null);
  const [unbindTarget, setUnbindTarget] = useState<ClusterAppServerState | null>(null);
  const { data: response, isLoading } = useQuery({
    queryKey: ["cluster-server", app],
    queryFn: () => getClusterServerState(app),
    enabled: !!app,
  });
  const servers = response?.data || [];

  const unbindMut = useMutation({
    mutationFn: (id: string) => unbindClusterServer(app, [id]),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ["cluster-server"] });
        qc.invalidateQueries({ queryKey: ["cluster-client"] });
        toast.success(res.data?.failedServerSet?.length || res.data?.failedClientSet?.length ? "推送完成，部分实例失败" : "Token Server 已移除");
      } else toast.error(res.msg);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Token Server 列表</h1>
          <p className="text-sm text-muted-foreground">{app} · 查看连接、命名空间和实时请求额度</p>
        </div>
        <Link className={buttonVariants()} to={`/dashboard/cluster/assign_manage/${app}`}>新增或调整 Server</Link>
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
                <TableHead>Server ID</TableHead>
                <TableHead>服务端口</TableHead>
                <TableHead>命名空间</TableHead>
                <TableHead>连接数</TableHead>
                <TableHead>当前 / 最大 QPS</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="w-[180px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((server) => {
                const appLimit = server.state.requestLimitData?.find((item) => item.namespace === app) || server.state.requestLimitData?.[0];
                return (
                  <TableRow key={server.id}>
                    <TableCell className="font-mono text-xs">{server.id}</TableCell>
                    <TableCell>{server.state.port || server.port}</TableCell>
                    <TableCell>{server.state.namespaceSet?.join(", ") || "-"}</TableCell>
                    <TableCell>{server.connectedCount ?? 0}</TableCell>
                    <TableCell>{appLimit ? `${appLimit.currentQps} / ${appLimit.maxAllowedQps}` : "-"}</TableCell>
                    <TableCell><Badge variant="outline">{server.belongToApp ? "应用内" : "外部"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setDetail(server)}>连接详情</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setUnbindTarget(server)}>移除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {servers.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState title="暂无 Token Server" description="点击右上角按钮完成 Server 与 Client 分配" /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>连接详情 · {detail?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(detail?.state.connection || []).map((group) => (
              <div key={group.namespace} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between"><span className="font-medium">{group.namespace}</span><Badge variant="secondary">{group.connectedCount} 个连接</Badge></div>
                <p className="break-all font-mono text-xs text-muted-foreground">{group.connectionSet?.map((connection) => connection.address).join(", ") || "暂无连接"}</p>
              </div>
            ))}
            {!detail?.state.connection?.length && <p className="py-8 text-center text-sm text-muted-foreground">暂无连接详情</p>}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!unbindTarget}
        onOpenChange={(open) => !open && setUnbindTarget(null)}
        title="移除 Token Server"
        description={`移除 ${unbindTarget?.id} 后，其下 Client 也会解除分配。`}
        onConfirm={() => { if (unbindTarget) unbindMut.mutate(unbindTarget.id); setUnbindTarget(null); }}
      />
    </div>
  );
}
