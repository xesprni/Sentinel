import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import type { ParamFlowRule, ParamFlowItem } from "@/types/rule";

interface FormValues {
  resource: string;
  grade: number;
  paramIdx: number;
  count: number;
  durationInSec: number;
  clusterMode: boolean;
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
  durationInSec: 1, clusterMode: false, paramFlowItemList: [],
};

export function ParamFlowRuleDialog({ open, onOpenChange, rule, onSubmit }: ParamFlowRuleDialogProps) {
  const { register, handleSubmit, setValue, watch, reset, control } = useForm<FormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) {
      reset(rule ?? defaults);
    }
  }, [open, rule, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "paramFlowItemList" });
  const clusterMode = watch("clusterMode");

  const onFormSubmit = (data: FormValues) => {
    const payload: ParamFlowRule = { ...data, limitApp: "default" };
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
            </div>
            <div className="space-y-2">
              <Label>参数索引</Label>
              <Input type="number" {...register("paramIdx", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>阈值</Label>
              <Input type="number" {...register("count", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>统计窗口时长 (秒)</Label>
              <Input type="number" {...register("durationInSec", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={clusterMode} onCheckedChange={(v) => setValue("clusterMode", !!v)} />
            <Label>集群模式</Label>
          </div>
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
                  <Input {...register(`paramFlowItemList.${index}.object`)} />
                </div>
                <div>
                  <Label className="text-xs">类型</Label>
                  <Input {...register(`paramFlowItemList.${index}.classType`)} />
                </div>
                <div>
                  <Label className="text-xs">阈值</Label>
                  <Input type="number" className="w-20" {...register(`paramFlowItemList.${index}.count`, { valueAsNumber: true })} />
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
