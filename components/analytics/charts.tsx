"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const INDIGO = "#7c3aed";
const GRID = "#e4e4e7";

const axis = { tickLine: false, axisLine: false, fontSize: 12, stroke: "#a1a1aa" };

/** Monthly revenue (collected) as a bar chart. */
export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v: number) => `$${v.toLocaleString()}`} width={70} />
        <Tooltip
          cursor={{ fill: "rgba(124,58,237,0.06)" }}
          formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill={INDIGO} radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** New clients added per month as an area chart. */
export function NewClientsChart({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="clientsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INDIGO} stopOpacity={0.3} />
            <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} allowDecimals={false} width={32} />
        <Tooltip formatter={(value) => [value, "New clients"]} />
        <Area type="monotone" dataKey="count" stroke={INDIGO} strokeWidth={2} fill="url(#clientsFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Lifecycle funnel — how many clients have reached at least each stage. */
export function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="stage" {...axis} width={96} />
        <Tooltip cursor={{ fill: "rgba(124,58,237,0.06)" }} formatter={(value) => [value, "Clients reached"]} />
        <Bar dataKey="count" fill={INDIGO} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
