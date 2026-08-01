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
import type { DegradeRule } from "@/types/rule";

interface FormValues {
  resource: string;
  limitApp: string;
  grade: number;
  count: number;
  timeWindow: number;
  minRequestAmount: number;
  statIntervalMs: number;
  slowRatioThreshold?: number;
}

interface DegradeRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: DegradeRule | null;
  onSubmit: (data: DegradeRule) => void;
}

const degradeLabels: Record<string, string> = { "0": "慢调用比例", "1": "异常比例", "2": "异常数" };

const defaults: FormValues = {
  resource: "", limitApp: "default", grade: 0, count: 0,
  timeWindow: 10, minRequestAmount: 5, statIntervalMs: 1000,
  slowRatioThreshold: 0.5,
};

export function DegradeRuleDialog({ open, onOpenChange, rule, onSubmit }: DegradeRuleDialogProps) {
  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset({ ...defaults, ...rule });
    }
  }, [open, rule, reset]);

  const grade = useWatch({ control, name: "grade" });

  const onFormSubmit = (data: FormValues) => {
    onSubmit({ ...rule, ...data } as DegradeRule);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑熔断规则" : "新增熔断规则"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>资源名</Label>
            <Input {...register("resource", { required: "资源名不能为空" })} />
            {errors.resource && <p className="text-sm text-destructive">{errors.resource.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>来源应用</Label>
            <Input {...register("limitApp", { required: "来源应用不能为空" })} />
            {errors.limitApp && <p className="text-sm text-destructive">{errors.limitApp.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>熔断策略</Label>
              <Select value={String(grade)} onValueChange={(v) => setValue("grade", Number(v))}>
                <SelectTrigger><SelectValue>{(v: string | null) => degradeLabels[v ?? ""] ?? v}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">慢调用比例</SelectItem>
                  <SelectItem value="1">异常比例</SelectItem>
                  <SelectItem value="2">异常数</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" step="any" min="0" max={grade === 1 ? 1 : undefined} {...register("count", {
                valueAsNumber: true,
                required: "阈值不能为空",
                min: { value: 0, message: "阈值不能为负" },
                validate: (value) => grade !== 1 || value <= 1 || "异常比例阈值必须在 0~1",
              })} />
              {errors.count && <p className="text-sm text-destructive">{errors.count.message}</p>}
            </div>
          </div>
          {grade === 0 && (
            <div className="space-y-2">
              <Label>慢调用比例阈值 (0~1)</Label>
              <Input type="number" step="0.01" min="0" max="1" {...register("slowRatioThreshold", { valueAsNumber: true, required: "慢调用比例不能为空", min: 0, max: 1 })} />
              {errors.slowRatioThreshold && <p className="text-sm text-destructive">慢调用比例必须在 0~1</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>熔断时长 (秒)</Label>
              <Input type="number" min="1" {...register("timeWindow", { valueAsNumber: true, required: true, min: 1 })} />
              {errors.timeWindow && <p className="text-sm text-destructive">熔断时长必须大于 0</p>}
            </div>
            <div className="space-y-2">
              <Label>最小请求数</Label>
              <Input type="number" min="1" {...register("minRequestAmount", { valueAsNumber: true, required: true, min: 1 })} />
              {errors.minRequestAmount && <p className="text-sm text-destructive">最小请求数必须大于 0</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>统计时长 (ms)</Label>
            <Input type="number" min="1" {...register("statIntervalMs", { valueAsNumber: true, required: true, min: 1 })} />
            {errors.statIntervalMs && <p className="text-sm text-destructive">统计时长必须大于 0</p>}
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
