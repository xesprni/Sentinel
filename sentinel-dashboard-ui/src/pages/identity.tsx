import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMachines } from "@/hooks/use-machines";
import { MachineSelector } from "@/components/shared/app-selector";
import { FlowRuleDialog } from "@/components/rules/flow-rule-dialog";
import { DegradeRuleDialog } from "@/components/rules/degrade-rule-dialog";
import { AuthorityRuleDialog } from "@/components/rules/authority-rule-dialog";
import { ParamFlowRuleDialog } from "@/components/rules/param-flow-rule-dialog";
import { getMachineResources, type ResourceNode } from "@/api/resource";
import { addFlowRule } from "@/api/flow-v1";
import { addDegradeRule } from "@/api/degrade";
import { addAuthorityRule } from "@/api/authority";
import { addParamFlowRule } from "@/api/param-flow";
import { parseMachineKey } from "@/lib/machine";
import type { AuthorityRule, DegradeRule, FlowRule, ParamFlowRule } from "@/types/rule";
import { toast } from "sonner";

function flatten(nodes: ResourceNode[], level = 0): (ResourceNode & { level: number })[] {
  const result: (ResourceNode & { level: number })[] = [];
  for (const node of nodes) {
    result.push({ ...node, level });
    if (node.children?.length) {
      result.push(...flatten(node.children, level + 1));
    }
  }
  return result;
}

function useCreateRuleMutation<T>(mutationFn: (rule: T) => Promise<{ success: boolean; msg: string }>) {
  return useMutation({
    mutationFn,
    onSuccess: (res) => res.success ? toast.success("规则已创建") : toast.error(res.msg),
    onError: () => toast.error("规则创建失败"),
  });
}

export default function IdentityPage() {
  const { app = "" } = useParams();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("default");
  const [flowDraft, setFlowDraft] = useState<FlowRule | null>(null);
  const [degradeDraft, setDegradeDraft] = useState<DegradeRule | null>(null);
  const [authorityDraft, setAuthorityDraft] = useState<AuthorityRule | null>(null);
  const [paramDraft, setParamDraft] = useState<ParamFlowRule | null>(null);

  const machine = parseMachineKey(selectedMachine);
  const ip = machine.ip || "";
  const port = machine.port || 0;

  const flowMut = useCreateRuleMutation(addFlowRule);
  const degradeMut = useCreateRuleMutation(addDegradeRule);
  const authorityMut = useCreateRuleMutation(addAuthorityRule);
  const paramMut = useCreateRuleMutation(addParamFlowRule);

  const { data: rawNodes = [] } = useQuery({
    queryKey: ["identity", app, ip, port, type],
    queryFn: async () => {
      const res = await getMachineResources(ip, port, type);
      return res.data || [];
    },
    enabled: !!app && !!ip && !!port,
  });

  const nodes = flatten(rawNodes);
  const filtered = nodes.filter((n) =>
    n.resource.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">簇点链路 — {app}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <Input placeholder="搜索资源" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[200px]" />
      </div>
      <Tabs value={type} onValueChange={setType}>
        <TabsList>
          <TabsTrigger value="default">默认</TabsTrigger>
          <TabsTrigger value="root">Root</TabsTrigger>
          <TabsTrigger value="cluster">Cluster</TabsTrigger>
        </TabsList>
      </Tabs>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>通过 QPS</TableHead>
            <TableHead>拒绝 QPS</TableHead>
            <TableHead>线程数</TableHead>
            <TableHead>平均 RT</TableHead>
            <TableHead>异常 QPS</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((n, idx) => (
            <TableRow key={`${n.resource}-${idx}`}>
              <TableCell style={{ paddingLeft: `${n.level * 24 + 16}px` }}>
                {n.resource}
              </TableCell>
              <TableCell>{n.passQps}</TableCell>
              <TableCell>{n.blockQps}</TableCell>
              <TableCell>{n.threadNum}</TableCell>
              <TableCell>{n.rt}</TableCell>
              <TableCell>{n.exceptionQps}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>操作</DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFlowDraft({ app, ip, port, resource: n.resource, limitApp: "default", grade: 1, count: 0, strategy: 0, controlBehavior: 0, clusterMode: false })}>新增流控规则</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDegradeDraft({ app, ip, port, resource: n.resource, limitApp: "default", grade: 0, count: 1, timeWindow: 10, minRequestAmount: 5, statIntervalMs: 1000, slowRatioThreshold: 0.2 })}>新增熔断规则</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAuthorityDraft({ app, ip, port, resource: n.resource, limitApp: "default", strategy: 0 })}>新增授权规则</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setParamDraft({ app, ip, port, resource: n.resource, limitApp: "default", grade: 1, paramIdx: 0, count: 1, durationInSec: 1, clusterMode: false })}>新增热点规则</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <FlowRuleDialog open={!!flowDraft} onOpenChange={(open) => !open && setFlowDraft(null)} rule={flowDraft} onSubmit={(rule) => flowMut.mutate({ ...rule, app, ip, port })} />
      <DegradeRuleDialog open={!!degradeDraft} onOpenChange={(open) => !open && setDegradeDraft(null)} rule={degradeDraft} onSubmit={(rule) => degradeMut.mutate({ ...rule, app, ip, port })} />
      <AuthorityRuleDialog open={!!authorityDraft} onOpenChange={(open) => !open && setAuthorityDraft(null)} rule={authorityDraft} onSubmit={(rule) => authorityMut.mutate({ ...rule, app, ip, port })} />
      <ParamFlowRuleDialog open={!!paramDraft} onOpenChange={(open) => !open && setParamDraft(null)} rule={paramDraft} onSubmit={(rule) => paramMut.mutate({ ...rule, app, ip, port })} />
    </div>
  );
}
