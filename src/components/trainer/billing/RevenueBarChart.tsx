"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatUsd } from "@/lib/trainer/billing";

interface Props {
  /** Oldest → newest for left-to-right chart */
  rows: { label: string; total: number }[];
}

export default function RevenueBarChart({ rows }: Props) {
  const data = [...rows].reverse().map((r) => ({
    month: r.label.replace(/\s\d{4}$/, ""),
    total: r.total,
  }));

  if (data.every((d) => d.total === 0)) {
    return (
      <p className="py-8 text-center font-sans text-sm text-text-muted">
        No payments logged in the last 12 months yet.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E2DA" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#6B5F57" }}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B5F57" }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => formatUsd(Number(value))}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E8E2DA",
              fontSize: 13,
            }}
          />
          <Bar dataKey="total" fill="#C4714A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
