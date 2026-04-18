import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineSelector } from "@/components/shared/app-selector";
import { useMachines } from "@/hooks/use-machines";
import { getClusterSingleState, modifyClusterSingleConfig } from "@/api/cluster";
import { toast } from "sonner";

const modeLabels: Record<number, string> = { 0: "未设置", 1: "内嵌", 2: "独立 Client", 3: "独立 Server" };

export default function ClusterSingleConfigPage() {
  const { app = "" } = useParams();
  const qc = useQueryClient();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [mode, setMode] = useState(0);
  const [serverPort, setServerPort] = useState("");

  const mp = selectedMachine.split(":");
  const ip = mp[0] || "";
  const port = mp[1] ? Number(mp[1]) : 0;

  useQuery({
    queryKey: ["cluster-single", app, ip, port],
    queryFn: async () => {
      const res = await getClusterSingleState(app, ip, port);
      if (res.data) {
        const d = res.data;
        setMode(d.server?.mode ?? d.client?.mode ?? 0);
        setServerPort(String(d.server?.port ?? ""));
      }
      return res.data;
    },
    enabled: !!app && !!ip && !!port,
  });

  const saveMut = useMutation({
    mutationFn: () => modifyClusterSingleConfig(app, ip, port, { mode, port: serverPort ? Number(serverPort) : undefined }),
    onSuccess: (res) => { if (res.success) { qc.invalidateQueries({ queryKey: ["cluster-single"] }); toast.success("配置已保存"); } else toast.error(res.msg); },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">集群单机配置 — {app}</h1>
      <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />
      {selectedMachine && (
        <Card>
          <CardHeader>
            <CardTitle>集群模式配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={String(mode)} onValueChange={(v) => setMode(Number(v))}>
              {Object.entries(modeLabels).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`mode-${value}`} />
                  <Label htmlFor={`mode-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
            {mode >= 2 && (
              <div className="space-y-2">
                <Label>Server 端口</Label>
                <Input value={serverPort} onChange={(e) => setServerPort(e.target.value)} placeholder="Server 端口" />
              </div>
            )}
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>保存配置</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
