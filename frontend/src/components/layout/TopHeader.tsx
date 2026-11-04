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
  // Determine latency indicator styling
  const renderLatencyBadge = () => {
    if (latencyMs == null) {
      return (
        <Badge
          variant="outline"
          className="hidden sm:inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center font-mono text-[11px] border-zinc-800 bg-zinc-900/40 text-zinc-500 h-7"
        >
          <Zap className="h-3 w-3 text-zinc-500 shrink-0" />
          <span>-- ms</span>
        </Badge>
      );
    }

    let colorClasses = "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    let dotColor = "bg-emerald-400";
    if (latencyMs > 180) {
      colorClasses = "border-rose-500/30 text-rose-400 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.15)]";
      dotColor = "bg-rose-400";
    } else if (latencyMs > 80) {
      colorClasses = "border-amber-500/30 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
      dotColor = "bg-amber-400";
    }

    return (
      <Badge
        variant="outline"
        className={`inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center font-mono text-[11px] h-7 ${colorClasses}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse shrink-0`} />
        <Zap className="h-3 w-3 shrink-0" />
        <span>{latencyMs}ms</span>
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-900 bg-zinc-950/90 px-3 sm:px-6 md:px-8 backdrop-blur-xl gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
      {/* Left: Mobile Toggle + PIXANDCO brand (mobile) + Host & Domain Pills */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-md hover:bg-zinc-800/60 shrink-0"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand name for mobile */}
        <div className="md:hidden flex items-center gap-1.5 pr-1">
          <span className="font-black text-sm tracking-wider text-zinc-100">PIXANDCO</span>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        </div>

        {/* Server IP Pill */}
        <Badge
          variant="outline"
          className="hidden sm:inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center font-mono text-[11px] border-zinc-800 bg-zinc-900/60 text-zinc-300 h-7"
        >
          <Terminal className="h-3 w-3 text-rose-500 shrink-0" />
          <span>172.255.210.203</span>
        </Badge>

        {/* Primary Domain Pill */}
        <Badge
          variant="outline"
          className="hidden md:inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center font-mono text-[11px] border-rose-500/30 bg-rose-950/20 text-rose-300 h-7"
        >
          <Globe className="h-3 w-3 text-rose-400 shrink-0" />
          <span>{domain}</span>
        </Badge>

        {/* Geolocation Pill */}
        <Badge
          variant="outline"
          className="hidden xl:inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center text-[11px] border-zinc-800 bg-zinc-900/40 text-zinc-300 h-7"
          title={`${location?.city || "Singapore"}, ${location?.country || "Singapore"} • ${location?.datacenter || "Leaseweb DC"}`}
        >
          <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
          <span>{location?.flag || "🇸🇬"} {location?.city || "Singapore"}</span>
        </Badge>

        {/* Latency Radar */}
        {renderLatencyBadge()}

        {/* Telemetry Stream Badge */}
        <Badge
          variant={telemetryConnected ? "emerald" : "amber"}
          className="inline-flex shrink-0 whitespace-nowrap gap-1.5 items-center text-[10px] font-mono h-7"
        >
          <Activity className="h-2.5 w-2.5 animate-pulse text-emerald-400 shrink-0" />
          <span>{telemetryConnected ? "LIVE" : "SYNC"}</span>
        </Badge>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-xs sm:max-w-sm min-w-[120px]">
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-rose-500/40 hover:bg-zinc-900/80 transition-all w-full justify-between h-8"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-rose-500/80 shrink-0" />
            <span className="hidden sm:inline truncate">Search apps, containers...</span>
            <span className="sm:hidden">Search...</span>
          </span>
          <kbd className="hidden sm:inline-flex h-4 items-center rounded border border-zinc-800 bg-zinc-950 px-1.5 text-[9px] font-mono text-zinc-500 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Authenticated User & Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {username && (
          <span className="text-xs text-zinc-400 font-medium hidden lg:inline shrink-0 whitespace-nowrap">
            <span className="text-zinc-500">Admin:</span>{" "}
            <strong className="text-zinc-100 font-mono">{username}</strong>
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5 text-xs h-8 border border-transparent hover:border-rose-500/20 transition-all shrink-0 whitespace-nowrap px-2.5"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
