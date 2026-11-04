import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, WrapText, ArrowDownToLine, Trash2 } from "lucide-react";

interface LogStreamSheetProps {
  containerId: string | null;
  containerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogStreamSheet({ containerId, containerName, open, onOpenChange }: LogStreamSheetProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [wrapLines, setWrapLines] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !containerId) {
      setLogs([]);
      return;
    }

    setLogs([`[Connecting to stdout/stderr stream for ${containerName || containerId}...]`]);

    const es = new EventSource(`/api/v1/containers/${containerId}/logs`, { withCredentials: true });

    es.onmessage = (event) => {
      try {
        const line = event.data;
        setLogs((prev) => [...prev.slice(-2000), line]);
      } catch (e) {
        console.error(e);
      }
    };

    es.onerror = () => {
      setLogs((prev) => [...prev, "[Stream disconnected or container not running]"]);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [open, containerId, containerName]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter
    ? logs.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const downloadLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName || "container"}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full sm:max-w-3xl bg-zinc-950 p-6 border-zinc-800">
        <SheetHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold font-mono text-zinc-100 flex items-center gap-2">
                Logs: {containerName || containerId}
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-mono mt-0.5">
                Real-time multiplexed stdout/stderr via Docker daemon
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadLogs}
                className="h-8 text-xs border-zinc-800 text-zinc-300 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <Input
                placeholder="Search logs regex / keyword..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8 h-8 text-xs border-zinc-800 bg-zinc-900/60"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWrapLines(!wrapLines)}
              className={`h-8 px-2 text-xs border-zinc-800 ${wrapLines ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}
              title="Toggle line wrapping"
            >
              <WrapText className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`h-8 px-2 text-xs border-zinc-800 ${autoScroll ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"}`}
              title="Toggle auto-scroll"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogs([])}
              className="h-8 px-2 text-xs border-zinc-800 text-zinc-400 hover:text-rose-400"
              title="Clear terminal buffer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Terminal Screen */}
        <div className="flex-1 overflow-auto rounded-lg bg-zinc-900/90 border border-zinc-800/80 p-4 font-mono text-[11px] leading-relaxed text-zinc-200 mt-4 select-text">
          {filteredLogs.map((log, idx) => (
            <div
              key={idx}
              className={`py-0.5 hover:bg-zinc-800/50 ${
                wrapLines ? "break-all whitespace-pre-wrap" : "whitespace-pre"
              } ${
                log.includes("ERR") || log.includes("error") || log.includes("Error")
                  ? "text-rose-400"
                  : log.includes("WARN") || log.includes("warning")
                  ? "text-amber-300"
                  : "text-zinc-300"
              }`}
            >
              <span className="text-zinc-600 select-none mr-3">{idx + 1}</span>
              {log}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
