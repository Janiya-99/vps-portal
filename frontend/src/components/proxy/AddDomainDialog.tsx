import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Globe, ShieldCheck, Loader2 } from "lucide-react";
import { ContainerInfo } from "@/types";

interface AddDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containers: ContainerInfo[];
  onSuccess?: () => void;
}

export function AddDomainDialog({ open, onOpenChange, containers, onSuccess }: AddDomainDialogProps) {
  const [domain, setDomain] = useState("");
  const [targetContainer, setTargetContainer] = useState("");
  const [port, setPort] = useState(3000);
  const [requestSsl, setRequestSsl] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filter running containers
  const appContainers = containers.filter((c) => c.state === "running");

  const handleContainerSelect = (name: string) => {
    setTargetContainer(name);
    // suggest port based on image/name
    if (name.includes("vue") || name.includes("nginx")) {
      setPort(80);
    } else if (name.includes("laravel")) {
      setPort(8000);
    } else {
      setPort(3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !targetContainer) {
      toast.error("Please fill in domain and target container");
      return;
    }

    setLoading(true);
    try {
      await api.createProxyHost({
        domain_names: [domain.trim()],
        forward_host: targetContainer.replace(/^\//, ""),
        forward_port: Number(port),
        ssl_forced: requestSsl,
        block_exploits: true,
      });

      toast.success("Domain Route Configured", {
        description: `Traffic for ${domain} is now forwarded to ${targetContainer}:${port}`,
      });

      onOpenChange(false);
      setDomain("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error("Failed to add domain", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Globe className="h-5 w-5 text-blue-400" />
            Route Domain to Container
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Creates an authenticated proxy host in <code>infra-proxy</code> (Nginx Proxy Manager) and provisions an SSL certificate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="domain" className="text-xs text-zinc-300">Public Domain / FQDN</Label>
            <Input
              id="domain"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="api.example.com"
              className="h-9 border-zinc-800 bg-zinc-900/60 font-mono text-xs"
            />
            <p className="text-[10px] text-zinc-500">
              Ensure DNS A record points to <strong className="text-zinc-400">172.255.210.203</strong> before requesting SSL.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetContainer" className="text-xs text-zinc-300">Target Container on shared-network</Label>
            <select
              id="targetContainer"
              required
              value={targetContainer}
              onChange={(e) => handleContainerSelect(e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>-- Select Running Container --</option>
              {appContainers.map((c) => {
                const name = c.name.replace(/^\//, "");
                return (
                  <option key={c.id} value={name}>
                    {name} ({c.image})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="port" className="text-xs text-zinc-300">Internal Port</Label>
            <Input
              id="port"
              type="number"
              required
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="h-9 border-zinc-800 bg-zinc-900/60 font-mono text-xs"
            />
          </div>

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={requestSsl}
                onChange={(e) => setRequestSsl(e.target.checked)}
                className="rounded border-zinc-700 text-blue-600 focus:ring-0"
              />
              <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Auto-request Let's Encrypt SSL
              </span>
            </label>
            <p className="text-[10px] text-zinc-500 pl-6">
              Forces HTTPS redirect, enables HTTP/2 and blocks common exploits.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-zinc-800 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {loading ? "Configuring NPM Route..." : "Create Proxy Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
