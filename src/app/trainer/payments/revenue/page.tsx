"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import RevenueBarChart from "@/components/trainer/billing/RevenueBarChart";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  type Payment,
  formatUsd,
  groupPaymentsByMonth,
  lastNMonthKeys,
  monthKeyFromDate,
  revenueThisMonth,
} from "@/lib/trainer/billing";
import { Card, Spinner } from "@/components/portal/ui";

function RevenueView() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReturnType<typeof groupPaymentsByMonth>>([]);
  const [thisMonth, setThisMonth] = useState(0);
  const [lastMonth, setLastMonth] = useState(0);

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const monthKeys = lastNMonthKeys(12);
      const oldest = monthKeys[monthKeys.length - 1];
      const [y, m] = oldest.split("-").map(Number);
      const fromDate = `${y}-${String(m).padStart(2, "0")}-01`;

      const { data } = await supabase
        .from("payments")
        .select("*")
        .gte("paid_on", fromDate)
        .order("paid_on", { ascending: false });

      const payments = (data as Payment[]) ?? [];
      const grouped = groupPaymentsByMonth(payments, monthKeys);
      setRows(grouped);
      setThisMonth(revenueThisMonth(payments));
      const keys = lastNMonthKeys(12);
      const lastKey = keys[1];
      setLastMonth(
        payments
          .filter((p) => monthKeyFromDate(p.paid_on) === lastKey)
          .reduce((s, p) => s + Number(p.amount), 0)
      );
      setLoading(false);
    })();
  }, []);

  const delta = thisMonth - lastMonth;
  const deltaPct =
    lastMonth > 0 ? Math.round((delta / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  if (loading) return <Spinner />;

  return (
    <>
      <Link
        href="/trainer/payments"
        className="mb-4 inline-flex items-center gap-1 font-sans text-sm text-text-muted hover:text-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Payments
      </Link>

      <h1 className="mb-6 font-serif text-2xl font-light tracking-tight text-text">Revenue</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            This month
          </p>
          <p className="mt-2 font-serif text-2xl font-light text-olive">{formatUsd(thisMonth)}</p>
        </Card>
        <Card>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Last month
          </p>
          <p className="mt-2 font-serif text-2xl font-light text-text">{formatUsd(lastMonth)}</p>
        </Card>
        <Card>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Month over month
          </p>
          <p
            className={`mt-2 font-serif text-2xl font-light ${
              delta >= 0 ? "text-olive" : "text-burgundy"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {formatUsd(delta)}
          </p>
          <p className="mt-1 font-sans text-xs text-text-muted">
            {lastMonth > 0 ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs last month` : "—"}
          </p>
        </Card>
      </div>

      <Card className="mb-8">
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Last 12 months
        </h2>
        <RevenueBarChart rows={rows.map((r) => ({ label: r.label, total: r.total }))} />
      </Card>

      <section>
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Monthly breakdown
        </h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[520px] font-sans text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50 text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">#</th>
                <th className="px-4 py-3 text-right">Venmo</th>
                <th className="px-4 py-3 text-right">Zelle</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">Other</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.monthKey} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-text">{r.label}</td>
                  <td className="px-4 py-3 text-right font-semibold text-text">
                    {formatUsd(r.total)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">{r.count}</td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {r.venmo > 0 ? formatUsd(r.venmo) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {r.zelle > 0 ? formatUsd(r.zelle) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {r.cash > 0 ? formatUsd(r.cash) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted">
                    {r.other > 0 ? formatUsd(r.other) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-2 font-sans text-xs text-text-muted">
          Totals use the calendar month of each payment&apos;s paid date (your device timezone).
        </p>
      </section>
    </>
  );
}

export default function RevenuePage() {
  return (
    <TrainerLayout>
      <RevenueView />
    </TrainerLayout>
  );
}
