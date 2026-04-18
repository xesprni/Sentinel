import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getClusterClientState } from "@/api/cluster";

const modeMap: Record<number, string> = { 0: "未设置", 1: "内嵌", 2: "独立" };

export default function ClusterClientListPage() {
  const { app = "" } = useParams();

  const { data: clients = [] } = useQuery({
    queryKey: ["cluster-client", app],
    queryFn: async () => { const res = await getClusterClientState(app); return res.data || []; },
    enabled: !!app,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">集群 Client 列表 — {app}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>模式</TableHead>
            <TableHead>Server Host</TableHead>
            <TableHead>Server Port</TableHead>
            <TableHead>请求超时</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c, idx) => (
            <TableRow key={idx}>
              <TableCell><Badge variant="outline">{modeMap[c.client?.mode ?? 0] ?? "-"}</Badge></TableCell>
              <TableCell>{c.client?.clientConfig?.serverHost ?? "-"}</TableCell>
              <TableCell>{c.client?.clientConfig?.serverPort ?? "-"}</TableCell>
              <TableCell>{c.client?.clientConfig?.requestTimeout ?? "-"}</TableCell>
            </TableRow>
          ))}
          {clients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
