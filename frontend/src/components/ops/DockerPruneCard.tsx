import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
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

export function DockerPruneCard() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handlePrune = async () => {
    setPruning(true);
    setConfirmOpen(false);
    setOutput("Executing /opt/ops/maintenance/docker-cleanup.sh...\n");
    try {
      const res = await api.runDockerPrune();
      setOutput(res.output || "Cleanup finished with no dangling layers.");
      toast.success("Docker Cleanup Complete", {
        description: "Pruned images and build cache older than 168h.",
      });
    } catch (err: any) {
      setOutput(`Error during prune: ${err.message}`);
      toast.error("Cleanup Failed", { description: err.message });
    } finally {
      setPruning(false);
    }
  };

  return (
    <Card className="border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Docker Storage & Build Cache Prune
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Automated schedule: Weekly on Sunday at 04:00 AM UTC (<code>docker-cleanup.sh</code>)
          </CardDescription>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={pruning}
          className="h-8 text-xs gap-1.5 shadow-sm"
        >
          {pruning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {pruning ? "Pruning..." : "Prune Cache Now"}
        </Button>
      </CardHeader>

      <CardContent className="pt-2">
        <p className="text-xs text-zinc-400 leading-relaxed mb-3">
          Prunes unused container images and build layers older than 7 days (168h) without disturbing active production images.
        </p>

        {output && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 font-mono text-[11px] text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
            {output}
          </div>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                Run Docker Prune?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This executes <code>docker image prune -af --filter "until=168h"</code> and <code>docker builder prune</code> on the host VPS. Only unused layers and older cache are deleted; active containers remain untouched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePrune}>
                Confirm Prune
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
