import { ShieldCheck, Lock, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 py-5 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-widest text-zinc-100">
              PIXANDCO
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
          </div>
          <span className="text-zinc-600 hidden sm:inline">&bull;</span>
          <span className="text-xs text-zinc-500 font-mono">
            &copy; 2026 PIXANDCO. All rights reserved.
          </span>
        </div>

        {/* Center: Datacenter & Host Telemetry Footprint */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono text-center flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 text-zinc-300">
            🇸🇬 Singapore Datacenter <span className="text-zinc-600">(AS59253)</span>
          </span>
          <span className="text-zinc-700">&bull;</span>
          <span className="text-rose-400 font-medium">172.255.210.203</span>
          <span className="text-zinc-700">&bull;</span>
          <a
            href="https://vps.pixandco.lk"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
          >
            vps.pixandco.lk
          </a>
        </div>

        {/* Right: Security & Stack Pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            <span>UFW ACTIVE</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-rose-400">
            <Lock className="h-3 w-3" />
            <span>LET'S ENCRYPT SSL</span>
          </div>

          <a
            href="http://172.255.210.203:8085"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-rose-300 transition-colors"
          >
            <span>phpMyAdmin</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
