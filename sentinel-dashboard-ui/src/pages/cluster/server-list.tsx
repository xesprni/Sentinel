import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getClusterServerState } from "@/api/cluster";

export default function ClusterServerListPage() {
  const { app = "" } = useParams();

  const { data: servers = [] } = useQuery({
    queryKey: ["cluster-server", app],
    queryFn: async () => { const res = await getClusterServerState(app); return res.data || []; },
    enabled: !!app,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">集群 Server 列表 — {app}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>命名空间</TableHead>
            <TableHead>端口</TableHead>
            <TableHead>连接数</TableHead>
            <TableHead>状态</TableHead>
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
            </TableRow>
          ))}
          {servers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
