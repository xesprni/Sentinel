import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GatewayFlowRule } from "@/types/gateway";

interface GatewayFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: GatewayFlowRule | null;
  onSubmit: (data: GatewayFlowRule) => void;
}

const defaults: GatewayFlowRule = {
  resource: "",
  resourceMode: 0,
  grade: 1,
  count: 0,
  interval: 1,
  intervalUnit: 0,
  controlBehavior: 0,
  burst: 0,
  maxQueueingTimeoutMs: 0,
};

export function GatewayFlowDialog({ open, onOpenChange, rule, onSubmit }: GatewayFlowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{rule?.id ? "编辑网关流控规则" : "新增网关流控规则"}</DialogTitle></DialogHeader>
        {open && <GatewayFlowEditor key={rule?.id ?? `${rule?.resource ?? "new"}-${rule?.ip ?? ""}-${rule?.port ?? ""}`} rule={rule} onSubmit={onSubmit} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

function GatewayFlowEditor({ rule, onSubmit, onOpenChange }: Omit<GatewayFlowDialogProps, "open">) {
  const [form, setForm] = useState<GatewayFlowRule>({ ...defaults, ...rule });
  const [useParam, setUseParam] = useState(!!rule?.paramItem);
  const update = <K extends keyof GatewayFlowRule>(key: K, value: GatewayFlowRule[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateParam = (patch: Partial<NonNullable<GatewayFlowRule["paramItem"]>>) => {
    setForm((current) => ({ ...current, paramItem: { parseStrategy: 0, ...current.paramItem, ...patch } }));
  };
  const submit = () => {
    onSubmit({ ...form, paramItem: useParam ? (form.paramItem || { parseStrategy: 0 }) : undefined });
    onOpenChange(false);
  };
  const parseStrategy = form.paramItem?.parseStrategy ?? 0;
  const valid = form.resource.trim() !== "" && form.count >= 0 && (form.interval ?? 0) > 0
    && (form.controlBehavior !== 0 || (form.burst ?? 0) >= 0)
    && (form.controlBehavior !== 2 || (form.maxQueueingTimeoutMs ?? 0) >= 0)
    && (!useParam || parseStrategy < 2 || !!form.paramItem?.fieldName?.trim());

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>API / 路由 ID</Label><Input value={form.resource} onChange={(event) => update("resource", event.target.value)} /></div>
        <div className="space-y-2"><Label>资源类型</Label><Select value={String(form.resourceMode)} onValueChange={(value) => update("resourceMode", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Route ID</SelectItem><SelectItem value="1">API 分组</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2"><Label>阈值类型</Label><Select value={String(form.grade)} onValueChange={(value) => update("grade", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">QPS</SelectItem><SelectItem value="0">线程数</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>阈值</Label><Input type="number" value={form.count} onChange={(event) => update("count", Number(event.target.value))} /></div>
        <div className="space-y-2"><Label>统计间隔</Label><Input type="number" value={form.interval ?? 1} onChange={(event) => update("interval", Number(event.target.value))} /></div>
        <div className="space-y-2"><Label>间隔单位</Label><Select value={String(form.intervalUnit ?? 0)} onValueChange={(value) => update("intervalUnit", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">秒</SelectItem><SelectItem value="1">分</SelectItem><SelectItem value="2">时</SelectItem><SelectItem value="3">天</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>流控效果</Label><Select value={String(form.controlBehavior ?? 0)} onValueChange={(value) => update("controlBehavior", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">快速失败</SelectItem><SelectItem value="2">排队等待</SelectItem></SelectContent></Select></div>
        {form.controlBehavior === 2
          ? <div className="space-y-2"><Label>最大排队时间 (ms)</Label><Input type="number" value={form.maxQueueingTimeoutMs ?? 0} onChange={(event) => update("maxQueueingTimeoutMs", Number(event.target.value))} /></div>
          : <div className="space-y-2"><Label>突发请求额外允许数</Label><Input type="number" value={form.burst ?? 0} onChange={(event) => update("burst", Number(event.target.value))} /></div>}
      </div>

      <div className="space-y-3 rounded-md border bg-muted/30 p-3">
        <div className="flex items-center gap-2"><Checkbox checked={useParam} onCheckedChange={(value) => setUseParam(!!value)} /><Label>针对请求属性限流</Label></div>
        {useParam && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>属性来源</Label><Select value={String(parseStrategy)} onValueChange={(value) => updateParam({ parseStrategy: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">Client IP</SelectItem><SelectItem value="1">Remote Host</SelectItem><SelectItem value="2">Header</SelectItem><SelectItem value="3">URL 参数</SelectItem><SelectItem value="4">Cookie</SelectItem></SelectContent></Select></div>
              {parseStrategy >= 2 && <div className="space-y-2"><Label>属性名称</Label><Input value={form.paramItem?.fieldName || ""} onChange={(event) => updateParam({ fieldName: event.target.value })} /></div>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>属性值（可选）</Label><Input value={form.paramItem?.pattern || ""} onChange={(event) => updateParam({ pattern: event.target.value || undefined })} /></div>
              {form.paramItem?.pattern && <div className="space-y-2"><Label>值匹配策略</Label><Select value={String(form.paramItem.matchStrategy ?? 0)} onValueChange={(value) => updateParam({ matchStrategy: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">精确</SelectItem><SelectItem value="3">子串</SelectItem><SelectItem value="2">正则</SelectItem></SelectContent></Select></div>}
            </div>
          </>
        )}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button onClick={submit} disabled={!valid}>确认</Button></DialogFooter>
    </div>
  );
}
