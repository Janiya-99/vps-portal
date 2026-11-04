import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Database, Zap, RotateCw, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CoreInfraStripProps {
  containers?: any[];
  onRefetch?: () => void;
}

export function CoreInfraStrip({ containers = [], onRefetch }: CoreInfraStripProps) {
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [restarting, setRestarting] = useState<string | null>(null);

  const getContainer = (name: string) => {
    return containers.find((c) => c.name === name || c.name === `/${name}`);
  };

  const handleRestart = async (containerName: string) => {
    setRestarting(containerName);
    setConfirmTarget(null);
    try {
      await api.containerAction(containerName, "restart");
      toast.success(`Restarted ${containerName}`, {
        description: "Service has been restarted successfully.",
      });
      if (onRefetch) onRefetch();
    } catch (err: any) {
      toast.error(`Failed to restart ${containerName}`, {
        description: err.message,
      });
    } finally {
      setRestarting(null);
    }
  };

  const infraList = [
    {
      id: "infra-proxy",
      title: "Nginx Proxy Manager",
      icon: <Globe className="h-4 w-4 text-blue-400" />,
      ports: "80, 443, 81",
      network: "shared-network",
      desc: "Reverse proxy, SSL certs, router",
      link: "http://172.255.210.203:81",
    },
    {
      id: "shared-mysql",
      title: "Shared MySQL 8.0",
      icon: <Database className="h-4 w-4 text-emerald-400" />,
      ports: "3306 (Internal)",
      network: "shared-network",
      desc: "Multi-tenant MySQL engine",
    },
    {
      id: "shared-redis",
      title: "Shared Redis 7",
      icon: <Zap className="h-4 w-4 text-amber-400" />,
      ports: "6379 (Internal)",
      network: "shared-network",
      desc: "In-memory caching & session store",
    },
    {
      id: "shared-phpmyadmin",
      title: "phpMyAdmin Web",
      icon: <Database className="h-4 w-4 text-rose-500" />,
      ports: "8085 (Web GUI)",
      network: "shared-network",
      desc: "Visual MySQL web manager",
      link: "http://172.255.210.203:8085",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <span>Core Infrastructure Stacks</span>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
        </h3>
        <span className="text-[11px] text-zinc-500 font-mono">Isolated in /opt/infra</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {infraList.map((item) => {
          const c = getContainer(item.id);
          const isRunning = c ? c.state === "running" : true;
          const isCurrentlyRestarting = restarting === item.id;

          return (
            <Card
              key={item.id}
              className="border border-zinc-800/80 hover:border-rose-500/40 bg-zinc-950/70 hover:shadow-[0_0_20px_rgba(244,63,94,0.12)] transition-all p-4 flex flex-col justify-between"
            >
              <CardContent className="p-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                        {item.title}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-500 hover:text-rose-400"
                            title="Open Web Console"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">{item.ports}</p>
                    </div>
                  </div>
                  <Badge
                    variant={isRunning ? "emerald" : "rose"}
                    className="text-[9px] uppercase px-1.5 py-0.5"
                  >
                    {isRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500">
                    Net: {item.network}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="h-6 px-2 text-[10px] inline-flex items-center rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"
                      >
                        Launch &rarr;
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isCurrentlyRestarting}
                      onClick={() => setConfirmTarget(item.id)}
                      className="h-6 px-1.5 text-[10px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 gap-1"
                    >
                      <RotateCw
                        className={`h-2.5 w-2.5 ${isCurrentlyRestarting ? "animate-spin text-rose-400" : ""}`}
                      />
                      <span>Restart</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Restart AlertDialog Guard */}
      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400">
              Confirm Core Service Restart
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs">
              Are you sure you want to restart container{" "}
              <strong className="text-zinc-200 font-mono">
                {confirmTarget}
              </strong>
              ? Dependent applications on{" "}
              <code className="text-zinc-300">shared-network</code> may experience
              temporary disruption.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && handleRestart(confirmTarget)}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs shadow-sm"
            >
              Restart Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
