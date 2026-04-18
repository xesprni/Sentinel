import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GatewayFlowRule } from "@/types/gateway";

interface GatewayFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: GatewayFlowRule | null;
  onSubmit: (data: GatewayFlowRule) => void;
}

export function GatewayFlowDialog({ open, onOpenChange, rule, onSubmit }: GatewayFlowDialogProps) {
  const [form, setForm] = useState<GatewayFlowRule>(
    rule ?? {
      resource: "", resourceMode: 0, grade: 1, count: 0,
      intervalSec: 1, controlBehavior: 0,
    },
  );

  const update = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑网关流控规则" : "新增网关流控规则"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API / 路由 ID</Label>
              <Input value={form.resource} onChange={(e) => update("resource", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>资源类型</Label>
              <Select value={String(form.resourceMode)} onValueChange={(v) => update("resourceMode", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Route ID</SelectItem>
                  <SelectItem value="1">API 分组</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" value={form.count} onChange={(e) => update("count", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>间隔 (秒)</Label>
              <Input type="number" value={form.intervalSec ?? 1} onChange={(e) => update("intervalSec", Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>流控效果</Label>
            <Select value={String(form.controlBehavior ?? 0)} onValueChange={(v) => update("controlBehavior", Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">快速失败</SelectItem>
                <SelectItem value="2">排队等待</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleSubmit}>确认</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
