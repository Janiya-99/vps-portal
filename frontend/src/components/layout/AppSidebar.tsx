import { LayoutDashboard, Layers, Database, Globe, Wrench, Server, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
}

export function AppSidebar({ currentTab, setCurrentTab, isOpenMobile, setIsOpenMobile }: AppSidebarProps) {
  const navItems = [
    { id: "overview", label: "Overview & Metrics", icon: LayoutDashboard },
    { id: "apps", label: "Apps & Containers", icon: Layers },
    { id: "database", label: "Databases & Cache", icon: Database },
    { id: "proxy", label: "Domains & Reverse Proxy", icon: Globe },
    { id: "ops", label: "Backups & Maintenance", icon: Wrench },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600/10 border border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.25)]">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-black tracking-widest text-zinc-100 flex items-center gap-1.5">
              PIXANDCO
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-tight">172.255.210.203 &bull; VPS NEXUS</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Control Center
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  if (setIsOpenMobile) setIsOpenMobile(false);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  active
                    ? "bg-rose-600/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.18)]"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200 hover:border-zinc-800"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-rose-400" : "text-zinc-500 group-hover:text-rose-400"
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Launch Consoles */}
        <div className="space-y-1 pt-2">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Web Consoles
          </div>
          <a
            href="http://172.255.210.203:8085"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-rose-400" />
              phpMyAdmin
            </span>
            <ExternalLink className="h-3 w-3 text-zinc-600" />
          </a>

          <a
            href="http://172.255.210.203:81"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-rose-400" />
              NPM Admin
            </span>
            <ExternalLink className="h-3 w-3 text-zinc-600" />
          </a>
        </div>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> UFW Firewall
          </span>
          <span className="text-emerald-400 font-semibold text-[10px]">ACTIVE</span>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono leading-tight">
          Docker v29.9.3 &bull; Ubuntu 24.04
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, fixed width on md+) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpenMobile && setIsOpenMobile(false)}
          />
          <div className="relative w-64 bg-zinc-950 border-r border-zinc-800/80 h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
