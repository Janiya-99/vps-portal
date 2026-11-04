import { useEffect, useState } from 'react';
import { TelemetryData } from '@/types';

export function useTelemetrySSE() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<{ timestamp: string; cpu: number; ram: number; swap: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Ping interval for ultra-precise client-to-server latency
  useEffect(() => {
    let active = true;
    const measureLatency = async () => {
      try {
        const start = performance.now();
        const res = await fetch("/api/v1/ping", { cache: "no-store" });
        if (res.ok && active) {
          const rtt = Math.round(performance.now() - start);
          setLatencyMs(rtt);
        }
      } catch (err) {
        // network error
      }
    };

    measureLatency();
    const interval = setInterval(measureLatency, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      eventSource = new EventSource('/api/v1/telemetry/stream', { withCredentials: true });

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: TelemetryData = JSON.parse(event.data);
          setData(parsed);

          setHistory((prev) => {
            const timeLabel = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
            const next = [
              ...prev,
              {
                timestamp: timeLabel,
                cpu: Math.round(parsed.cpu.usage_percent * 10) / 10,
                ram: Math.round(parsed.memory.used_percent * 10) / 10,
                swap: Math.round(parsed.swap.used_percent * 10) / 10,
              },
            ];
            // Keep last 25 data points
            return next.slice(-25);
          });
        } catch (e) {
          console.error("Failed to parse telemetry SSE:", e);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  return { data, history, connected, latencyMs };
}
