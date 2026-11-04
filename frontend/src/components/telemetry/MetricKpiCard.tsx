import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface MetricKpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  dataPoints?: { timestamp: string; value: number }[];
  color?: string;
  footer?: React.ReactNode;
}

export function MetricKpiCard({
  title,
  value,
  subValue,
  icon,
  dataPoints,
  color = "#3b82f6",
  footer,
}: MetricKpiCardProps) {
  return (
    <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md overflow-hidden flex flex-col justify-between">
      <CardContent className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <div className="p-2 rounded-lg bg-zinc-800/60 text-zinc-300 border border-zinc-700/40">
            {icon}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono tabular-nums">
            {value}
          </span>
          {subValue && (
            <span className="text-xs text-zinc-500 font-mono truncate">
              {subValue}
            </span>
          )}
        </div>

        {/* Real-time sparkline chart */}
        {dataPoints && dataPoints.length > 1 && (
          <div className="h-10 mt-3 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints}>
                <defs>
                  <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${title})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {footer && <div className="mt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}
