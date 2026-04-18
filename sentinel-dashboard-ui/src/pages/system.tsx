import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SystemRuleDialog } from "@/components/rules/system-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import * as systemApi from "@/api/system";
import { toast } from "sonner";
import type { SystemRule } from "@/types/rule";

function getThresholdInfo(rule: SystemRule) {
  if (rule.highestSystemLoad !== undefined) return { type: "Load", value: rule.highestSystemLoad };
  if (rule.highestCpuUsage !== undefined) return { type: "CPU", value: rule.highestCpuUsage };
  if (rule.avgRt !== undefined) return { type: "RT", value: rule.avgRt };
  if (rule.maxThread !== undefined) return { type: "线程数", value: rule.maxThread };
  if (rule.qps !== undefined) return { type: "QPS", value: rule.qps };
  return { type: "-", value: "-" };
}

export default function SystemPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<SystemRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SystemRule | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["system", app, ip, port],
    queryFn: async () => { const res = await systemApi.getSystemRules(app, ip!, port!); return res.data || []; },
    enabled: !!app && !!ip && !!port,
  });

  const addMut = useMutation({
    mutationFn: systemApi.addSystemRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["system"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: systemApi.updateSystemRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["system"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: systemApi.deleteSystemRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["system"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: SystemRule) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate(payload);
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  const filtered = rules.filter((r) => {
    const info = getThresholdInfo(r);
    return info.type.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">系统规则</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} 条规则</span>
      </div>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} placeholder="搜索阈值类型" />
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => qc.invalidateQueries({ queryKey: ["system"] })}><RefreshCw className="h-4 w-4" /></Button>
        <Button size="sm" disabled={!selectedMachine} onClick={() => { setEditRule(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" />新增</Button>
      </div>

      {!selectedMachine ? (
        <EmptyState title="请先选择一台机器" description="选择目标机器后查看和管理系统规则" />
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>阈值类型</TableHead>
              <TableHead>阈值</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const info = getThresholdInfo(r);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{info.type}</TableCell>
                  <TableCell>{info.value}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditRule(r); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={3}><EmptyState title="暂无规则" description="点击「新增」按钮添加系统规则" /></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}

      <SystemRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description="确定要删除此系统规则吗？" onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
