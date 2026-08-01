import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FlowRuleDialog } from "@/components/rules/flow-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import * as flowV1Api from "@/api/flow-v1";
import { toast } from "sonner";
import type { FlowRule } from "@/types/rule";
import { parseMachineKey } from "@/lib/machine";

const gradeMap: Record<number, string> = { 1: "QPS", 0: "线程数" };
const strategyMap: Record<number, string> = { 0: "直接", 1: "关联", 2: "链路" };
const behaviorMap: Record<number, string> = { 0: "快速失败", 1: "Warm Up", 2: "排队等待", 3: "预热+排队" };

export default function FlowV1Page() {
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
    queryKey: ["flow-v1", app, ip, port],
    queryFn: async () => {
      const res = await flowV1Api.getFlowRules(app, ip!, port!);
      return res.data || [];
    },
    enabled: !!app && !!ip && !!port,
  });

  const addMut = useMutation({
    mutationFn: flowV1Api.addFlowRule,
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v1"] }); toast.success("添加成功"); }
      else toast.error(res.msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: flowV1Api.updateFlowRule,
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v1"] }); toast.success("更新成功"); }
      else toast.error(res.msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: flowV1Api.deleteFlowRule,
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["flow-v1"] }); toast.success("删除成功"); }
      else toast.error(res.msg);
    },
  });

  const handleSubmit = useCallback((rule: FlowRule) => {
    const payload = { ...rule, app, ip, port };
    if (rule.id) updateMut.mutate(payload);
    else addMut.mutate(payload);
  }, [app, ip, port, addMut, updateMut]);

  const filtered = rules.filter((r) =>
    r.resource.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">流控规则 (V1)</h1>
        <Badge variant="secondary">{filtered.length} 条规则</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} placeholder="搜索资源名" />
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="刷新流控规则" onClick={() => qc.invalidateQueries({ queryKey: ["flow-v1"] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="sm" disabled={!selectedMachine} onClick={() => { setEditRule(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />新增
        </Button>
      </div>

      {!selectedMachine ? (
        <EmptyState title="请先选择一台机器" description="从上方下拉框中选择目标机器后查看和管理流控规则" />
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded" />
        ))}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资源名</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>阈值</TableHead>
              <TableHead>模式</TableHead>
              <TableHead>效果</TableHead>
              <TableHead>集群</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.resource}</TableCell>
                <TableCell>{r.limitApp}</TableCell>
                <TableCell><Badge variant="outline">{gradeMap[r.grade] ?? r.grade}</Badge></TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell>{strategyMap[r.strategy] ?? r.strategy}</TableCell>
                <TableCell>{behaviorMap[r.controlBehavior] ?? r.controlBehavior}</TableCell>
                <TableCell>{r.clusterMode ? "是" : "否"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`编辑 ${r.resource}`} onClick={() => { setEditRule(r); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`删除 ${r.resource}`} onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState title="暂无规则" description="点击「新增」按钮添加流控规则" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

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
