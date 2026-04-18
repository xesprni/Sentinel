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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AuthorityRule } from "@/types/rule";

interface FormValues {
  resource: string;
  limitApp: string;
  strategy: number;
}

interface AuthorityRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: AuthorityRule | null;
  onSubmit: (data: AuthorityRule) => void;
}

export function AuthorityRuleDialog({ open, onOpenChange, rule, onSubmit }: AuthorityRuleDialogProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: rule ?? { resource: "", limitApp: "", strategy: 0 },
  });

  const strategy = watch("strategy");

  const onFormSubmit = (data: FormValues) => {
    onSubmit({ ...rule, ...data } as AuthorityRule);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑授权规则" : "新增授权规则"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>资源名</Label>
            <Input {...register("resource", { required: "资源名不能为空" })} />
            {errors.resource && <p className="text-sm text-destructive">{errors.resource.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>来源应用</Label>
            <Input {...register("limitApp", { required: "来源应用不能为空" })} placeholder="多个用逗号分隔" />
            {errors.limitApp && <p className="text-sm text-destructive">{errors.limitApp.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>流控模式</Label>
            <RadioGroup value={String(strategy)} onValueChange={(v) => setValue("strategy", Number(v))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="whitelist" />
                <Label htmlFor="whitelist">白名单</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="blacklist" />
                <Label htmlFor="blacklist">黑名单</Label>
              </div>
            </RadioGroup>
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
