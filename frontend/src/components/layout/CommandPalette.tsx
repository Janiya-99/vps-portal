import { useEffect } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Layers,
  Database,
  Globe,
  Wrench,
  Download,
  Trash2,
  PlusCircle,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNavigate: (tab: string) => void;
  onTriggerBackup: () => void;
  onTriggerPrune: () => void;
  onOpenNewApp: () => void;
}

export function CommandPalette({
  open,
  setOpen,
  onNavigate,
  onTriggerBackup,
  onTriggerPrune,
  onOpenNewApp,
}: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              onNavigate("overview");
              setOpen(false);
            }}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-blue-400" />
            <span>Overview & System Metrics</span>
            <CommandShortcut>G O</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onNavigate("apps");
              setOpen(false);
            }}
          >
            <Layers className="mr-2 h-4 w-4 text-purple-400" />
            <span>Applications & Docker</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onNavigate("database");
              setOpen(false);
            }}
          >
            <Database className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Databases & Redis Cache</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onNavigate("proxy");
              setOpen(false);
            }}
          >
            <Globe className="mr-2 h-4 w-4 text-amber-400" />
            <span>Domains & Nginx Proxy</span>
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              onNavigate("ops");
              setOpen(false);
            }}
          >
            <Wrench className="mr-2 h-4 w-4 text-rose-400" />
            <span>Backups & Operations</span>
            <CommandShortcut>G B</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onOpenNewApp();
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4 text-blue-400" />
            <span>Scaffold New Application Stack</span>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setOpen(false);
              onTriggerBackup();
            }}
          >
            <Download className="mr-2 h-4 w-4 text-emerald-400" />
            <span>Trigger Full MySQL Database Backup</span>
          </CommandItem>

          <CommandItem
            onSelect={() => {
              setOpen(false);
              onTriggerPrune();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4 text-amber-400" />
            <span>Prune Docker Images & Builder Cache</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
