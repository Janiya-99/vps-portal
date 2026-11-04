import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Save, Eye, EyeOff, RotateCw, FileCode } from "lucide-react";

interface EnvEditorSheetProps {
  appSlug: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EnvEditorSheet({ appSlug, open, onOpenChange, onSaved }: EnvEditorSheetProps) {
  const [envContent, setEnvContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    if (!open || !appSlug) return;

    setLoading(true);
    api.getAppEnv(appSlug)
      .then((data) => {
        setEnvContent(data.env || "");
      })
      .catch((err) => {
        toast.error("Failed to read .env file", { description: err.message });
        setEnvContent("# No .env.production file found. You can create one here:\n");
      })
      .finally(() => setLoading(false));
  }, [open, appSlug]);

  const handleSave = async () => {
    if (!appSlug) return;
    setSaving(true);
    try {
      await api.updateAppEnv(appSlug, envContent);
      toast.success("Environment Saved", {
        description: `Updated /opt/apps/${appSlug}/.env.production and triggered container reload.`,
      });
      if (onSaved) onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to save .env", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full sm:max-w-xl bg-zinc-950 p-6 border-zinc-800">
        <SheetHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold font-mono text-zinc-100 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-purple-400" />
                .env.production: {appSlug}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-mono mt-0.5">
                Location: /opt/apps/{appSlug}/.env.production
              </SheetDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMasked(!masked)}
              className="h-7 text-xs border-zinc-800 text-zinc-300 gap-1.5"
            >
              {masked ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {masked ? "Show Secrets" : "Mask Secrets"}
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 mt-4 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 font-mono">
              Loading environment variables...
            </div>
          ) : (
            <textarea
              value={envContent}
              onChange={(e) => setEnvContent(e.target.value)}
              placeholder="KEY=value&#10;PORT=3000&#10;DATABASE_URL=..."
              spellCheck={false}
              className={`flex-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 resize-none leading-relaxed ${
                masked ? "blur-[3px] transition-all hover:blur-none" : ""
              }`}
            />
          )}
        </div>

        <SheetFooter className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Changes will take effect on container restart.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 border-zinc-800 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-sm"
            >
              {saving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save & Recreate
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
