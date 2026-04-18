import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <SelectValue placeholder="选择机器" />
      </SelectTrigger>
      <SelectContent>
        {machines.map((m) => (
          <SelectItem key={`${m.ip}:${m.port}`} value={`${m.ip}:${m.port}`}>
            {m.hostname || m.ip}:{m.port}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
