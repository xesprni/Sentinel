import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMachines } from "@/hooks/use-machines";
import { MachineSelector } from "@/components/shared/app-selector";
import { getMachineResources, type ResourceNode } from "@/api/resource";

function flatten(nodes: ResourceNode[]): ResourceNode[] {
  const result: ResourceNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) result.push(...flatten(node.children));
  }
  return result;
}

export default function GatewayIdentityPage() {
  const { app = "" } = useParams();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const mp = selectedMachine.split(":");
  const ip = mp[0] || "";
  const port = mp[1] ? Number(mp[1]) : 0;

  const { data: nodes = [] } = useQuery({
    queryKey: ["gateway-identity", app, ip, port],
    queryFn: async () => {
      const res = await getMachineResources(app, ip, port);
      return flatten(res.data || []);
    },
    enabled: !!app && !!ip && !!port,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">网关请求链路 — {app}</h1>
      <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>通过 QPS</TableHead>
            <TableHead>拒绝 QPS</TableHead>
            <TableHead>线程数</TableHead>
            <TableHead>平均 RT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((n, idx) => (
            <TableRow key={`${n.resource}-${idx}`}>
              <TableCell>{n.resource}</TableCell>
              <TableCell>{n.passQps}</TableCell>
              <TableCell>{n.blockQps}</TableCell>
              <TableCell>{n.threadNum}</TableCell>
              <TableCell>{n.rt}</TableCell>
            </TableRow>
          ))}
          {nodes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
