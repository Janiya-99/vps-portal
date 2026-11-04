import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, ExternalLink, Copy, Check, Shield, Server } from "lucide-react";
import { toast } from "sonner";

export function PhpMyAdminCard() {
  const [copied, setCopied] = useState(false);
  const mysqlPass = "7axxwAI6Ru2aDBXQoOnAdTxV";

  const handleCopyPass = () => {
    navigator.clipboard.writeText(mysqlPass);
    setCopied(true);
    toast.success("MySQL Root Password Copied to Clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-rose-500/25 bg-gradient-to-br from-zinc-950 via-zinc-950 to-rose-950/20 shadow-[0_0_25px_rgba(225,29,72,0.12)] p-5 relative overflow-hidden">
      {/* Decorative Charm Red Background Glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <CardContent className="p-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.25)]">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                  phpMyAdmin Visual Studio
                </h3>
                <Badge variant="emerald" className="text-[10px] uppercase font-mono">
                  Online :8085
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Full-featured graphical administration console for MySQL databases &amp; tables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://172.255.210.203:8085"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-semibold text-white shadow-[0_0_18px_rgba(225,29,72,0.35)] transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Launch phpMyAdmin ↗
            </a>
          </div>
        </div>

        {/* Credentials & Connection Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* 1. Host Target */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-1">
            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Server className="h-3 w-3 text-rose-400" />
              Target Host
            </div>
            <div className="font-mono text-xs text-zinc-200">
              shared-mysql:3306
            </div>
          </div>

          {/* 2. Root User */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-1">
            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              Default User
            </div>
            <div className="font-mono text-xs text-zinc-200">
              root
            </div>
          </div>

          {/* 3. Password Helper */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 space-y-1 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
              Root Password
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-400">••••••••••••••••</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPass}
                className="h-6 px-2 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
