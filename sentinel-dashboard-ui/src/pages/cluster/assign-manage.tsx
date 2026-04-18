import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMachines } from "@/hooks/use-machines";
import { assignAllClusterServers, unbindClusterServer, getClusterServerState } from "@/api/cluster";
import { toast } from "sonner";

export default function ClusterAssignManagePage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);

  const { data: servers = [] } = useQuery({
    queryKey: ["cluster-server", app],
    queryFn: async () => { const res = await getClusterServerState(app); return res.data || []; },
    enabled: !!app,
  });

  const assignAllMut = useMutation({
    mutationFn: () => assignAllClusterServers(app, machines?.map((m) => ({ ip: m.ip, port: m.port, mode: 0 })) || []),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["cluster-server"] }); toast.success("分配成功"); } else toast.error(res.msg); },
  });

  const unbindMut = useMutation({
    mutationFn: (server: { ip: string; port: number }) => unbindClusterServer(app, server),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["cluster-server"] }); toast.success("解绑成功"); } else toast.error(res.msg); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">集群分配管理 — {app}</h1>
      <Button onClick={() => assignAllMut.mutate()} disabled={assignAllMut.isPending}>
        全量分配
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>命名空间</TableHead>
            <TableHead>端口</TableHead>
            <TableHead>连接数</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((s, idx) => (
            <TableRow key={`${s.namespace}-${idx}`}>
              <TableCell>{s.namespace}</TableCell>
              <TableCell>{s.port}</TableCell>
              <TableCell>{s.connectedCount}</TableCell>
              <TableCell>
                <Badge variant={s.state === 0 ? "default" : "destructive"}>
                  {s.state === 0 ? "正常" : "异常"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => unbindMut.mutate({ ip: s.namespace, port: s.port })}>
                  解绑
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {servers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
