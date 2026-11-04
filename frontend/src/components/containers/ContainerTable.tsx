import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play,
  Square,
  RotateCw,
  FileText,
  Sliders,
  Search,
  Layers,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ContainerInfo } from "@/types";
import { formatBytes } from "@/lib/utils";

interface ContainerTableProps {
  containers: ContainerInfo[];
  loading: boolean;
  onRefresh: () => void;
  onOpenLogs: (id: string, name: string) => void;
  onOpenEnv: (slug: string) => void;
}

export function ContainerTable({
  containers,
  loading,
  onRefresh,
  onOpenLogs,
  onOpenEnv,
}: ContainerTableProps) {
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (id: string, action: "start" | "stop" | "restart") => {
    setActionLoading(`${id}-${action}`);
    try {
      await api.containerAction(id, action);
      toast.success(`Container ${action} executed`, {
        description: `Command delivered to Docker daemon.`,
      });
      onRefresh();
    } catch (err: any) {
      toast.error(`Action Failed`, { description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = containers.filter((c) => {
    const query = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.image.toLowerCase().includes(query) ||
      c.ports.some((p) => p.includes(query))
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search by container name, image, port..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs border-zinc-800 bg-zinc-900/60 text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-9 text-xs border-zinc-800 hover:bg-zinc-800 text-zinc-300 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px]">Container</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Network & Ports</TableHead>
              <TableHead>CPU / RAM</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && containers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-xs text-zinc-500 font-mono">
                  Loading Docker containers...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-xs text-zinc-500 font-mono">
                  No containers found matching "{search}".
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const isRunning = c.state === "running";
                const isApp = c.name.startsWith("app-") || c.name.startsWith("/app-");
                const appSlug = isApp ? c.name.replace(/^\/?app-/, "") : null;

                return (
                  <TableRow key={c.id}>
                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-zinc-500 shrink-0" />
                        <div>
                          <div className="font-semibold font-mono text-zinc-100 truncate max-w-[180px]">
                            {c.name.replace(/^\//, "")}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[140px]">
                            {c.id.substring(0, 12)}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={isRunning ? "emerald" : "rose"}
                        className="gap-1.5 font-mono text-[10px]"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isRunning ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                          }`}
                        />
                        {isRunning ? "RUNNING" : "STOPPED"}
                      </Badge>
                    </TableCell>

                    {/* Image */}
                    <TableCell>
                      <span className="font-mono text-[11px] text-zinc-400 truncate block max-w-[160px]">
                        {c.image}
                      </span>
                    </TableCell>

                    {/* Network & Ports */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {c.ports.length > 0 ? (
                            c.ports.map((p, idx) => (
                              <Badge key={idx} variant="sky" className="text-[10px] font-mono px-1.5 py-0">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-mono">No host ports</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {c.ip_address || "shared-network"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Stats */}
                    <TableCell>
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="text-zinc-300">
                          {c.cpu_percent ? `${c.cpu_percent.toFixed(1)}%` : "0.0%"} CPU
                        </div>
                        <div className="text-zinc-500 text-[10px]">
                          {formatBytes(c.memory_usage_bytes || 0)} RAM
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isRunning ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Restart"
                              disabled={actionLoading === `${c.id}-restart`}
                              onClick={() => handleAction(c.id, "restart")}
                              className="h-7 w-7 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Stop"
                              disabled={actionLoading === `${c.id}-stop`}
                              onClick={() => handleAction(c.id, "stop")}
                              className="h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Square className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Start"
                            disabled={actionLoading === `${c.id}-start`}
                            onClick={() => handleAction(c.id, "start")}
                            className="h-7 w-7 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Logs"
                          onClick={() => onOpenLogs(c.id, c.name.replace(/^\//, ""))}
                          className="h-7 w-7 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>

                        {appSlug && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit .env"
                            onClick={() => onOpenEnv(appSlug)}
                            className="h-7 w-7 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

