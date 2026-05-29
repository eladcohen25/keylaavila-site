"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CheckIn {
  id: string;
  week_of: string;
  nutrition_rating: number;
  energy_mood: number;
  recovery: string;
  session_difficulty: string;
  push_preference: string;
  sleep_hours: number | null;
  weight: number | null;
}

const RECOVERY_SCORE: Record<string, number> = {
  fresh: 4,
  okay: 3,
  sore: 2,
  exhausted: 1,
};

const DIFFICULTY_SCORE: Record<string, number> = {
  too_easy: 1,
  just_right: 2,
  too_hard: 3,
};

const PUSH_SCORE: Record<string, number> = {
  ease_off: 1,
  keep_same: 2,
  push_more: 3,
};

export default function TrendCharts({ checkins }: { checkins: CheckIn[] }) {
  if (checkins.length < 2) {
    return (
      <div className="rounded-xl border border-text/5 bg-white p-12 text-center">
        <p className="font-sans text-text-muted">
          Need at least 2 check-ins to show trends
        </p>
      </div>
    );
  }

  const sorted = [...checkins].sort(
    (a, b) => new Date(a.week_of).getTime() - new Date(b.week_of).getTime()
  );

  const chartData = sorted.map((c) => ({
    week: new Date(c.week_of).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    nutrition: c.nutrition_rating,
    energy: c.energy_mood,
    recovery: RECOVERY_SCORE[c.recovery] || 0,
    difficulty: DIFFICULTY_SCORE[c.session_difficulty] || 0,
    push: PUSH_SCORE[c.push_preference] || 0,
    sleep: c.sleep_hours,
    weight: c.weight,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Nutrition Rating" color="#c0785c">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="nutrition"
              stroke="#c0785c"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Rating"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Energy / Mood" color="#6366f1">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Energy/Mood"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Recovery" color="#10b981">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis
              domain={[1, 4]}
              ticks={[1, 2, 3, 4]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                ["", "Exhausted", "Sore", "Okay", "Fresh"][v] || ""
              }
            />
            <Tooltip
              formatter={(value) => {
                const labels = ["", "Exhausted", "Sore", "Okay", "Fresh"];
                return labels[value as number] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="recovery"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Recovery"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Session Difficulty & Push Preference" color="#f59e0b">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="difficulty"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Difficulty"
            />
            <Line
              type="monotone"
              dataKey="push"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              strokeDasharray="5 5"
              name="Push Pref"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {chartData.some((d) => d.sleep !== null) && (
        <ChartCard title="Sleep (hrs/night)" color="#8b5cf6">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.filter((d) => d.sleep !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[4, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Sleep"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {chartData.some((d) => d.weight !== null) && (
        <ChartCard title="Weight" color="#06b6d4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.filter((d) => d.weight !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Weight"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-text/5 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h4 className="font-sans text-sm font-medium text-text">{title}</h4>
      </div>
      {children}
    </div>
  );
}
