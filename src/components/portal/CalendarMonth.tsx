"use client";

import { monthLabel, monthMatrix } from "@/lib/portal/types";

export interface DayMarks {
  workouts?: number;
  events?: number;
  hasNote?: boolean;
  completed?: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarMonth({
  monthAnchor,
  today,
  selected,
  marks,
  onSelect,
  onShiftMonth,
  onToday,
}: {
  monthAnchor: Date;
  today: string;
  selected: string | null;
  marks: Record<string, DayMarks>;
  onSelect: (dateStr: string) => void;
  onShiftMonth: (delta: number) => void;
  onToday: () => void;
}) {
  const weeks = monthMatrix(monthAnchor);
  const thisMonth = monthAnchor.getMonth();

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onShiftMonth(-1)}
          className="rounded-lg border border-border p-2 text-text-muted transition hover:border-terracotta hover:text-terracotta"
          aria-label="Previous month"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-serif text-xl font-light text-text">{monthLabel(monthAnchor)}</h2>
        <button
          onClick={() => onShiftMonth(1)}
          className="rounded-lg border border-border p-2 text-text-muted transition hover:border-terracotta hover:text-terracotta"
          aria-label="Next month"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1 text-center font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((dateStr) => {
          const dayNum = Number(dateStr.slice(8, 10));
          const inMonth = new Date(dateStr + "T00:00:00").getMonth() === thisMonth;
          const isToday = dateStr === today;
          const isSelected = dateStr === selected;
          const m = marks[dateStr] ?? {};
          const hasAny = (m.workouts ?? 0) > 0 || (m.events ?? 0) > 0 || m.hasNote;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`relative flex aspect-square flex-col items-center justify-start rounded-lg pt-1.5 transition ${
                isSelected
                  ? "bg-terracotta text-white"
                  : isToday
                    ? "bg-blush/50 text-text"
                    : inMonth
                      ? "text-text hover:bg-bg"
                      : "text-text-muted/40 hover:bg-bg"
              }`}
            >
              <span className={`font-sans text-sm ${isToday && !isSelected ? "font-semibold text-terracotta" : ""}`}>
                {dayNum}
              </span>
              {hasAny && (
                <span className="mt-1 flex items-center gap-0.5">
                  {(m.workouts ?? 0) > 0 && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-white" : m.completed ? "bg-olive" : "bg-terracotta"
                      }`}
                    />
                  )}
                  {(m.events ?? 0) > 0 && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-burgundy"}`} />
                  )}
                  {m.hasNote && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-text-muted"}`} />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 font-sans text-[11px] text-text-muted">
        <Legend className="bg-terracotta" label="Workout" />
        <Legend className="bg-burgundy" label="Event" />
        <Legend className="bg-text-muted" label="Note" />
        <button onClick={onToday} className="ml-auto font-medium text-terracotta hover:underline">
          Today
        </button>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
