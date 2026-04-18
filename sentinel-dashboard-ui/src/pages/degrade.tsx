import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DegradeRuleDialog } from "@/components/rules/degrade-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as degradeApi from "@/api/degrade";
import { toast } from "sonner";
import type { DegradeRule } from "@/types/rule";

const gradeMap: Record<number, string> = { 0: "慢调用比例", 1: "异常比例", 2: "异常数" };

export default function DegradePage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<DegradeRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DegradeRule | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: rules = [] } = useQuery({
    queryKey: ["degrade", app, ip, port],
    queryFn: async () => { const res = await degradeApi.getDegradeRules(app, ip, port); return res.data || []; },
    enabled: !!app,
  });

  const addMut = useMutation({
    mutationFn: degradeApi.addDegradeRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["degrade"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, rule }: { id: number; rule: DegradeRule }) => degradeApi.updateDegradeRule(id, rule),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["degrade"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: degradeApi.deleteDegradeRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["degrade"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: DegradeRule) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate({ id: rule.id, rule: payload });
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  const filtered = rules.filter((r) => r.resource.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">熔断规则 — {app}</h1>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["degrade"] })}>刷新</Button>
        <Button size="sm" onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>来源</TableHead>
            <TableHead>策略</TableHead>
            <TableHead>阈值</TableHead>
            <TableHead>熔断时长(s)</TableHead>
            <TableHead>最小请求数</TableHead>
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
              <TableCell>{r.timeWindow}</TableCell>
              <TableCell>{r.minRequestAmount}</TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(r); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <DegradeRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description={`确定要删除规则「${deleteTarget?.resource}」吗？`} onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
