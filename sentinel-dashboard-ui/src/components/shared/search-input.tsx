import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder || "搜索..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-[200px]"
    />
  );
}
