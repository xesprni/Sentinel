import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ParamFlowRuleDialog } from "@/components/rules/param-flow-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as paramFlowApi from "@/api/param-flow";
import { toast } from "sonner";
import type { ParamFlowRule } from "@/types/rule";

export default function ParamFlowPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<ParamFlowRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParamFlowRule | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: rules = [] } = useQuery({
    queryKey: ["param-flow", app, ip, port],
    queryFn: async () => { const res = await paramFlowApi.getParamFlowRules(app, ip, port); return res.data || []; },
    enabled: !!app,
  });

  const addMut = useMutation({
    mutationFn: paramFlowApi.addParamFlowRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["param-flow"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, rule }: { id: number; rule: ParamFlowRule }) => paramFlowApi.updateParamFlowRule(id, rule),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["param-flow"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: paramFlowApi.deleteParamFlowRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["param-flow"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: ParamFlowRule) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate({ id: rule.id, rule: payload });
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  const filtered = rules.filter((r) => r.resource.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">热点参数规则 — {app}</h1>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["param-flow"] })}>刷新</Button>
        <Button size="sm" onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>参数索引</TableHead>
            <TableHead>阈值</TableHead>
            <TableHead>窗口时长(s)</TableHead>
            <TableHead>集群</TableHead>
            <TableHead>例外项数</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.resource}</TableCell>
              <TableCell>{r.paramIdx}</TableCell>
              <TableCell>{r.count}</TableCell>
              <TableCell>{r.durationInSec}</TableCell>
              <TableCell>{r.clusterMode ? "是" : "否"}</TableCell>
              <TableCell>{r.paramFlowItemList?.length ?? 0}</TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(r); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <ParamFlowRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description={`确定要删除规则「${deleteTarget?.resource}」吗？`} onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
