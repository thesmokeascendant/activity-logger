"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TrendChartProps {
  data: { date: string; count: number }[];
  days?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">
        {label ? format(parseISO(label), "EEEE, MMM d") : ""}
      </p>
      <p className="font-medium text-foreground">
        {payload[0].value} {payload[0].value === 1 ? "activity" : "activities"}
      </p>
    </div>
  );
}

export function TrendChart({ data, days = 30 }: TrendChartProps) {
  const sliced = data.slice(-days);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={sliced} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(0 0% 13%)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(d) => {
            try {
              return format(parseISO(d), "MMM d");
            } catch {
              return d;
            }
          }}
          interval={Math.floor(sliced.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(0 0% 20%)" }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#areaGradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#6366f1", stroke: "hsl(0 0% 4%)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
