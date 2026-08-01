import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/search-input";
import { MachineSelector } from "@/components/shared/app-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FlowRuleDialog } from "@/components/rules/flow-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as flowV2Api from "@/api/flow-v2";
import { toast } from "sonner";
import type { FlowRule } from "@/types/rule";
import { parseMachineKey } from "@/lib/machine";

const gradeMap: Record<number, string> = { 1: "QPS", 0: "线程数" };
const strategyMap: Record<number, string> = { 0: "直接", 1: "关联", 2: "链路" };
const behaviorMap: Record<number, string> = { 0: "快速失败", 1: "Warm Up", 2: "排队等待", 3: "预热+排队" };

export default function FlowV2Page() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<FlowRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlowRule | null>(null);

  const { ip, port } = parseMachineKey(selectedMachine);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["flow-v2", app, ip, port],
    queryFn: async () => {
      const res = await flowV2Api.getFlowRules(app, ip!, port!);
      return res.data || [];
    },
    enabled: !!app && !!ip && !!port,
  });

  const addMut = useMutation({
    mutationFn: flowV2Api.addFlowRule,
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v2"] }); toast.success("添加成功"); }
      else toast.error(res.msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, rule }: { id: number; rule: FlowRule }) => flowV2Api.updateFlowRule(id, rule),
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v2"] }); toast.success("更新成功"); }
      else toast.error(res.msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: flowV2Api.deleteFlowRule,
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v2"] }); toast.success("删除成功"); }
      else toast.error(res.msg);
    },
  });

  const handleSubmit = useCallback((rule: FlowRule) => {
    const payload = { ...rule, app, ip, port };
    if (rule.id) updateMut.mutate({ id: rule.id, rule: payload });
    else addMut.mutate(payload);
  }, [app, ip, port, addMut, updateMut]);

  const filtered = rules.filter((r) =>
    r.resource.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">流控规则 (推送模式) — {app}</h1>
      <div className="flex flex-wrap items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} placeholder="搜索资源名" />
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["flow-v2"] })}>刷新</Button>
        <Button size="sm" disabled={!ip || !port} onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增</Button>
      </div>
      {!selectedMachine ? (
        <EmptyState title="请先选择一台机器" description="选择目标机器后查看和管理推送模式流控规则" />
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>
      ) : <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>阈值</TableHead>
            <TableHead>模式</TableHead>
            <TableHead>效果</TableHead>
            <TableHead>集群</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.resource}</TableCell>
              <TableCell>{r.limitApp}</TableCell>
              <TableCell><Badge variant="outline">{gradeMap[r.grade] ?? r.grade}</Badge></TableCell>
              <TableCell>{r.count}</TableCell>
              <TableCell>{strategyMap[r.strategy] ?? r.strategy}</TableCell>
              <TableCell>{behaviorMap[r.controlBehavior] ?? r.controlBehavior}</TableCell>
              <TableCell>{r.clusterMode ? "是" : "否"}</TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(r); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>
          )}
        </TableBody>
      </Table>}
      <FlowRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="确认删除"
        description={`确定要删除规则「${deleteTarget?.resource}」吗？`}
        onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }}
      />
    </div>
  );
}
