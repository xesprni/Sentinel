import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MachineSelector } from "@/components/shared/app-selector";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AuthorityRuleDialog } from "@/components/rules/authority-rule-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as authorityApi from "@/api/authority";
import { toast } from "sonner";
import type { AuthorityRule } from "@/types/rule";

export default function AuthorityPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<AuthorityRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthorityRule | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: rules = [] } = useQuery({
    queryKey: ["authority", app, ip, port],
    queryFn: async () => { const res = await authorityApi.getAuthorityRules(app, ip, port); return res.data || []; },
    enabled: !!app,
  });

  const addMut = useMutation({
    mutationFn: authorityApi.addAuthorityRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["authority"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, rule }: { id: number; rule: AuthorityRule }) => authorityApi.updateAuthorityRule(id, rule),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["authority"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: authorityApi.deleteAuthorityRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["authority"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: AuthorityRule) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate({ id: rule.id, rule: payload });
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  const filtered = rules.filter((r) => r.resource.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">授权规则 — {app}</h1>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <SearchInput value={search} onChange={setSearch} />
        <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["authority"] })}>刷新</Button>
        <Button size="sm" onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>资源名</TableHead>
            <TableHead>来源应用</TableHead>
            <TableHead>策略</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.resource}</TableCell>
              <TableCell>{r.limitApp}</TableCell>
              <TableCell><Badge variant="outline">{r.strategy === 0 ? "白名单" : "黑名单"}</Badge></TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(r); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <AuthorityRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description={`确定要删除规则「${deleteTarget?.resource}」吗？`} onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
