"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import PostMonthlyCharges from "@/components/trainer/billing/PostMonthlyCharges";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/portal/types";
import {
  type Charge,
  type Payment,
  clientBalance,
  formatUsd,
  revenueThisMonth,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/trainer/billing";
import { Card, Spinner } from "@/components/portal/ui";
import Avatar from "@/components/portal/Avatar";

interface OutstandingRow {
  client: Profile;
  balance: number;
}

function PaymentsOverview() {
  const [loading, setLoading] = useState(true);
  const [outstanding, setOutstanding] = useState<OutstandingRow[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [recentPayments, setRecentPayments] = useState<
    (Payment & { client?: Profile })[]
  >([]);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const [{ data: profiles }, { data: charges }, { data: payments }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "client").order("full_name"),
      supabase.from("charges").select("*"),
      supabase.from("payments").select("*").order("paid_on", { ascending: false }),
    ]);

    const clients = (profiles as Profile[]) ?? [];
    const allCharges = (charges as Charge[]) ?? [];
    const allPayments = (payments as Payment[]) ?? [];

    const byClient = new Map<string, { charges: Charge[]; payments: Payment[] }>();
    for (const c of clients) {
      byClient.set(c.id, { charges: [], payments: [] });
    }
    for (const ch of allCharges) {
      const bucket = byClient.get(ch.client_id);
      if (bucket) bucket.charges.push(ch);
    }
    for (const p of allPayments) {
      const bucket = byClient.get(p.client_id);
      if (bucket) bucket.payments.push(p);
    }

    const owed: OutstandingRow[] = [];
    for (const client of clients) {
      const { charges: ch, payments: pay } = byClient.get(client.id)!;
      const bal = clientBalance(ch, pay);
      if (bal > 0.005) owed.push({ client, balance: bal });
    }
    owed.sort((a, b) => b.balance - a.balance);
    setOutstanding(owed);
    setMonthRevenue(revenueThisMonth(allPayments));

    const clientMap = new Map(clients.map((c) => [c.id, c]));
    setRecentPayments(
      allPayments.slice(0, 10).map((p) => ({
        ...p,
        client: clientMap.get(p.client_id),
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function fmtDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Payments</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">
            Manual ledger — log charges and payments collected outside the app.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/trainer/payments/revenue"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 font-sans text-sm font-medium text-text transition hover:border-terracotta/40"
          >
            Revenue view →
          </Link>
        </div>
      </div>

      <Card className="mb-8">
        <PostMonthlyCharges onDone={load} />
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Revenue this month
          </p>
          <p className="mt-2 font-serif text-3xl font-light text-olive">
            {formatUsd(monthRevenue)}
          </p>
          <p className="mt-1 font-sans text-xs text-text-muted">Payments logged with paid date in this month</p>
        </Card>
        <Card>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Total outstanding
          </p>
          <p className="mt-2 font-serif text-3xl font-light text-burgundy">
            {formatUsd(outstanding.reduce((s, r) => s + r.balance, 0))}
          </p>
          <p className="mt-1 font-sans text-xs text-text-muted">
            {outstanding.length} client{outstanding.length === 1 ? "" : "s"} with balance due
          </p>
        </Card>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Outstanding
        </h2>
        {outstanding.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">Everyone is paid up.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {outstanding.map(({ client, balance }) => (
              <Link key={client.id} href={`/trainer/payments/${client.id}`}>
                <Card className="flex items-center justify-between transition hover:border-terracotta/40 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <Avatar name={client.full_name} url={client.avatar_url} size={40} />
                    <span className="font-sans text-base font-medium text-text">
                      {client.full_name || "Unnamed"}
                    </span>
                  </div>
                  <span className="font-sans text-lg font-semibold text-burgundy">
                    {formatUsd(balance)}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Recent payments
        </h2>
        {recentPayments.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">No payments logged yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {recentPayments.map((p) => (
              <Link
                key={p.id}
                href={`/trainer/payments/${p.client_id}`}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-bg-alt/50"
              >
                <div>
                  <p className="font-sans text-sm font-medium text-text">
                    {p.client?.full_name || "Client"}
                  </p>
                  <p className="font-sans text-xs text-text-muted">
                    {PAYMENT_METHOD_LABELS[p.method as PaymentMethod]} · {fmtDate(p.paid_on)}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span className="font-sans text-sm font-semibold text-olive">
                  −{formatUsd(Number(p.amount))}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <TrainerLayout>
      <PaymentsOverview />
    </TrainerLayout>
  );
}
