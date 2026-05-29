"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/hooks/useSession";
import AuthShell from "@/components/portal/AuthShell";
import { Field, TextInput, PortalButton, ErrorBanner } from "@/components/portal/ui";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: resetError } = await requestPasswordReset(email);
    if (resetError) {
      setError(resetError.message);
      setSubmitting(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Reset link sent"
        subtitle="Check your inbox for a link to set a new password."
        footer={
          <Link href="/portal/login" className="font-medium text-terracotta hover:underline">
            Back to login
          </Link>
        }
      >
        <div className="rounded-lg bg-bg-alt p-4 text-center font-sans text-sm text-text-muted">
          Sent to <strong className="text-text">{email}</strong>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link href="/portal/login" className="font-medium text-terracotta hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <ErrorBanner message={error} />
        <PortalButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Sending..." : "Send Reset Link"}
        </PortalButton>
      </form>
    </AuthShell>
  );
}
