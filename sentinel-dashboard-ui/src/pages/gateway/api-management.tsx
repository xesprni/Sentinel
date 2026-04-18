import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MachineSelector } from "@/components/shared/app-selector";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GatewayApiDialog } from "@/components/rules/gateway-api-dialog";
import { useMachines } from "@/hooks/use-machines";
import * as gatewayApiApi from "@/api/gateway-api";
import { toast } from "sonner";
import type { GatewayApiDefinition } from "@/types/gateway";

const matchStrategyMap: Record<number, string> = { 0: "URL", 1: "精确", 2: "正则", 3: "前缀" };

export default function GatewayApiPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<GatewayApiDefinition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewayApiDefinition | null>(null);

  const mp = selectedMachine.split(":");
  const ip = mp[0] || undefined;
  const port = mp[1] ? Number(mp[1]) : undefined;

  const { data: apis = [] } = useQuery({
    queryKey: ["gateway-api", app, ip, port],
    queryFn: async () => { const res = await gatewayApiApi.getGatewayApiList(app, ip, port); return res.data || []; },
    enabled: !!app,
  });

  const addMut = useMutation({
    mutationFn: gatewayApiApi.addGatewayApi,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-api"] }); toast.success("添加成功"); } else toast.error(res.msg); },
  });
  const updateMut = useMutation({
    mutationFn: gatewayApiApi.updateGatewayApi,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-api"] }); toast.success("更新成功"); } else toast.error(res.msg); },
  });
  const deleteMut = useMutation({
    mutationFn: gatewayApiApi.deleteGatewayApi,
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["gateway-api"] }); toast.success("删除成功"); } else toast.error(res.msg); },
  });

  const handleSubmit = useCallback((rule: GatewayApiDefinition) => {
    const payload = { ...rule, app };
    if (rule.id) updateMut.mutate(payload);
    else addMut.mutate(payload);
  }, [app, addMut, updateMut]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">API 管理 — {app}</h1>
      <div className="flex items-center gap-2">
        <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
        <Button size="sm" onClick={() => { setEditRule(null); setDialogOpen(true); }}>新增 API</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>API 名称</TableHead>
            <TableHead>匹配模式</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apis.map((api) => (
            <TableRow key={api.id}>
              <TableCell>{api.apiName}</TableCell>
              <TableCell>
                {api.predicateItems?.map((p, i) => (
                  <span key={i} className="text-sm">
                    {matchStrategyMap[p.matchStrategy] ?? p.matchStrategy}: {p.pattern}
                    {i < (api.predicateItems?.length ?? 0) - 1 ? "; " : ""}
                  </span>
                ))}
              </TableCell>
              <TableCell className="space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditRule(api); setDialogOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(api)}>删除</Button>
              </TableCell>
            </TableRow>
          ))}
          {apis.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">暂无数据</TableCell></TableRow>}
        </TableBody>
      </Table>
      <GatewayApiDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editRule} onSubmit={handleSubmit} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} title="确认删除" description={`确定要删除 API「${deleteTarget?.apiName}」吗？`} onConfirm={() => { if (deleteTarget?.id) deleteMut.mutate(deleteTarget.id); setDeleteTarget(null); }} />
    </div>
  );
}
