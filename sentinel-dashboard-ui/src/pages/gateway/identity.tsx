import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMachines } from "@/hooks/use-machines";
import { MachineSelector } from "@/components/shared/app-selector";
import { GatewayFlowDialog } from "@/components/rules/gateway-flow-dialog";
import { DegradeRuleDialog } from "@/components/rules/degrade-rule-dialog";
import { getMachineResources, type ResourceNode } from "@/api/resource";
import { addGatewayFlowRule } from "@/api/gateway-flow";
import { addDegradeRule } from "@/api/degrade";
import { parseMachineKey } from "@/lib/machine";
import type { GatewayFlowRule } from "@/types/gateway";
import type { DegradeRule } from "@/types/rule";
import { toast } from "sonner";

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
  const [gatewayFlowDraft, setGatewayFlowDraft] = useState<GatewayFlowRule | null>(null);
  const [degradeDraft, setDegradeDraft] = useState<DegradeRule | null>(null);
  const machine = parseMachineKey(selectedMachine);
  const ip = machine.ip || "";
  const port = machine.port || 0;

  const gatewayFlowMut = useMutation({ mutationFn: addGatewayFlowRule, onSuccess: (res) => res.success ? toast.success("网关流控规则已创建") : toast.error(res.msg) });
  const degradeMut = useMutation({ mutationFn: addDegradeRule, onSuccess: (res) => res.success ? toast.success("熔断规则已创建") : toast.error(res.msg) });

  const { data: nodes = [] } = useQuery({
    queryKey: ["gateway-identity", app, ip, port],
    queryFn: async () => {
      const res = await getMachineResources(ip, port);
      return flatten(res.data || []);
    },
    enabled: !!app && !!ip && !!port,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">网关请求链路 — {app}</h1>
      <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
      <div className="overflow-x-auto rounded-lg border"><Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>通过 QPS</TableHead>
            <TableHead>拒绝 QPS</TableHead>
            <TableHead>线程数</TableHead>
            <TableHead>平均 RT</TableHead>
            <TableHead>操作</TableHead>
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>操作</DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setGatewayFlowDraft({ app, ip, port, resource: n.resource, resourceMode: 0, grade: 1, count: 1, interval: 1, intervalUnit: 0, controlBehavior: 0, burst: 0, maxQueueingTimeoutMs: 0 })}>新增网关流控规则</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDegradeDraft({ app, ip, port, resource: n.resource, limitApp: "default", grade: 0, count: 1, timeWindow: 10, minRequestAmount: 5, statIntervalMs: 1000, slowRatioThreshold: 0.2 })}>新增熔断规则</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {nodes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table></div>
      <GatewayFlowDialog open={!!gatewayFlowDraft} onOpenChange={(open) => !open && setGatewayFlowDraft(null)} rule={gatewayFlowDraft} onSubmit={(rule) => gatewayFlowMut.mutate({ ...rule, app, ip, port })} />
      <DegradeRuleDialog open={!!degradeDraft} onOpenChange={(open) => !open && setDegradeDraft(null)} rule={degradeDraft} onSubmit={(rule) => degradeMut.mutate({ ...rule, app, ip, port })} />
    </div>
  );
}
