import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { FlowRule } from "@/types/rule";

interface FormValues {
  resource: string;
  limitApp: string;
  grade: number;
  count: number;
  strategy: number;
  refResource?: string;
  controlBehavior: number;
  warmUpPeriodSec?: number;
  maxQueueingTimeMs?: number;
  clusterMode: boolean;
  clusterConfig?: {
    thresholdType?: number;
    fallbackToLocalWhenFail?: boolean;
  };
}

interface FlowRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: FlowRule | null;
  onSubmit: (data: FlowRule) => void;
}

const defaults: FormValues = {
  resource: "", limitApp: "default", grade: 1, count: 0,
  strategy: 0, controlBehavior: 0, warmUpPeriodSec: 10,
  maxQueueingTimeMs: 500, clusterMode: false,
  clusterConfig: { thresholdType: 0, fallbackToLocalWhenFail: true },
};

const gradeLabels: Record<string, string> = { "1": "QPS", "0": "并发线程数" };
const strategyLabels: Record<string, string> = { "0": "直接", "1": "关联", "2": "链路" };
const behaviorLabels: Record<string, string> = { "0": "快速失败", "1": "Warm Up", "2": "排队等待" };

export function FlowRuleDialog({ open, onOpenChange, rule, onSubmit }: FlowRuleDialogProps) {
  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset({
        ...defaults,
        ...rule,
        clusterConfig: { ...defaults.clusterConfig, ...rule?.clusterConfig },
      });
    }
  }, [open, rule, reset]);

  const grade = useWatch({ control, name: "grade" });
  const strategy = useWatch({ control, name: "strategy" });
  const controlBehavior = useWatch({ control, name: "controlBehavior" });
  const clusterMode = useWatch({ control, name: "clusterMode" });
  const thresholdType = useWatch({ control, name: "clusterConfig.thresholdType" }) ?? 0;
  const fallbackToLocal = useWatch({ control, name: "clusterConfig.fallbackToLocalWhenFail" }) ?? true;

  const onFormSubmit = (data: FormValues) => {
    onSubmit({ ...rule, ...data } as FlowRule);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑流控规则" : "新增流控规则"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>资源名</Label>
            <Input {...register("resource", { required: "资源名不能为空" })} />
            {errors.resource && <p className="text-sm text-destructive">{errors.resource.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>来源应用</Label>
            <Input {...register("limitApp", { required: "来源应用不能为空" })} placeholder="default" />
            {errors.limitApp && <p className="text-sm text-destructive">{errors.limitApp.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>阈值类型</Label>
              <Select value={String(grade)} onValueChange={(v) => setValue("grade", Number(v))}>
                <SelectTrigger><SelectValue>{(v: string | null) => gradeLabels[v ?? ""] ?? v}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">QPS</SelectItem>
                  <SelectItem value="0">并发线程数</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" {...register("count", { valueAsNumber: true, required: "阈值不能为空", min: { value: 0, message: "阈值不能为负" } })} />
              {errors.count && <p className="text-sm text-destructive">{errors.count.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>流控模式</Label>
              <Select value={String(strategy)} onValueChange={(v) => setValue("strategy", Number(v))}>
                <SelectTrigger><SelectValue>{(v: string | null) => strategyLabels[v ?? ""] ?? v}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">直接</SelectItem>
                  <SelectItem value="1">关联</SelectItem>
                  <SelectItem value="2">链路</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>流控效果</Label>
              <Select value={String(controlBehavior)} onValueChange={(v) => setValue("controlBehavior", Number(v))}>
                <SelectTrigger><SelectValue>{(v: string | null) => behaviorLabels[v ?? ""] ?? v}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">快速失败</SelectItem>
                  <SelectItem value="1">Warm Up</SelectItem>
                  <SelectItem value="2">排队等待</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {strategy !== 0 && (
            <div className="space-y-2">
              <Label>关联资源</Label>
              <Input {...register("refResource", { required: "关联资源不能为空" })} />
              {errors.refResource && <p className="text-sm text-destructive">{errors.refResource.message}</p>}
            </div>
          )}
          {controlBehavior === 1 && (
            <div className="space-y-2">
              <Label>预热时长 (秒)</Label>
              <Input type="number" min="1" {...register("warmUpPeriodSec", { valueAsNumber: true, required: "预热时长不能为空", min: { value: 1, message: "预热时长至少为 1 秒" } })} />
              {errors.warmUpPeriodSec && <p className="text-sm text-destructive">{errors.warmUpPeriodSec.message}</p>}
            </div>
          )}
          {controlBehavior === 2 && (
            <div className="space-y-2">
              <Label>最大排队等待时长 (ms)</Label>
              <Input type="number" min="0" {...register("maxQueueingTimeMs", { valueAsNumber: true, required: "排队时长不能为空", min: { value: 0, message: "排队时长不能为负" } })} />
              {errors.maxQueueingTimeMs && <p className="text-sm text-destructive">{errors.maxQueueingTimeMs.message}</p>}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox checked={clusterMode} onCheckedChange={(v) => setValue("clusterMode", !!v)} />
            <Label>集群模式</Label>
          </div>
          {clusterMode && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label>集群阈值模式</Label>
                <Select value={String(thresholdType)} onValueChange={(v) => setValue("clusterConfig.thresholdType", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">单机均摊</SelectItem><SelectItem value="1">总体阈值</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={fallbackToLocal} onCheckedChange={(v) => setValue("clusterConfig.fallbackToLocalWhenFail", !!v)} />
                <Label>Token Server 不可用时退化为单机限流</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit">确认</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
