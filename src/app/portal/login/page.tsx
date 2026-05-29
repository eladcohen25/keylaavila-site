"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "@/hooks/useSession";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import AuthShell from "@/components/portal/AuthShell";
import { Field, TextInput, PortalButton, ErrorBanner, Spinner } from "@/components/portal/ui";

export default function LoginPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    // Route to the right place based on role.
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("role, onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role === "trainer") {
        router.replace("/trainer");
      } else if (!data || !data.onboarding_complete) {
        router.replace("/portal/onboarding");
      } else {
        router.replace("/portal/dashboard");
      }
    })();
  }, [loading, session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setError(authError.message);
      setSubmitting(false);
    }
    // On success the effect above handles redirect.
  }

  if (loading || session) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to access your workouts and check-ins"
      footer={
        <>
          New client?{" "}
          <Link href="/portal/signup" className="font-medium text-terracotta hover:underline">
            Create an account
          </Link>
        </>
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
        <Field label="Password" required>
          <TextInput
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </Field>
        <ErrorBanner message={error} />
        <PortalButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in..." : "Sign In"}
        </PortalButton>
        <p className="text-center">
          <Link
            href="/portal/reset"
            className="font-sans text-xs text-text-muted hover:text-terracotta"
          >
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
