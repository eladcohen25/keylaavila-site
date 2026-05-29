"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/hooks/useSession";
import AuthShell from "@/components/portal/AuthShell";
import { Field, TextInput, PortalButton, ErrorBanner } from "@/components/portal/ui";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
    } else {
      router.replace("/portal/dashboard");
    }
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="New password" required hint="At least 6 characters">
          <TextInput
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm password" required>
          <TextInput
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>
        <ErrorBanner message={error} />
        <PortalButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Updating..." : "Update Password"}
        </PortalButton>
      </form>
    </AuthShell>
  );
}
