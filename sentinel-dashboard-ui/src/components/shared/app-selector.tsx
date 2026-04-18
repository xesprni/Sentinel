import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor } from "lucide-react";
import type { MachineInfo } from "@/types/app";

interface MachineSelectorProps {
  machines: MachineInfo[];
  value: string;
  onValueChange: (value: string) => void;
}

export function MachineSelector({ machines, value, onValueChange }: MachineSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => { if (v !== null) onValueChange(v); }}>
      <SelectTrigger className="w-[260px]">
        <Monitor className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
        <SelectValue placeholder={machines.length === 0 ? "暂无可用机器" : "选择机器"} />
      </SelectTrigger>
      <SelectContent>
        {machines.map((m) => (
          <SelectItem key={`${m.ip}:${m.port}`} value={`${m.ip}:${m.port}`}>
            <span className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${m.healthy ? "bg-emerald-500" : "bg-gray-300"}`} />
              {m.hostname || m.ip}:{m.port}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
