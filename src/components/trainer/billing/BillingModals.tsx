"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  type Charge,
  type ChargeType,
  type PaymentMethod,
  CHARGE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  parseAmount,
  todayYmdLocal,
} from "@/lib/trainer/billing";
import { Field, TextInput, TextArea, SelectInput, PortalButton } from "@/components/portal/ui";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-light text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-sm text-text-muted hover:text-text"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LogPaymentModal({
  clientId,
  charges,
  onClose,
  onSaved,
}: {
  clientId: string;
  charges: Charge[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("venmo");
  const [paidOn, setPaidOn] = useState(todayYmdLocal());
  const [note, setNote] = useState("");
  const [chargeId, setChargeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!amt) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from("payments").insert({
      client_id: clientId,
      amount: amt,
      method,
      paid_on: paidOn,
      note: note.trim() || null,
      charge_id: chargeId || null,
    });
    if (err) setError(err.message);
    else onSaved();
    setSaving(false);
  }

  const openCharges = charges.filter(
    (c) => c.charge_type === "package" || c.charge_type === "session" || c.charge_type === "other"
  );

  return (
    <ModalShell title="Log payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount" required>
          <TextInput
            type="text"
            inputMode="decimal"
            placeholder="150.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Method" required>
          <SelectInput value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Paid on" required>
          <TextInput type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} required />
        </Field>
        {openCharges.length > 0 && (
          <Field label="Apply to charge" hint="Optional">
            <SelectInput value={chargeId} onChange={(e) => setChargeId(e.target.value)}>
              <option value="">— General payment —</option>
              {openCharges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.description || CHARGE_TYPE_LABELS[c.charge_type]} ({Number(c.amount)})
                </option>
              ))}
            </SelectInput>
          </Field>
        )}
        <Field label="Note">
          <TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </Field>
        {error && <p className="font-sans text-sm text-burgundy">{error}</p>}
        <PortalButton type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Log payment"}
        </PortalButton>
      </form>
    </ModalShell>
  );
}

export function AddChargeModal({
  clientId,
  initialType = "other",
  onClose,
  onSaved,
}: {
  clientId: string;
  initialType?: ChargeType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [chargeType, setChargeType] = useState<ChargeType>(initialType);
  const [description, setDescription] = useState("");
  const [chargeDate, setChargeDate] = useState(todayYmdLocal());
  const [sessionsIncluded, setSessionsIncluded] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!amt) {
      setError("Enter a valid amount.");
      return;
    }
    let sessions: number | null = null;
    if (chargeType === "package") {
      const n = parseInt(sessionsIncluded, 10);
      if (!Number.isInteger(n) || n < 1) {
        setError("Packages need sessions included (e.g. 10).");
        return;
      }
      sessions = n;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from("charges").insert({
      client_id: clientId,
      amount: amt,
      charge_type: chargeType,
      description: description.trim() || CHARGE_TYPE_LABELS[chargeType],
      charge_date: chargeDate,
      sessions_included: sessions,
      sessions_used: 0,
    });
    if (err) setError(err.message);
    else onSaved();
    setSaving(false);
  }

  return (
    <ModalShell title="Add charge" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount" required>
          <TextInput
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Type" required>
          <SelectInput
            value={chargeType}
            onChange={(e) => setChargeType(e.target.value as ChargeType)}
          >
            {(Object.keys(CHARGE_TYPE_LABELS) as ChargeType[]).map((t) => (
              <option key={t} value={t}>
                {CHARGE_TYPE_LABELS[t]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Description">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Charge date" required>
          <TextInput
            type="date"
            value={chargeDate}
            onChange={(e) => setChargeDate(e.target.value)}
            required
          />
        </Field>
        {chargeType === "package" && (
          <Field label="Sessions included" required>
            <TextInput
              type="number"
              min={1}
              value={sessionsIncluded}
              onChange={(e) => setSessionsIncluded(e.target.value)}
              required
            />
          </Field>
        )}
        {error && <p className="font-sans text-sm text-burgundy">{error}</p>}
        <PortalButton type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Add charge"}
        </PortalButton>
      </form>
    </ModalShell>
  );
}

export function SellPackageModal({
  clientId,
  onClose,
  onSaved,
}: {
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [sessions, setSessions] = useState("10");
  const [description, setDescription] = useState("Training package");
  const [chargeDate, setChargeDate] = useState(todayYmdLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    const n = parseInt(sessions, 10);
    if (!amt) {
      setError("Enter a valid amount.");
      return;
    }
    if (!Number.isInteger(n) || n < 1) {
      setError("Enter sessions included.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const { error: err } = await supabase.from("charges").insert({
      client_id: clientId,
      amount: amt,
      charge_type: "package",
      description: description.trim() || `${n}-session package`,
      charge_date: chargeDate,
      sessions_included: n,
      sessions_used: 0,
    });
    if (err) setError(err.message);
    else onSaved();
    setSaving(false);
  }

  return (
    <ModalShell title="Sell package" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Package price" required>
          <TextInput
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Sessions included" required>
          <TextInput
            type="number"
            min={1}
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            required
          />
        </Field>
        <Field label="Description">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Date" required>
          <TextInput
            type="date"
            value={chargeDate}
            onChange={(e) => setChargeDate(e.target.value)}
            required
          />
        </Field>
        {error && <p className="font-sans text-sm text-burgundy">{error}</p>}
        <PortalButton type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Create package"}
        </PortalButton>
      </form>
    </ModalShell>
  );
}

export function RecurringChargeModal({
  clientId,
  existing,
  onClose,
  onSaved,
}: {
  clientId: string;
  existing: { id: string; amount: number; description: string; active: boolean } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [description, setDescription] = useState(existing?.description ?? "Monthly training");
  const [active, setActive] = useState(existing?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseAmount(amount);
    if (!amt) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowser();
    const payload = {
      client_id: clientId,
      amount: amt,
      description: description.trim() || "Monthly training",
      active,
    };
    const { error: err } = existing
      ? await supabase.from("recurring_charges").update(payload).eq("id", existing.id)
      : await supabase.from("recurring_charges").insert(payload);
    if (err) setError(err.message);
    else onSaved();
    setSaving(false);
  }

  return (
    <ModalShell title={existing ? "Edit recurring charge" : "Set recurring monthly charge"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Monthly amount" required>
          <TextInput
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Description">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 font-sans text-sm text-text">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-terracotta"
          />
          Active (include in &quot;Post monthly charges&quot;)
        </label>
        {error && <p className="font-sans text-sm text-burgundy">{error}</p>}
        <PortalButton type="submit" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save"}
        </PortalButton>
      </form>
    </ModalShell>
  );
}
