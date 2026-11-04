import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";

interface NewAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewAppDialog({ open, onOpenChange, onSuccess }: NewAppDialogProps) {
  const [slug, setSlug] = useState("");
  const [framework, setFramework] = useState<"nextjs" | "vue-nginx" | "laravel" | "go-api">("nextjs");
  const [internalPort, setInternalPort] = useState(3000);
  const [withDatabase, setWithDatabase] = useState(true);
  const [loading, setLoading] = useState(false);

  const frameworks = [
    {
      id: "nextjs",
      name: "Next.js (Node.js)",
      defaultPort: 3000,
      desc: "Full-stack SSR / React 19 app",
    },
    {
      id: "vue-nginx",
      name: "Vue / React + Nginx",
      defaultPort: 80,
      desc: "Static SPA hosted via internal Nginx container",
    },
    {
      id: "laravel",
      name: "Laravel (PHP 8.3)",
      defaultPort: 8000,
      desc: "Artisan web application or API backend",
    },
    {
      id: "go-api",
      name: "Go Microservice (Chi)",
      defaultPort: 8080,
      desc: "Ultra-fast compiled binary in Alpine",
    },
  ];

  const handleFrameworkChange = (fwId: any) => {
    setFramework(fwId);
    const found = frameworks.find((f) => f.id === fwId);
    if (found) setInternalPort(found.defaultPort);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) {
      toast.error("Please enter a project slug");
      return;
    }

    setLoading(true);
    try {
      const res = await api.scaffoldApp({
        slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        framework,
        internal_port: Number(internalPort),
        with_database: withDatabase,
      });

      toast.success("App Stack Scaffolding Complete!", {
        description: `Created /opt/apps/${res.slug} and started app-${res.slug}.`,
      });

      onOpenChange(false);
      setSlug("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error("Scaffolding Failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <PlusCircle className="h-5 w-5 text-blue-400" />
            Scaffold New Application Stack
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Automatically generates <code>Dockerfile</code>, <code>docker-compose.yml</code>, and <code>.env.production</code> in <code>/opt/apps/&lt;slug&gt;</code>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs text-zinc-300">Project Slug</Label>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-saas-app"
              className="h-9 border-zinc-800 bg-zinc-900/60 font-mono text-xs"
            />
            <p className="text-[10px] text-zinc-500 font-mono">
              Container will be named: <code>app-{slug || "<slug>"}</code>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-300">Select Architecture Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {frameworks.map((fw) => (
                <div
                  key={fw.id}
                  onClick={() => handleFrameworkChange(fw.id)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-all text-left ${
                    framework === fw.id
                      ? "border-blue-500 bg-blue-500/10 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xs font-semibold">{fw.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{fw.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="internalPort" className="text-xs text-zinc-300">Internal Port</Label>
              <Input
                id="internalPort"
                type="number"
                required
                value={internalPort}
                onChange={(e) => setInternalPort(Number(e.target.value))}
                className="h-9 border-zinc-800 bg-zinc-900/60 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Shared Database</Label>
              <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-zinc-800 bg-zinc-900/60 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={withDatabase}
                  onChange={(e) => setWithDatabase(e.target.checked)}
                  className="rounded border-zinc-700 text-blue-600 focus:ring-0"
                />
                <span className="text-zinc-300 text-[11px]">Provision MySQL DB</span>
              </label>
            </div>
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
              {loading ? "Scaffolding & Building..." : "Deploy App Stack"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
