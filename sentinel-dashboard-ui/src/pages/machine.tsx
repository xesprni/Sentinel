import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getMachines, removeMachine } from "@/api/app";
import { toast } from "sonner";
import type { MachineInfo } from "@/types/app";

export default function MachinePage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<MachineInfo | null>(null);

  const { data: machines = [] } = useQuery({
    queryKey: ["machines", app],
    queryFn: async () => { const res = await getMachines(app); return res.data || []; },
    enabled: !!app,
    refetchInterval: 10_000,
  });

  const deleteMut = useMutation({
    mutationFn: ({ app, ip, port }: { app: string; ip: string; port: number }) => removeMachine(app, ip, port),
    onSuccess: (res) => {
      if (res.success) { qc.invalidateQueries({ queryKey: ["machines"] }); toast.success("已移除"); }
      else toast.error(res.msg);
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">机器列表 — {app}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>主机名</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>端口</TableHead>
            <TableHead>版本</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {machines.map((m, idx) => (
            <TableRow key={`${m.ip}:${m.port}:${idx}`}>
              <TableCell>{m.hostname}</TableCell>
              <TableCell>{m.ip}</TableCell>
              <TableCell>{m.port}</TableCell>
              <TableCell>{m.version || m.heartbeatVersion}</TableCell>
              <TableCell>
                <Badge variant={m.healthy ? "default" : "destructive"}>
                  {m.healthy ? "健康" : "失联"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(m)}>移除</Button>
              </TableCell>
            </TableRow>
          ))}
          {machines.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">暂无机器</TableCell></TableRow>}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="确认移除"
        description={`确定要移除机器 ${deleteTarget?.ip}:${deleteTarget?.port} 吗？`}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate({ app, ip: deleteTarget.ip, port: deleteTarget.port }); setDeleteTarget(null); }}
      />
    </div>
  );
}
