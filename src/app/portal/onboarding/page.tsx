"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PortalButton,
  ErrorBanner,
  Card,
  Spinner,
} from "@/components/portal/ui";

const WAIVER_TEXT = `I understand that participation in personal training, Pilates, and related physical activity involves inherent risks, including but not limited to muscle strains, sprains, falls, and in rare cases more serious injury. I confirm that I am voluntarily participating and that I am in adequate physical condition to do so.

I have disclosed any medical conditions, injuries, and medications relevant to my participation. I agree to inform my trainer of any changes to my health.

I assume full responsibility for any risks of injury or harm and release Keyla Avila and her affiliates from any liability, claims, or demands arising from my participation, to the fullest extent permitted by law.

By typing my name and checking the box below, I acknowledge that I have read, understood, and agree to this waiver.`;

function OnboardingInner() {
  const { profile, loading, refresh } = useProfile();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Health intake fields
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [injuries, setInjuries] = useState("");
  const [medical, setMedical] = useState("");
  const [medications, setMedications] = useState("");
  const [goals, setGoals] = useState("");
  const [activity, setActivity] = useState("");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");

  // Waiver fields
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && profile?.onboarding_complete) {
      router.replace("/portal/dashboard");
    }
    if (profile?.full_name && !signedName) {
      setSignedName(profile.full_name);
    }
  }, [loading, profile, router, signedName]);

  if (loading) return <Spinner />;

  async function handleIntakeSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!profile) return;
    setSubmitting(true);

    const supabase = getSupabaseBrowser();
    const { error: intakeError } = await supabase.from("health_intake").insert({
      client_id: profile.id,
      dob: dob || null,
      height: height || null,
      weight: weight ? Number(weight) : null,
      injuries: injuries || null,
      medical_conditions: medical || null,
      medications: medications || null,
      goals: goals || null,
      activity_level: activity || null,
      emergency_contact_name: ecName || null,
      emergency_contact_phone: ecPhone || null,
    });

    setSubmitting(false);
    if (intakeError) {
      setError(`Could not save your intake: ${intakeError.message}`);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleWaiverSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!agreed || !signedName.trim()) {
      setError("Please type your name and check the agreement box.");
      return;
    }
    setSubmitting(true);

    const supabase = getSupabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please log in again.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/portal/waiver", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ signed_name: signedName.trim(), agreed: true }),
    });

    const json = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok || !json.ok) {
      setError(json.error || "Something went wrong. Please try again.");
      return;
    }

    await refresh();
    router.replace("/portal/dashboard");
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-8">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
          Step {step} of 2
        </span>
        <h1 className="mt-2 font-serif text-3xl font-light tracking-tight text-text">
          {step === 1 ? "Health Intake" : "Liability Waiver"}
        </h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          {step === 1
            ? "This helps Keyla train you safely. Be thorough and honest."
            : "Please read and sign before we begin."}
        </p>
        <div className="mt-4 flex gap-2">
          <div className="h-1 flex-1 rounded-full bg-terracotta" />
          <div className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-terracotta" : "bg-border"}`} />
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleIntakeSubmit}>
          <Card className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Date of birth">
                <TextInput type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
              <Field label="Activity level">
                <SelectInput value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option value="">Select…</option>
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly active</option>
                  <option value="moderate">Moderately active</option>
                  <option value="very">Very active</option>
                  <option value="athlete">Athlete</option>
                </SelectInput>
              </Field>
              <Field label="Height" hint={`e.g. 5'6"`}>
                <TextInput value={height} onChange={(e) => setHeight(e.target.value)} placeholder={`5'6"`} />
              </Field>
              <Field label="Weight (lbs)">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="150"
                />
              </Field>
            </div>

            <Field label="Goals" hint="What do you want to achieve?">
              <TextArea
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="Build strength, lose body fat, improve mobility…"
              />
            </Field>
            <Field label="Injuries (past or current)">
              <TextArea
                rows={2}
                value={injuries}
                onChange={(e) => setInjuries(e.target.value)}
                placeholder="Lower back, right knee, shoulder…"
              />
            </Field>
            <Field label="Medical conditions">
              <TextArea
                rows={2}
                value={medical}
                onChange={(e) => setMedical(e.target.value)}
                placeholder="Asthma, high blood pressure, none…"
              />
            </Field>
            <Field label="Medications">
              <TextArea
                rows={2}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="List any medications, or 'none'"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Emergency contact name">
                <TextInput value={ecName} onChange={(e) => setEcName(e.target.value)} placeholder="Name" />
              </Field>
              <Field label="Emergency contact phone">
                <TextInput
                  type="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </Field>
            </div>

            <ErrorBanner message={error} />
            <PortalButton type="submit" disabled={submitting} className="w-full">
              {submitting ? "Saving…" : "Continue to Waiver"}
            </PortalButton>
          </Card>
        </form>
      ) : (
        <form onSubmit={handleWaiverSubmit}>
          <Card className="space-y-5">
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-bg p-4 font-sans text-sm leading-relaxed text-text-muted">
              {WAIVER_TEXT.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {para}
                </p>
              ))}
            </div>

            <Field label="Type your full legal name to sign" required>
              <TextInput
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder="Your full name"
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-terracotta"
              />
              <span className="font-sans text-sm text-text">
                I have read and agree to the liability waiver above.
              </span>
            </label>

            <ErrorBanner message={error} />
            <div className="flex gap-3">
              <PortalButton variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </PortalButton>
              <PortalButton type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Submitting…" : "Sign & Finish"}
              </PortalButton>
            </div>
          </Card>
        </form>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <PortalGate requireOnboarding={false} hideHeader>
      <OnboardingInner />
    </PortalGate>
  );
}
