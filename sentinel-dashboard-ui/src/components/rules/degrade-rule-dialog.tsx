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

export function DegradeRuleDialog({ open, onOpenChange, rule, onSubmit }: DegradeRuleDialogProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: rule ?? {
      resource: "", limitApp: "default", grade: 0, count: 0,
      timeWindow: 10, minRequestAmount: 5, statIntervalMs: 1000,
    },
  });

  const grade = watch("grade");

  const onFormSubmit = (data: FormValues) => {
    onSubmit({ ...rule, ...data } as DegradeRule);
    reset();
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
            <Input {...register("limitApp")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>熔断策略</Label>
              <Select value={String(grade)} onValueChange={(v) => { if (v !== null) setValue("grade", Number(v)); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">慢调用比例</SelectItem>
                  <SelectItem value="1">异常比例</SelectItem>
                  <SelectItem value="2">异常数</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" step="any" {...register("count", { valueAsNumber: true })} />
            </div>
          </div>
          {grade === 0 && (
            <div className="space-y-2">
              <Label>慢调用比例阈值 (0~1)</Label>
              <Input type="number" step="0.01" min="0" max="1" {...register("slowRatioThreshold", { valueAsNumber: true })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>熔断时长 (秒)</Label>
              <Input type="number" {...register("timeWindow", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>最小请求数</Label>
              <Input type="number" {...register("minRequestAmount", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>统计时长 (ms)</Label>
            <Input type="number" {...register("statIntervalMs", { valueAsNumber: true })} />
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
