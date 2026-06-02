export type ChargeType = "session" | "monthly" | "package" | "other";
export type PaymentMethod = "venmo" | "zelle" | "cash" | "other";

export interface Charge {
  id: string;
  client_id: string;
  amount: number;
  charge_type: ChargeType;
  description: string;
  charge_date: string;
  sessions_included: number | null;
  sessions_used: number;
  recurring_charge_id: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  method: PaymentMethod;
  paid_on: string;
  note: string | null;
  charge_id: string | null;
  created_at: string;
}

export interface RecurringCharge {
  id: string;
  client_id: string;
  amount: number;
  description: string;
  active: boolean;
  created_at: string;
}

export type LedgerEntry =
  | { kind: "charge"; id: string; date: string; amount: number; label: string; detail: string }
  | { kind: "payment"; id: string; date: string; amount: number; label: string; detail: string };

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  session: "Session",
  monthly: "Monthly",
  package: "Package",
  other: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  venmo: "Venmo",
  zelle: "Zelle",
  cash: "Cash",
  other: "Other",
};

/** Format a number as USD (always 2 decimals). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function parseAmount(raw: string): number | null {
  const n = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** First day of current month in local timezone (YYYY-MM-DD). */
export function currentMonthStartLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

/** Calendar month key from YYYY-MM-DD using local timezone. */
export function monthKeyFromDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Last N calendar months (most recent first), as YYYY-MM keys. */
export function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    keys.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return keys;
}

export function sumCharges(charges: Pick<Charge, "amount">[]): number {
  return charges.reduce((s, c) => s + Number(c.amount), 0);
}

export function sumPayments(payments: Pick<Payment, "amount">[]): number {
  return payments.reduce((s, p) => s + Number(p.amount), 0);
}

export function clientBalance(
  charges: Pick<Charge, "amount">[],
  payments: Pick<Payment, "amount">[]
): number {
  return sumCharges(charges) - sumPayments(payments);
}

export function buildLedger(charges: Charge[], payments: Payment[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    ...charges.map((c) => ({
      kind: "charge" as const,
      id: c.id,
      date: c.charge_date,
      amount: Number(c.amount),
      label: c.description || CHARGE_TYPE_LABELS[c.charge_type],
      detail: CHARGE_TYPE_LABELS[c.charge_type],
    })),
    ...payments.map((p) => ({
      kind: "payment" as const,
      id: p.id,
      date: p.paid_on,
      amount: Number(p.amount),
      label: PAYMENT_METHOD_LABELS[p.method],
      detail: p.note ?? "",
    })),
  ];
  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.kind === "charge" ? -1 : 1;
  });
  return entries;
}

/** Running balance after each ledger row (oldest → newest). */
export function ledgerWithRunningBalance(
  entries: LedgerEntry[]
): (LedgerEntry & { running: number })[] {
  let running = 0;
  return entries.map((e) => {
    running += e.kind === "charge" ? e.amount : -e.amount;
    return { ...e, running };
  });
}

export interface MonthlyRevenueRow {
  monthKey: string;
  label: string;
  total: number;
  count: number;
  venmo: number;
  zelle: number;
  cash: number;
  other: number;
}

export function groupPaymentsByMonth(payments: Payment[], monthKeys: string[]): MonthlyRevenueRow[] {
  const byMonth = new Map<string, MonthlyRevenueRow>();
  for (const key of monthKeys) {
    byMonth.set(key, {
      monthKey: key,
      label: monthLabelFromKey(key),
      total: 0,
      count: 0,
      venmo: 0,
      zelle: 0,
      cash: 0,
      other: 0,
    });
  }
  for (const p of payments) {
    const key = monthKeyFromDate(p.paid_on);
    const row = byMonth.get(key);
    if (!row) continue;
    const amt = Number(p.amount);
    row.total += amt;
    row.count += 1;
    row[p.method] += amt;
  }
  return monthKeys.map((k) => byMonth.get(k)!);
}

export function revenueThisMonth(payments: Payment[]): number {
  const key = monthKeyFromDate(todayYmdLocal());
  return payments
    .filter((p) => monthKeyFromDate(p.paid_on) === key)
    .reduce((s, p) => s + Number(p.amount), 0);
}
