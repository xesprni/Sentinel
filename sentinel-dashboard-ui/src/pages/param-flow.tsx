import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ParamFlowRuleDialog } from "@/components/rules/param-flow-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import * as paramFlowApi from "@/api/param-flow";
import { toast } from "sonner";
import type { ParamFlowRule } from "@/types/rule";
import { parseMachineKey } from "@/lib/machine";

export default function ParamFlowPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<ParamFlowRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParamFlowRule | null>(null);

  const { ip, port } = parseMachineKey(selectedMachine);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["param-flow", app, ip, port],
    queryFn: async () => { const res = await paramFlowApi.getParamFlowRules(app, ip!, port!); return res.data || []; },
    enabled: !!app && !!ip && !!port,
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
    const payload = { ...rule, app, ip, port };
    if (rule.id) updateMut.mutate({ id: rule.id, rule: payload });
    else addMut.mutate(payload);
  }, [app, ip, port, addMut, updateMut]);

  const filtered = rules.filter((r) => r.resource.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">热点参数规则</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} 条规则</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="刷新热点规则" onClick={() => qc.invalidateQueries({ queryKey: ["param-flow"] })}><RefreshCw className="h-4 w-4" /></Button>
        <Button size="sm" disabled={!selectedMachine} onClick={() => { setEditRule(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" />新增</Button>
      </div>

      {!selectedMachine ? (
        <EmptyState title="请先选择一台机器" description="选择目标机器后查看和管理热点参数规则" />
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>资源名</TableHead>
              <TableHead>参数索引</TableHead>
              <TableHead>阈值</TableHead>
              <TableHead>窗口时长(s)</TableHead>
              <TableHead>集群</TableHead>
              <TableHead>例外项数</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.resource}</TableCell>
                <TableCell>{r.paramIdx}</TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell>{r.durationInSec}</TableCell>
                <TableCell>{r.clusterMode ? "是" : "否"}</TableCell>
                <TableCell>{r.paramFlowItemList?.length ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`编辑 ${r.resource}`} onClick={() => { setEditRule(r); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`删除 ${r.resource}`} onClick={() => setDeleteTarget(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState title="暂无规则" description="点击「新增」按钮添加热点参数规则" /></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}

      <ParamFlowRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description={`确定要删除规则「${deleteTarget?.resource}」吗？`} onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
