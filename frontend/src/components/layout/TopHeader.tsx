import { Search, Menu, LogOut, Terminal, Activity, Zap, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServerLocation } from "@/types";

interface TopHeaderProps {
  onOpenCommand: () => void;
  onOpenMobileMenu: () => void;
  username?: string;
  onLogout: () => void;
  telemetryConnected: boolean;
  latencyMs?: number | null;
  location?: ServerLocation;
  domain?: string;
}

export function TopHeader({
  onOpenCommand,
  onOpenMobileMenu,
  username,
  onLogout,
  telemetryConnected,
  latencyMs,
  location,
  domain = "vps.pixandco.lk",
}: TopHeaderProps) {
  // Determine latency indicator color
  const getLatencyBadge = (latency: number | null | undefined) => {
    if (latency == null) {
      return (
        <Badge variant="outline" className="hidden lg:inline-flex gap-1.5 items-center font-mono text-[10px] border-zinc-800 text-zinc-500">
          <Zap className="h-3 w-3 text-zinc-500" />
          -- ms
        </Badge>
      );
    }

    let colorClasses = "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    let dotColor = "bg-emerald-400";
    if (latency > 180) {
      colorClasses = "border-rose-500/30 text-rose-400 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
      dotColor = "bg-rose-400";
    } else if (latency > 80) {
      colorClasses = "border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
      dotColor = "bg-amber-400";
    }

    return (
      <Badge variant="outline" className={`hidden sm:inline-flex gap-1.5 items-center font-mono text-[11px] ${colorClasses}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-ping`} />
        <Zap className="h-3 w-3" />
        {latency}ms Latency
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 md:px-8 backdrop-blur-xl">
      {/* Left: Mobile Menu toggle + Host info + Location */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800/60"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Server IP & Domain Pill */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden sm:inline-flex gap-1.5 items-center font-mono text-[11px] border-zinc-800 bg-zinc-900/60 text-zinc-300"
          >
            <Terminal className="h-3 w-3 text-rose-500" />
            172.255.210.203
          </Badge>

          <Badge
            variant="outline"
            className="hidden md:inline-flex gap-1.5 items-center font-mono text-[11px] border-rose-500/30 bg-rose-950/30 text-rose-300"
          >
            <Globe className="h-3 w-3 text-rose-400" />
            {domain}
          </Badge>

          {/* Location Badge */}
          <Badge
            variant="outline"
            className="hidden xl:inline-flex gap-1.5 items-center text-[11px] border-zinc-800 bg-zinc-900/40 text-zinc-300"
            title={`${location?.city || "Singapore"}, ${location?.country || "Singapore"} • ${location?.datacenter || "Leaseweb DC"}`}
          >
            <MapPin className="h-3 w-3 text-rose-400" />
            <span>{location?.flag || "🇸🇬"} {location?.city || "Singapore"}</span>
            <span className="text-zinc-500 text-[10px]">({location?.datacenter?.split(" ")[0] || "Leaseweb"})</span>
          </Badge>

          {/* Real-time Latency */}
          {getLatencyBadge(latencyMs)}

          {/* SSE Stream State */}
          <Badge
            variant={telemetryConnected ? "emerald" : "amber"}
            className="inline-flex gap-1.5 items-center text-[10px] font-mono"
          >
            <Activity className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
            {telemetryConnected ? "LIVE" : "SYNC..."}
          </Badge>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={onOpenCommand}
        className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-rose-500/40 hover:bg-zinc-900/80 transition-all w-36 sm:w-60 justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="h-3.5 w-3.5 text-rose-500/70" />
          <span className="hidden sm:inline">Search containers, apps...</span>
          <span className="sm:hidden">Search...</span>
        </span>
        <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-zinc-800 bg-zinc-950 px-1.5 text-[9px] font-mono text-zinc-500">
          ⌘K
        </kbd>
      </button>

      {/* Right: Authenticated User & Logout */}
      <div className="flex items-center gap-3">
        {username && (
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
            <span className="text-zinc-500">Admin:</span>{" "}
            <strong className="text-zinc-100 font-mono">{username}</strong>
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5 text-xs h-8 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
