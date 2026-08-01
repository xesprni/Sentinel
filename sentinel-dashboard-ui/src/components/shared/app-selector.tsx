import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor } from "lucide-react";
import type { MachineInfo } from "@/types/app";
import { formatMachineKey } from "@/lib/machine";
import { useEffect } from "react";

interface MachineSelectorProps {
  machines: MachineInfo[];
  value: string;
  onValueChange: (value: string) => void;
}

export function MachineSelector({ machines, value, onValueChange }: MachineSelectorProps) {
  // Build a label map so SelectValue can display machine names instead of raw "ip:port"
  const labelMap: Record<string, string> = {};
  for (const m of machines) {
    labelMap[formatMachineKey(m.ip, m.port)] = `${m.hostname || m.ip}:${m.port}`;
  }

  useEffect(() => {
    if (!value && machines.length > 0) {
      const preferred = machines.find((machine) => machine.healthy) || machines[0];
      onValueChange(formatMachineKey(preferred.ip, preferred.port));
    }
  }, [machines, onValueChange, value]);

  return (
    <Select value={value} onValueChange={(v) => { if (v !== null) onValueChange(v); }}>
      <SelectTrigger className="w-[260px]">
        <Monitor className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
        <SelectValue placeholder={machines.length === 0 ? "暂无可用机器" : "选择机器"}>
          {(v: string | null) => v ? (labelMap[v] ?? v) : (machines.length === 0 ? "暂无可用机器" : "选择机器")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {machines.map((m) => (
          <SelectItem key={formatMachineKey(m.ip, m.port)} value={formatMachineKey(m.ip, m.port)}>
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
