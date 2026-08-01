import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useParams, Link } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, LogOut, Shield, ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface HeaderProps {
  onToggleSidebar: () => void;
  collapsed: boolean;
}

export function Header({ onToggleSidebar, collapsed }: HeaderProps) {
  const { signOut } = useAuth();
  const { app } = useParams<{ app: string }>();
  const { theme, toggle } = useTheme();

  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-3 shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="切换侧边栏" onClick={onToggleSidebar}>
        <PanelLeftOpen className="h-4 w-4 md:hidden" />
        {collapsed ? <PanelLeftOpen className="hidden h-4 w-4 md:block" /> : <PanelLeftClose className="hidden h-4 w-4 md:block" />}
      </Button>
      <nav className="flex items-center gap-1 text-sm">
        <Link to="/dashboard/home" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Sentinel</span>
        </Link>
        {app && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{app}</span>
          </>
        )}
      </nav>
      <div className="flex-1" />
      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={theme === "dark" ? "切换到浅色模式" : "切换到深色模式"} onClick={toggle}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={signOut} aria-label="退出登录" className="px-2 text-muted-foreground hover:text-destructive sm:px-3">
        <LogOut className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline">退出</span>
      </Button>
    </header>
  );
}
