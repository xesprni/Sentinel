import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineSelector } from "@/components/shared/app-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { useMachines } from "@/hooks/use-machines";
import { getClusterSingleState, modifyClusterSingleConfig } from "@/api/cluster";
import { parseMachineKey } from "@/lib/machine";
import {
  CLUSTER_MODE_CLIENT,
  CLUSTER_MODE_SERVER,
  type ClusterUniversalState,
} from "@/types/cluster";
import { toast } from "sonner";

export default function ClusterSingleConfigPage() {
  const { app = "" } = useParams();
  const { data: machines } = useMachines(app);
  const [selectedMachine, setSelectedMachine] = useState("");
  const { ip, port } = parseMachineKey(selectedMachine);

  const { data: response, isLoading } = useQuery({
    queryKey: ["cluster-single", app, ip, port],
    queryFn: () => getClusterSingleState(app, ip!, port!),
    enabled: !!app && !!ip && !!port,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">集群单机配置</h1>
        <p className="text-sm text-muted-foreground">{app} · 切换 Client/Server 模式并编辑对应运行参数</p>
      </div>
      <MachineSelector machines={machines || []} value={selectedMachine} onValueChange={setSelectedMachine} />

      {!selectedMachine ? (
        <EmptyState title="请先选择一台机器" description="仅显示健康实例，配置会直接推送到所选 Sentinel 客户端" />
      ) : isLoading ? (
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      ) : !response?.success || !response.data ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {response?.code === 4041 ? "当前客户端未引入集群流控依赖或版本低于 1.4.0。" : response?.msg || "集群状态读取失败"}
        </div>
      ) : (
        <ClusterConfigForm key={selectedMachine} app={app} ip={ip!} commandPort={port!} state={response.data} />
      )}
    </div>
  );
}

function ClusterConfigForm({
  app,
  ip,
  commandPort,
  state,
}: {
  app: string;
  ip: string;
  commandPort: number;
  state: ClusterUniversalState;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState(state.stateInfo.mode);
  const [serverHost, setServerHost] = useState(state.client?.clientConfig.serverHost || "");
  const [serverPort, setServerPort] = useState(String(state.client?.clientConfig.serverPort || 18730));
  const [requestTimeout, setRequestTimeout] = useState(String(state.client?.clientConfig.requestTimeout || 20));
  const [tokenServerPort, setTokenServerPort] = useState(String(state.server?.transport?.port || state.server?.port || 18730));
  const [namespaceSet, setNamespaceSet] = useState((state.server?.namespaceSet || ["default", app]).join(", "));
  const [maxAllowedQps, setMaxAllowedQps] = useState(String(state.server?.flow?.maxAllowedQps ?? 30000));

  const saveMut = useMutation({
    mutationFn: () => {
      if (mode === CLUSTER_MODE_CLIENT) {
        return modifyClusterSingleConfig(app, ip, commandPort, {
          mode: CLUSTER_MODE_CLIENT,
          clientConfig: {
            serverHost: serverHost.trim(),
            serverPort: Number(serverPort),
            requestTimeout: Number(requestTimeout),
          },
        });
      }
      return modifyClusterSingleConfig(app, ip, commandPort, {
        mode: CLUSTER_MODE_SERVER,
        transportConfig: {
          ...(state.server?.transport || {}),
          port: Number(tokenServerPort),
        },
        flowConfig: {
          ...(state.server?.flow || {}),
          maxAllowedQps: Number(maxAllowedQps),
        },
        namespaceSet: namespaceSet.split(",").map((item) => item.trim()).filter(Boolean),
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ["cluster-single"] });
        toast.success("集群配置已推送");
      } else {
        toast.error(res.msg || "配置推送失败");
      }
    },
    onError: () => toast.error("配置推送失败"),
  });

  const clientValid = serverHost.trim() !== "" && Number(serverPort) > 0 && Number(serverPort) <= 65535 && Number(requestTimeout) > 0;
  const serverValid = Number(tokenServerPort) > 0 && Number(tokenServerPort) <= 65535 && Number(maxAllowedQps) >= 0 && namespaceSet.trim() !== "";
  const canSave = mode === CLUSTER_MODE_CLIENT ? clientValid : mode === CLUSTER_MODE_SERVER && serverValid;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{ip}:{commandPort}</CardTitle>
        <p className="text-sm text-muted-foreground">
          当前模式：{state.stateInfo.mode === CLUSTER_MODE_CLIENT ? "Client" : state.stateInfo.mode === CLUSTER_MODE_SERVER ? "Server" : "未开启"}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>目标模式</Label>
          <RadioGroup value={String(mode)} onValueChange={(value) => setMode(Number(value))} className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value={String(CLUSTER_MODE_CLIENT)} id="cluster-mode-client" disabled={!state.stateInfo.clientAvailable} />
              <Label htmlFor="cluster-mode-client">Client</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value={String(CLUSTER_MODE_SERVER)} id="cluster-mode-server" disabled={!state.stateInfo.serverAvailable} />
              <Label htmlFor="cluster-mode-server">Server</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === CLUSTER_MODE_CLIENT && state.stateInfo.clientAvailable && (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Token Server IP" value={serverHost} onChange={setServerHost} placeholder="10.0.0.10" />
            <Field label="Token Server 端口" value={serverPort} onChange={setServerPort} type="number" />
            <Field label="请求超时 (ms)" value={requestTimeout} onChange={setRequestTimeout} type="number" />
          </div>
        )}

        {mode === CLUSTER_MODE_SERVER && state.stateInfo.serverAvailable && (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Token Server 端口" value={tokenServerPort} onChange={setTokenServerPort} type="number" />
            <Field label="命名空间（逗号分隔）" value={namespaceSet} onChange={setNamespaceSet} />
            <Field label="最大允许 QPS" value={maxAllowedQps} onChange={setMaxAllowedQps} type="number" />
          </div>
        )}

        {!state.stateInfo.clientAvailable && !state.stateInfo.serverAvailable && (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">该客户端未引入 Sentinel 集群流控 Client 或 Server 依赖。</p>
        )}

        <Button onClick={() => saveMut.mutate()} disabled={!canSave || saveMut.isPending}>
          {saveMut.isPending ? "推送中..." : "保存并推送"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
