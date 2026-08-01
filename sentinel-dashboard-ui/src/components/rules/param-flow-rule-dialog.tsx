import { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ParamFlowRule, ParamFlowItem } from "@/types/rule";

interface FormValues {
  resource: string;
  grade: number;
  paramIdx: number;
  count: number;
  durationInSec: number;
  controlBehavior: number;
  maxQueueingTimeMs: number;
  burstCount: number;
  clusterMode: boolean;
  clusterConfig?: {
    thresholdType?: number;
    fallbackToLocalWhenFail?: boolean;
  };
  paramFlowItemList: ParamFlowItem[];
}

interface ParamFlowRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ParamFlowRule | null;
  onSubmit: (data: ParamFlowRule) => void;
}

const defaults: FormValues = {
  resource: "", grade: 1, paramIdx: 0, count: 0,
  durationInSec: 1, controlBehavior: 0, maxQueueingTimeMs: 0, burstCount: 0,
  clusterMode: false,
  clusterConfig: { thresholdType: 0, fallbackToLocalWhenFail: true },
  paramFlowItemList: [],
};

export function ParamFlowRuleDialog({ open, onOpenChange, rule, onSubmit }: ParamFlowRuleDialogProps) {
  const { register, handleSubmit, setValue, reset, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset({ ...defaults, ...rule, paramFlowItemList: rule?.paramFlowItemList || [] });
    }
  }, [open, rule, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "paramFlowItemList" });
  const clusterMode = useWatch({ control, name: "clusterMode" });
  const thresholdType = useWatch({ control, name: "clusterConfig.thresholdType" }) ?? 0;
  const fallbackToLocal = useWatch({ control, name: "clusterConfig.fallbackToLocalWhenFail" }) ?? true;

  const onFormSubmit = (data: FormValues) => {
    const payload: ParamFlowRule = { ...data, limitApp: rule?.limitApp || "default" };
    onSubmit({ ...rule, ...payload });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑热点规则" : "新增热点规则"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>资源名</Label>
              <Input {...register("resource", { required: "资源名不能为空" })} />
              {errors.resource && <p className="text-xs text-destructive">{errors.resource.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>参数索引</Label>
              <Input type="number" min="0" {...register("paramIdx", { valueAsNumber: true, required: "参数索引不能为空", min: { value: 0, message: "参数索引不能小于 0" } })} />
              {errors.paramIdx && <p className="text-xs text-destructive">{errors.paramIdx.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" min="0" {...register("count", { valueAsNumber: true, required: "阈值不能为空", min: { value: 0, message: "阈值不能小于 0" } })} />
              {errors.count && <p className="text-xs text-destructive">{errors.count.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>统计窗口时长 (秒)</Label>
              <Input type="number" min="1" {...register("durationInSec", { valueAsNumber: true, required: "窗口时长不能为空", min: { value: 1, message: "窗口时长至少为 1 秒" } })} />
              {errors.durationInSec && <p className="text-xs text-destructive">{errors.durationInSec.message}</p>}
            </div>
          </div>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>参数例外项</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ object: "", classType: "int", count: 0 })}>
                添加
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
                <div>
                  <Label className="text-xs">参数值</Label>
                  <Input {...register(`paramFlowItemList.${index}.object`, { required: "参数值不能为空" })} />
                  {errors.paramFlowItemList?.[index]?.object && <p className="text-xs text-destructive">{errors.paramFlowItemList[index]?.object?.message}</p>}
                </div>
                <div>
                  <Label className="text-xs">类型</Label>
                  <select className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm" {...register(`paramFlowItemList.${index}.classType`, { required: true })}>
                    {['int', 'double', 'java.lang.String', 'long', 'float', 'char', 'byte'].map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">阈值</Label>
                  <Input type="number" min="0" className="w-20" {...register(`paramFlowItemList.${index}.count`, { valueAsNumber: true, required: true, min: 0 })} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>删除</Button>
              </div>
            ))}
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
