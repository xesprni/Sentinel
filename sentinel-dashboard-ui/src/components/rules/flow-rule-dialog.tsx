import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
}

interface FlowRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: FlowRule | null;
  onSubmit: (data: FlowRule) => void;
}

const defaults: FormValues = {
  resource: "", limitApp: "default", grade: 1, count: 0,
  strategy: 0, controlBehavior: 0, clusterMode: false,
};

const gradeLabels: Record<string, string> = { "1": "QPS", "0": "并发线程数" };
const strategyLabels: Record<string, string> = { "0": "直接", "1": "关联", "2": "链路" };
const behaviorLabels: Record<string, string> = { "0": "快速失败", "1": "Warm Up", "2": "排队等待", "3": "预热+排队" };

export function FlowRuleDialog({ open, onOpenChange, rule, onSubmit }: FlowRuleDialogProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset(rule ?? defaults);
    }
  }, [open, rule, reset]);

  const grade = watch("grade");
  const strategy = watch("strategy");
  const controlBehavior = watch("controlBehavior");
  const clusterMode = watch("clusterMode");

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
            <Input {...register("limitApp")} placeholder="default" />
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
              <Input type="number" {...register("count", { valueAsNumber: true, min: { value: 0, message: "阈值不能为负" } })} />
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
                  <SelectItem value="3">预热+排队</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {strategy !== 0 && (
            <div className="space-y-2">
              <Label>关联资源</Label>
              <Input {...register("refResource")} />
            </div>
          )}
          {controlBehavior === 1 && (
            <div className="space-y-2">
              <Label>预热时长 (秒)</Label>
              <Input type="number" {...register("warmUpPeriodSec", { valueAsNumber: true })} />
            </div>
          )}
          {controlBehavior === 2 && (
            <div className="space-y-2">
              <Label>最大排队等待时长 (ms)</Label>
              <Input type="number" {...register("maxQueueingTimeMs", { valueAsNumber: true })} />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox checked={clusterMode} onCheckedChange={(v) => setValue("clusterMode", !!v)} />
            <Label>集群模式</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="submit">确认</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
