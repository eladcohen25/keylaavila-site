"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/hooks/useSession";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import AuthShell from "@/components/portal/AuthShell";
import { Field, TextInput, PortalButton, ErrorBanner } from "@/components/portal/ui";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);

    const { data, error: authError } = await signUp(email, password, fullName);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    // If email confirmation is OFF, a session is returned immediately.
    if (data.session) {
      const supabase = getSupabaseBrowser();
      // Ensure phone is saved on the auto-created profile row.
      if (phone.trim()) {
        await supabase
          .from("profiles")
          .update({ phone: phone.trim() })
          .eq("id", data.session.user.id);
      }
      router.replace("/portal/onboarding");
    } else {
      // Email confirmation required.
      setNeedsConfirm(true);
      setSubmitting(false);
    }
  }

  if (needsConfirm) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent you a confirmation link. Click it to activate your account, then log in."
        footer={
          <Link href="/portal/login" className="font-medium text-terracotta hover:underline">
            Back to login
          </Link>
        }
      >
        <div className="rounded-lg bg-bg-alt p-4 text-center font-sans text-sm text-text-muted">
          Confirmation sent to <strong className="text-text">{email}</strong>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start training with Keyla"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/portal/login" className="font-medium text-terracotta hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Full name" required>
          <TextInput
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>
        <Field label="Email" required>
          <TextInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone">
          <TextInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </Field>
        <Field label="Password" required hint="At least 6 characters">
          <TextInput
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
        <ErrorBanner message={error} />
        <PortalButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating account..." : "Create Account"}
        </PortalButton>
      </form>
    </AuthShell>
  );
}
