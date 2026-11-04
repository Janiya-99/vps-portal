import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ShieldCheck, ExternalLink, RefreshCw, PlusCircle } from "lucide-react";
import { ProxyHost } from "@/types";

interface ProxyTableProps {
  hosts: ProxyHost[];
  loading: boolean;
  onRefresh: () => void;
  onOpenAdd: () => void;
}

export function ProxyTable({ hosts, loading, onRefresh, onOpenAdd }: ProxyTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            Nginx Proxy Manager Domain Routes
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Routes incoming public HTTP/HTTPS ports 80/443 to internal containers on <code>shared-network</code>
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
            onClick={onOpenAdd}
            className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Domain
          </Button>
          <a
            href="http://172.255.210.203:81"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <span>NPM Dashboard</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain Names</TableHead>
              <TableHead>Forward Target</TableHead>
              <TableHead>SSL / HTTPS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && hosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  Loading proxy routes from infra-proxy...
                </TableCell>
              </TableRow>
            ) : hosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-zinc-500 font-mono">
                  No domain routes configured yet. Click "Add Domain" to map a public domain to your container.
                </TableCell>
              </TableRow>
            ) : (
              hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="font-mono font-medium text-zinc-100">
                    <div className="flex flex-wrap gap-1">
                      {host.domain_names.map((d, i) => (
                        <span key={i} className="text-blue-400 hover:underline cursor-pointer">
                          {d}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-zinc-300">
                    <Badge variant="sky" className="text-[10px] font-mono">
                      {host.forward_host}:{host.forward_port}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {host.certificate_id ? (
                      <Badge variant="emerald" className="gap-1 text-[10px]">
                        <ShieldCheck className="h-3 w-3" />
                        Let's Encrypt Active
                      </Badge>
                    ) : (
                      <Badge variant="amber" className="text-[10px]">
                        HTTP Only
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={host.enabled ? "emerald" : "rose"} className="text-[10px]">
                      {host.enabled ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <a
                      href={`http://${host.domain_names[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100"
                    >
                      <span>Visit</span>
                      <ExternalLink className="h-3 w-3" />
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
