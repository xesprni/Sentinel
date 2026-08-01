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
import type { GatewayApiDefinition, GatewayApiPredicateItem } from "@/types/gateway";

interface GatewayApiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: GatewayApiDefinition | null;
  onSubmit: (data: GatewayApiDefinition) => void;
}

const matchLabels: Record<string, string> = { "0": "精确", "1": "前缀", "2": "正则" };

export function GatewayApiDialog({ open, onOpenChange, rule, onSubmit }: GatewayApiDialogProps) {
  const [apiName, setApiName] = useState(rule?.apiName || "");
  const [items, setItems] = useState<GatewayApiPredicateItem[]>(
    rule?.predicateItems?.length ? rule.predicateItems : [{ pattern: "", matchStrategy: 0 }],
  );

  const handleSubmit = () => {
    onSubmit({
      ...rule,
      apiName,
      predicateItems: items.filter((i) => i.pattern),
    });
    onOpenChange(false);
  };

  const updateItem = (index: number, field: keyof GatewayApiPredicateItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "编辑 API" : "新增 API"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API 名称</Label>
            <Input value={apiName} disabled={!!rule?.id} onChange={(e) => setApiName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>匹配模式</Label>
              <Button variant="outline" size="sm" onClick={() => setItems([...items, { pattern: "", matchStrategy: 0 }])}>
                添加
              </Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div>
                  <Input
                    placeholder="匹配模式"
                    value={item.pattern}
                    onChange={(e) => updateItem(idx, "pattern", e.target.value)}
                  />
                </div>
                <Select
                  value={String(item.matchStrategy)}
                  onValueChange={(v) => updateItem(idx, "matchStrategy", Number(v))}
                >
                  <SelectTrigger className="w-32"><SelectValue>{(v: string | null) => matchLabels[v ?? ""] ?? v}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">精确</SelectItem>
                    <SelectItem value="1">前缀</SelectItem>
                    <SelectItem value="2">正则</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  删除
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={!apiName.trim() || items.some((item) => !item.pattern.trim())}>确认</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
