"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";
import Avatar from "@/components/portal/Avatar";

interface ClientRow extends Profile {
  last_workout: string | null;
  last_checkin: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ClientList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: profiles }, { data: sessions }, { data: checkins }] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "client").order("full_name", { ascending: true }),
        supabase
          .from("workout_sessions")
          .select("client_id, created_at")
          .eq("submitted", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("checkins")
          .select("client_id, client_name, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const lastWorkout = new Map<string, string>();
      for (const s of (sessions as { client_id: string; created_at: string }[]) ?? []) {
        if (!lastWorkout.has(s.client_id)) lastWorkout.set(s.client_id, s.created_at);
      }
      const lastCheckinById = new Map<string, string>();
      const lastCheckinByName = new Map<string, string>();
      for (const c of (checkins as { client_id: string | null; client_name: string; created_at: string }[]) ?? []) {
        if (c.client_id && !lastCheckinById.has(c.client_id)) lastCheckinById.set(c.client_id, c.created_at);
        const key = (c.client_name ?? "").trim().toLowerCase();
        if (key && !lastCheckinByName.has(key)) lastCheckinByName.set(key, c.created_at);
      }

      const rows: ClientRow[] = ((profiles as Profile[]) ?? []).map((p) => ({
        ...p,
        last_workout: lastWorkout.get(p.id) ?? null,
        last_checkin:
          lastCheckinById.get(p.id) ?? lastCheckinByName.get((p.full_name ?? "").trim().toLowerCase()) ?? null,
      }));
      setClients(rows);
      setLoading(false);
    })();
  }, []);

  const filtered = clients.filter(
    (c) =>
      (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl tracking-tight text-text">Clients</h1>
          <p className="mt-0.5 font-sans text-sm text-text-muted">{clients.length} total</p>
        </div>
        <input
          type="text"
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
        />
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <Card className="text-center">
          <p className="font-sans text-sm text-text-muted">
            {search ? "No clients match your search." : "No clients have signed up yet."}
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {/* Header row (desktop) */}
          <div className="hidden grid-cols-[1fr_110px_120px_120px_24px] items-center gap-4 border-b border-border bg-bg-alt/60 px-5 py-2.5 sm:grid">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">Client</span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">Last workout</span>
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">Last check-in</span>
            <span />
          </div>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/trainer/clients/${c.id}`)}
              className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-0 hover:bg-bg-alt/50 sm:grid-cols-[1fr_110px_120px_120px_24px] sm:gap-4 sm:px-5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={c.full_name} url={c.avatar_url} size={38} color={c.color} />
                <span className="min-w-0">
                  <span className="block truncate font-sans text-sm font-medium text-text group-hover:text-terracotta">
                    {c.full_name || "Unnamed"}
                  </span>
                  <span className="block truncate font-sans text-xs text-text-muted">{c.email}</span>
                </span>
              </span>
              <span
                className={`justify-self-start rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                  c.onboarding_complete ? "bg-olive/10 text-olive" : "bg-blush text-burgundy"
                }`}
              >
                {c.onboarding_complete ? "Active" : "Pending"}
              </span>
              <span className="hidden font-sans text-xs text-text-muted sm:block">{fmtDate(c.last_workout)}</span>
              <span className="hidden font-sans text-xs text-text-muted sm:block">{fmtDate(c.last_checkin)}</span>
              <svg
                className="hidden text-text-muted/50 group-hover:text-terracotta sm:block"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function ClientsPage() {
  return (
    <TrainerLayout>
      <ClientList />
    </TrainerLayout>
  );
}
