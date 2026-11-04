import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, FileArchive, Play, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { BackupArchive } from "@/types";

interface BackupArchiveTableProps {
  archives: BackupArchive[];
  loading: boolean;
  onRefresh: () => void;
}

export function BackupArchiveTable({ archives, loading, onRefresh }: BackupArchiveTableProps) {
  const [running, setRunning] = useState(false);

  const handleRunBackup = async () => {
    setRunning(true);
    try {
      const res = await api.runBackup();
      toast.success("Database Backup Completed", {
        description: `Archive saved to ${res.file}`,
      });
      onRefresh();
    } catch (err: any) {
      toast.error("Backup Failed", { description: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FileArchive className="h-4 w-4 text-emerald-400" />
            MySQL Database Backup Archives
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated daily snapshot at 02:00 AM UTC (7-day rolling retention in <code>/opt/ops/backups/archives</code>)
          </p>
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
            size="sm"
            onClick={handleRunBackup}
            disabled={running}
            className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-sm"
          >
            <Play className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Dumping Databases..." : "Run Backup Now"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archive Filename</TableHead>
              <TableHead>Archive Size</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && archives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  Checking backup archives...
                </TableCell>
              </TableRow>
            ) : archives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  No archives found in /opt/ops/backups/archives. Click "Run Backup Now" to generate one.
                </TableCell>
              </TableRow>
            ) : (
              archives.map((item) => (
                <TableRow key={item.filename}>
                  <TableCell className="font-mono text-zinc-200">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{item.filename}</span>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-zinc-300">
                    {item.size_human}
                  </TableCell>

                  <TableCell className="font-mono text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      {item.created_at}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <a
                      href={`/api/v1/ops/backups/download/${item.filename}`}
                      download
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-zinc-800 text-xs text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
