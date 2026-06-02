"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import Avatar from "@/components/portal/Avatar";
import {
  AddChargeModal,
  LogPaymentModal,
  RecurringChargeModal,
  SellPackageModal,
} from "@/components/trainer/billing/BillingModals";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/portal/types";
import {
  type Charge,
  type Payment,
  type RecurringCharge,
  buildLedger,
  clientBalance,
  formatUsd,
  ledgerWithRunningBalance,
} from "@/lib/trainer/billing";
import { Card, Spinner, PortalButton } from "@/components/portal/ui";

type Modal = "payment" | "charge" | "package" | "recurring" | null;

function ClientBilling({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recurring, setRecurring] = useState<RecurringCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();
    if (!prof) {
      router.replace("/trainer/payments");
      return;
    }
    setProfile(prof as Profile);

    const [{ data: ch }, { data: pay }, { data: rec }] = await Promise.all([
      supabase
        .from("charges")
        .select("*")
        .eq("client_id", clientId)
        .order("charge_date", { ascending: false }),
      supabase
        .from("payments")
        .select("*")
        .eq("client_id", clientId)
        .order("paid_on", { ascending: false }),
      supabase
        .from("recurring_charges")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle(),
    ]);

    setCharges((ch as Charge[]) ?? []);
    setPayments((pay as Payment[]) ?? []);
    setRecurring((rec as RecurringCharge) ?? null);
    setLoading(false);
  }, [clientId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function incrementSession(charge: Charge) {
    const max = charge.sessions_included ?? 0;
    if (charge.sessions_used >= max) return;
    const supabase = getSupabaseBrowser();
    await supabase
      .from("charges")
      .update({ sessions_used: charge.sessions_used + 1 })
      .eq("id", charge.id);
    load();
  }

  function closeModal() {
    setModal(null);
    load();
  }

  if (loading || !profile) return <Spinner />;

  const balance = clientBalance(charges, payments);
  const packages = charges.filter(
    (c) => c.charge_type === "package" && c.sessions_included != null && c.sessions_included > 0
  );
  const ledgerEntries = buildLedger(charges, payments);
  const withRunning = ledgerWithRunningBalance(ledgerEntries);
  const ledgerDisplay = [...withRunning].reverse();

  function fmtDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={profile.full_name} url={profile.avatar_url} size={56} />
        <div>
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">
            {profile.full_name || "Client"}
          </h1>
          <Link
            href={`/trainer/clients/${clientId}`}
            className="font-sans text-sm text-terracotta hover:underline"
          >
            View client profile →
          </Link>
        </div>
      </div>

      <Card className="mb-6 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Current balance
        </p>
        <p
          className={`mt-2 font-serif text-4xl font-light ${
            balance > 0.005 ? "text-burgundy" : balance < -0.005 ? "text-olive" : "text-text"
          }`}
        >
          {formatUsd(balance)}
        </p>
        <p className="mt-1 font-sans text-xs text-text-muted">
          {balance > 0.005 ? "Amount owed" : balance < -0.005 ? "Credit (overpaid)" : "Paid up"}
        </p>
      </Card>

      {packages.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Package status
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((pkg) => {
              const total = pkg.sessions_included!;
              const used = pkg.sessions_used;
              const left = Math.max(0, total - used);
              return (
                <Card key={pkg.id}>
                  <p className="font-sans text-sm font-medium text-text">
                    {pkg.description || "Package"}
                  </p>
                  <p className="mt-1 font-sans text-2xl font-light text-text">
                    {used} <span className="text-base text-text-muted">of</span> {total}{" "}
                    <span className="text-base text-text-muted">used</span>
                  </p>
                  <p className="mt-0.5 font-sans text-xs text-text-muted">
                    {left} remaining · {formatUsd(Number(pkg.amount))}
                  </p>
                  <PortalButton
                    className="mt-3"
                    variant="secondary"
                    disabled={left === 0}
                    onClick={() => incrementSession(pkg)}
                  >
                    +1 session used
                  </PortalButton>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {recurring && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
              Recurring monthly
            </p>
            <p className="mt-1 font-sans text-sm text-text">
              {formatUsd(Number(recurring.amount))} — {recurring.description}
              {!recurring.active && (
                <span className="ml-2 text-text-muted">(inactive)</span>
              )}
            </p>
          </div>
          <PortalButton variant="ghost" onClick={() => setModal("recurring")}>
            Edit
          </PortalButton>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <PortalButton onClick={() => setModal("payment")}>Log payment</PortalButton>
        <PortalButton variant="secondary" onClick={() => setModal("charge")}>
          Add charge
        </PortalButton>
        <PortalButton variant="secondary" onClick={() => setModal("package")}>
          Sell package
        </PortalButton>
        {!recurring && (
          <PortalButton variant="ghost" onClick={() => setModal("recurring")}>
            Set monthly recurring
          </PortalButton>
        )}
      </div>

      <section>
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          Ledger
        </h2>
        {ledgerDisplay.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">No charges or payments yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {ledgerDisplay.map((row) => (
              <div
                key={`${row.kind}-${row.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-text">{row.label}</p>
                  <p className="font-sans text-xs text-text-muted">
                    {fmtDate(row.date)}
                    {row.detail ? ` · ${row.detail}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`font-sans text-sm font-semibold ${
                      row.kind === "charge" ? "text-burgundy" : "text-olive"
                    }`}
                  >
                    {row.kind === "charge" ? "+" : "−"}
                    {formatUsd(row.amount)}
                  </p>
                  <p className="font-sans text-[11px] text-text-muted">
                    Bal {formatUsd(row.running)}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {modal === "payment" && (
        <LogPaymentModal
          clientId={clientId}
          charges={charges}
          onClose={() => setModal(null)}
          onSaved={closeModal}
        />
      )}
      {modal === "charge" && (
        <AddChargeModal clientId={clientId} onClose={() => setModal(null)} onSaved={closeModal} />
      )}
      {modal === "package" && (
        <SellPackageModal clientId={clientId} onClose={() => setModal(null)} onSaved={closeModal} />
      )}
      {modal === "recurring" && (
        <RecurringChargeModal
          clientId={clientId}
          existing={recurring}
          onClose={() => setModal(null)}
          onSaved={closeModal}
        />
      )}
    </>
  );
}

export default function ClientBillingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  return (
    <TrainerLayout>
      <ClientBilling clientId={clientId} />
    </TrainerLayout>
  );
}
