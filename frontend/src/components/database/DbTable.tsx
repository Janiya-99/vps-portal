import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Download, RefreshCw, HardDrive } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { DatabaseInfo } from "@/types";

interface DbTableProps {
  databases: DatabaseInfo[];
  loading: boolean;
  onRefresh: () => void;
  onOpenProvision: () => void;
}

export function DbTable({ databases, loading, onRefresh, onOpenProvision }: DbTableProps) {
  const [dumping, setDumping] = useState<string | null>(null);

  const handleDump = async (name: string) => {
    setDumping(name);
    try {
      const res = await api.dumpDatabase(name);
      toast.success("Database Export Complete", {
        description: `Exported ${name} to ${res.file}`,
      });
    } catch (err: any) {
      toast.error("Export Failed", { description: err.message });
    } finally {
      setDumping(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            Active MySQL Databases
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hosted on <code>shared-mysql:3306</code> (isolated storage in <code>/opt/infra/database/data</code>)
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
            onClick={onOpenProvision}
            className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-sm"
          >
            <Database className="h-3.5 w-3.5" />
            Provision DB
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Database Name</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead>Storage Size</TableHead>
              <TableHead>Host & Port</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && databases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  Loading databases...
                </TableCell>
              </TableRow>
            ) : databases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  No user databases created yet. Click "Provision DB" to create one.
                </TableCell>
              </TableRow>
            ) : (
              databases.map((db) => (
                <TableRow key={db.name}>
                  <TableCell className="font-mono font-medium text-zinc-100">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                      {db.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-300">{db.table_count} tables</TableCell>
                  <TableCell className="font-mono text-zinc-300">{db.size_mb.toFixed(2)} MB</TableCell>
                  <TableCell>
                    <Badge variant="sky" className="text-[10px] font-mono">
                      shared-mysql:3306
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dumping === db.name}
                      onClick={() => handleDump(db.name)}
                      className="h-7 text-xs border-zinc-800 text-zinc-300 hover:text-emerald-400 gap-1.5"
                    >
                      <Download className={`h-3 w-3 ${dumping === db.name ? "animate-spin" : ""}`} />
                      Dump .sql
                    </Button>
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
