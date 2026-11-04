import { ServerLocation } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Zap, Radio, Clock } from "lucide-react";

interface ServerGeoCardProps {
  location?: ServerLocation;
  latencyMs?: number | null;
  serverIp?: string;
  domain?: string;
}

export function ServerGeoCard({
  location,
  latencyMs,
  serverIp = "172.255.210.203",
  domain = "vps.pixandco.lk",
}: ServerGeoCardProps) {
  const city = location?.city || "Singapore";
  const country = location?.country || "Singapore";
  const flag = location?.flag || "🇸🇬";
  const datacenter = location?.datacenter || "Leaseweb Asia Pacific (AS59253)";
  const isp = location?.isp || "Leaseweb Singapore Pte. Ltd.";
  const timezone = location?.timezone || "Asia/Singapore";

  const getLatencyQuality = (ms: number | null | undefined) => {
    if (ms == null) return { label: "Pinging...", color: "text-zinc-500", badge: "border-zinc-800 text-zinc-500" };
    if (ms < 70) return { label: "Ultra Low / Optimal", color: "text-emerald-400", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
    if (ms < 160) return { label: "Normal", color: "text-amber-400", badge: "border-amber-500/30 bg-amber-500/10 text-amber-400" };
    return { label: "High Latency", color: "text-rose-400", badge: "border-rose-500/30 bg-rose-500/10 text-rose-400" };
  };

  const quality = getLatencyQuality(latencyMs);

  return (
    <Card className="border border-zinc-800/80 hover:border-rose-500/40 bg-zinc-950/70 hover:shadow-[0_0_20px_rgba(225,29,72,0.12)] transition-all p-5">
      <CardContent className="p-0 space-y-4">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  {city}, {country}
                </h3>
                <Badge variant="outline" className="text-[10px] border-rose-500/30 bg-rose-950/30 text-rose-300 font-mono">
                  Tier-3 Datacenter
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {datacenter}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs px-2.5 py-1 ${quality.badge}`}>
              <Zap className="h-3.5 w-3.5 mr-1" />
              {latencyMs != null ? `${latencyMs} ms` : "-- ms"}
            </Badge>
          </div>
        </div>

        {/* 4 Details Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Host IP */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-2.5 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
              <Radio className="h-3 w-3 text-rose-400" /> Host IP
            </div>
            <div className="font-mono text-xs text-zinc-200 font-medium">
              {serverIp}
            </div>
          </div>

          {/* 2. Primary Domain */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-2.5 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
              <Globe className="h-3 w-3 text-rose-400" /> Domain &amp; SSL
            </div>
            <div className="font-mono text-xs text-rose-300 truncate font-medium">
              {domain}
            </div>
          </div>

          {/* 3. Provider / ISP */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-2.5 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-rose-400" /> Carrier / ISP
            </div>
            <div className="text-xs text-zinc-200 truncate font-medium">
              {isp.replace(" Pte. Ltd.", "")}
            </div>
          </div>

          {/* 4. Timezone & RTT State */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-2.5 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-rose-400" /> Timezone
            </div>
            <div className="font-mono text-xs text-zinc-200 truncate font-medium">
              {timezone} (UTC+8)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
