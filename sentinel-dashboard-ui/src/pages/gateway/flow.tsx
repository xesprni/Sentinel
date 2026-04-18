import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MachineSelector } from "@/components/shared/app-selector";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GatewayFlowDialog } from "@/components/rules/gateway-flow-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as gatewayFlowApi from "@/api/gateway-flow";
import { toast } from "sonner";
import type { GatewayFlowRule } from "@/types/gateway";

export default function GatewayFlowPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<GatewayFlowRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewayFlowRule | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: rules = [] } = useQuery({
    queryKey: ["gateway-flow", app, ip, port],
    queryFn: async () => { const res = await gatewayFlowApi.getGatewayFlowList(app, ip!, port!); return res.data || []; },
    enabled: !!app && !!ip && !!port,
  });

  const addMut = useMutation({
    mutationFn: gatewayFlowApi.addGatewayFlowRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-flow"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: gatewayFlowApi.updateGatewayFlowRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-flow"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: gatewayFlowApi.deleteGatewayFlowRule,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-flow"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: GatewayFlowRule) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate(payload);
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">网关流控规则 — {app}</h1>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <Button size="sm" onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增规则</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>API/路由</TableHead>
            <TableHead>资源类型</TableHead>
            <TableHead>阈值</TableHead>
            <TableHead>间隔(s)</TableHead>
            <TableHead>流控效果</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.resource}</TableCell>
              <TableCell><Badge variant="outline">{r.resourceMode === 0 ? "Route ID" : "API 分组"}</Badge></TableCell>
              <TableCell>{r.count}</TableCell>
              <TableCell>{r.intervalSec ?? "-"}</TableCell>
              <TableCell>{r.controlBehavior === 2 ? "排队等待" : "快速失败"}</TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(r); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {rules.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <GatewayFlowDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description="确定要删除此规则吗？" onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
