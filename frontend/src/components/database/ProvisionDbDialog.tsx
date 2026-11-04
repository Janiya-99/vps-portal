import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Database, Copy, Check, Loader2 } from "lucide-react";

interface ProvisionDbDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ProvisionDbDialog({ open, onOpenChange, onSuccess }: ProvisionDbDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const res = await api.provisionDatabase(name.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
      setCredentials(res.credentials);
      toast.success("Database Provisioned Successfully!", {
        description: `Created database ${res.credentials.database} with dedicated user.`,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error("Failed to provision database", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyEnvBlock = () => {
    if (!credentials) return;
    const block = `DB_HOST=${credentials.host}\nDB_PORT=${credentials.port}\nDB_DATABASE=${credentials.database}\nDB_USERNAME=${credentials.username}\nDB_PASSWORD=${credentials.password}`;
    navigator.clipboard.writeText(block);
    setCopied(true);
    toast.success("Copied .env block to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setName("");
    setCredentials(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Database className="h-5 w-5 text-emerald-400" />
            Provision Isolated MySQL Database
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Creates a dedicated schema and user inside <code>shared-mysql</code> with restricted privileges.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              Database and user created with UTF8MB4 collation!
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">Connection Environment Block</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEnvBlock}
                  className="h-7 text-xs border-zinc-800 text-zinc-300 gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy .env"}
                </Button>
              </div>

              <pre className="rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 font-mono text-xs text-zinc-200 overflow-x-auto select-all leading-relaxed">
{`DB_HOST=${credentials.host}
DB_PORT=${credentials.port}
DB_DATABASE=${credentials.database}
DB_USERNAME=${credentials.username}
DB_PASSWORD=${credentials.password}`}
              </pre>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dbname" className="text-xs text-zinc-300">Project / Database Name</Label>
              <Input
                id="dbname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="storefront"
                className="h-9 border-zinc-800 bg-zinc-900/60 font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-500 font-mono">
                Will create <code>db_{name || "<name>"}</code> and user <code>user_{name || "<name>"}</code>
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="border-zinc-800 text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? "Provisioning..." : "Provision Database"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
