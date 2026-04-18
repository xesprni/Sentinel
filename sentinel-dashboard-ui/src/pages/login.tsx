import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

function MorphBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />
      <div className="login-blob login-blob-4" />
      <div className="login-blob login-blob-5" />
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn({ username, password });
    if (res.success) {
      navigate("/dashboard/home");
    } else {
      toast.error(res.msg || "登录失败");
    }
  };

  return (
    <div className="login-bg min-h-screen flex">
      {/* Left panel — branding with morphing blobs */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center text-white p-12">
        <MorphBlobs />
        <div className="relative z-10 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Sentinel</h1>
          <p className="text-lg text-white/70 max-w-sm mx-auto leading-relaxed">
            面向分布式系统的流量防护组件，提供流控、熔断与系统保护能力
          </p>
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-white/50">
            <span>流控规则</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>熔断降级</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>系统保护</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile branding */}
          <div className="lg:hidden text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Sentinel 控制台</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">欢迎回来</h2>
            <p className="text-muted-foreground text-sm">登录到 Sentinel 控制台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                记住我
              </Label>
            </div>
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "登录中..." : "登 录"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Alibaba Sentinel &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
