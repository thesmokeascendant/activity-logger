"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTypeColor, getTypeLabel } from "@/lib/utils";

interface TypeBreakdownChartProps {
  data: { type: string; count: number }[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{getTypeLabel(payload[0].payload.type)}</p>
      <p className="font-medium text-foreground">{payload[0].value} activities</p>
    </div>
  );
}

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} layout="vertical">
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="type"
          tick={{ fontSize: 10, fill: "hsl(215 15% 50%)" }}
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={getTypeLabel}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(0 0% 12%)" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {data.map((entry) => (
            <Cell key={entry.type} fill={getTypeColor(entry.type)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
