import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "react-router-dom";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const app = searchParams.get("app");

  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-4 shrink-0">
      <Button variant="ghost" size="sm" onClick={onToggleSidebar}>
        ☰
      </Button>
      <span className="font-semibold">Sentinel 控制台</span>
      {app && (
        <span className="text-sm text-muted-foreground">/ {app}</span>
      )}
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={signOut}>
        退出登录
      </Button>
    </header>
  );
}
