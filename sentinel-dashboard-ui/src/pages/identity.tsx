import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMachines } from "@/hooks/use-machines";
import { MachineSelector } from "@/components/shared/app-selector";
import { getMachineResources, type ResourceNode } from "@/api/resource";

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

export default function IdentityPage() {
  const { app = "" } = useParams();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("default");

  const mp = selectedMachine.split(":");
  const ip = mp[0] || "";
  const port = mp[1] ? Number(mp[1]) : 0;

  const { data: rawNodes = [] } = useQuery({
    queryKey: ["identity", app, ip, port, type],
    queryFn: async () => {
      const res = await getMachineResources(app, ip, port, type);
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
      <div className="flex items-center gap-2">
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
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="sm">操作</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => window.location.hash = `#/dashboard/flow/${app}`}>
                      流控规则
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.hash = `#/dashboard/degrade/${app}`}>
                      熔断规则
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
