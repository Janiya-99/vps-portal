import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Trash2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { RedisStats } from "@/types";
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

interface RedisStatusCardProps {
  stats: RedisStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export function RedisStatusCard({ stats, loading, onRefresh }: RedisStatusCardProps) {
  const [confirmFlush, setConfirmFlush] = useState(false);
  const [flushing, setFlushing] = useState(false);

  const handleFlush = async () => {
    setFlushing(true);
    setConfirmFlush(false);
    try {
      await api.flushRedis();
      toast.success("Redis Cache Flushed", {
        description: "All keys in shared-redis have been cleared.",
      });
      onRefresh();
    } catch (err: any) {
      toast.error("Flush Failed", { description: err.message });
    } finally {
      setFlushing(false);
    }
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Redis Cache Engine (v7)
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 font-mono mt-0.5">
            Internal Host: <code>shared-redis:6379</code> &bull; Role: {stats?.role || "standalone"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 text-xs border-zinc-800 text-zinc-300 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmFlush(true)}
            disabled={flushing}
            className="h-8 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Flush Cache
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Memory In Use</span>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
              {stats?.used_memory_human || "0 B"}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Cached Keys</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              {stats?.total_keys ?? 0}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Connected Clients</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {stats?.connected_clients ?? 0}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Uptime</span>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
              {stats?.uptime_in_days ?? 0} days
            </div>
          </div>
        </div>

        {/* Flush Warning Dialog */}
        <AlertDialog open={confirmFlush} onOpenChange={setConfirmFlush}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Flush all Redis cache?</AlertDialogTitle>
              <AlertDialogDescription>
                This executes <code>FLUSHALL</code> on <strong>shared-redis</strong>. Any active session tokens or cached queries stored in Redis will be permanently erased.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFlush}>
                Confirm Flush
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
