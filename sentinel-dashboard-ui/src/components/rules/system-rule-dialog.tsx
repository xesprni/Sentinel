import { useState, useEffect } from "react";
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
import type { SystemRule } from "@/types/rule";

const thresholdTypes = [
  { value: "highestSystemLoad", label: "Load" },
  { value: "highestCpuUsage", label: "CPU 使用率 (%)" },
  { value: "avgRt", label: "平均 RT (ms)" },
  { value: "maxThread", label: "并发线程数" },
  { value: "qps", label: "入口 QPS" },
];

interface SystemRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: SystemRule | null;
  onSubmit: (data: SystemRule) => void;
}

function detectType(rule: SystemRule | null | undefined): string {
  if (!rule) return "highestSystemLoad";
  if (rule.highestSystemLoad !== undefined) return "highestSystemLoad";
  if (rule.highestCpuUsage !== undefined) return "highestCpuUsage";
  if (rule.avgRt !== undefined) return "avgRt";
  if (rule.maxThread !== undefined) return "maxThread";
  return "qps";
}

export function SystemRuleDialog({ open, onOpenChange, rule, onSubmit }: SystemRuleDialogProps) {
  const [type, setType] = useState(detectType(rule));
  const [value, setValue] = useState(() => {
    if (!rule) return "0";
    return String((rule as Record<string, unknown>)[detectType(rule)] ?? 0);
  });

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const t = detectType(rule);
      setType(t);
      setValue(rule ? String((rule as Record<string, unknown>)[t] ?? 0) : "0");
    }
  }, [open, rule]);

  const handleSubmit = () => {
    const numVal = Number(value);
    const result: SystemRule = { ...rule };
    delete result.highestSystemLoad;
    delete result.highestCpuUsage;
    delete result.avgRt;
    delete result.maxThread;
    delete result.qps;
    (result as Record<string, unknown>)[type] = numVal;
    onSubmit(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑系统规则" : "新增系统规则"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={type} onValueChange={setType}>
            {thresholdTypes.map((t) => (
              <div key={t.value} className="flex items-center space-x-2">
                <RadioGroupItem value={t.value} id={t.value} />
                <Label htmlFor={t.value}>{t.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="space-y-2">
            <Label>阈值</Label>
            <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} />
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
