import React, { useState } from "react";
import { Server, Lock, User, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface LoginViewProps {
  onSuccess: (username: string) => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, password);
      toast.success("Welcome back!", {
        description: `Authenticated as ${res.username}`,
      });
      onSuccess(res.username);
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please verify your password.";
      setError(msg);
      toast.error("Authentication failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#050508] relative overflow-hidden">
      {/* High-tech Charm Red ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-rose-600/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-red-600/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Symmetrical Centered Login Card */}
      <div className="w-full max-w-md relative z-10">
        <Card className="border border-rose-500/25 bg-zinc-950/85 backdrop-blur-2xl shadow-[0_0_40px_rgba(225,29,72,0.18)] p-2 sm:p-4 transition-all">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600/15 border border-rose-500/35 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
              <Server className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-widest text-zinc-100 flex items-center justify-center gap-2">
                PIXANDCO
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1.5 font-mono">
                VPS Control Portal &bull; <span className="text-rose-300 font-medium">172.255.210.203</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-zinc-300">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-9 h-10 border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-zinc-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 h-10 border-zinc-800 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs mt-2 gap-2 shadow-[0_0_20px_rgba(225,29,72,0.35)] transition-all"
              >
                {loading ? "Authenticating..." : "Sign In to VPS Nexus"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> JWT HttpOnly Session
              </span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                <Zap className="h-3 w-3 text-rose-500" /> TLS / Port 80 &bull; 443
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
