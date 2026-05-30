"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TrainerLayout from "@/components/trainer/TrainerLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";

interface ClientRow extends Profile {
  last_workout: string | null;
  last_checkin: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ClientList() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const [{ data: profiles }, { data: sessions }, { data: checkins }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("role", "client")
            .order("full_name", { ascending: true }),
          supabase
            .from("workout_sessions")
            .select("client_id, created_at")
            .eq("submitted", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("checkins")
            .select("client_name, created_at")
            .order("created_at", { ascending: false }),
        ]);

      // latest workout per client_id
      const lastWorkout = new Map<string, string>();
      for (const s of (sessions as { client_id: string; created_at: string }[]) ?? []) {
        if (!lastWorkout.has(s.client_id)) lastWorkout.set(s.client_id, s.created_at);
      }
      // latest check-in per lowercased client_name (check-ins link by name)
      const lastCheckin = new Map<string, string>();
      for (const c of (checkins as { client_name: string; created_at: string }[]) ?? []) {
        const key = (c.client_name ?? "").trim().toLowerCase();
        if (key && !lastCheckin.has(key)) lastCheckin.set(key, c.created_at);
      }

      const rows: ClientRow[] = ((profiles as Profile[]) ?? []).map((p) => ({
        ...p,
        last_workout: lastWorkout.get(p.id) ?? null,
        last_checkin: lastCheckin.get((p.full_name ?? "").trim().toLowerCase()) ?? null,
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
          <h1 className="font-serif text-2xl font-light tracking-tight text-text">Clients</h1>
          <p className="mt-1 font-sans text-sm text-text-muted">
            {clients.length} total
          </p>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/trainer/clients/${c.id}`)}
              className="group rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition hover:border-terracotta/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-sans text-base font-medium text-text group-hover:text-terracotta">
                    {c.full_name || "Unnamed"}
                  </h3>
                  {c.email && (
                    <p className="mt-0.5 font-sans text-xs text-text-muted">{c.email}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider ${
                    c.onboarding_complete
                      ? "bg-olive/15 text-olive"
                      : "bg-blush text-burgundy"
                  }`}
                >
                  {c.onboarding_complete ? "Active" : "Pending"}
                </span>
              </div>
              <dl className="mt-4 space-y-1 font-sans text-xs text-text-muted">
                <div className="flex justify-between">
                  <dt>Last workout</dt>
                  <dd className="text-text">{fmtDate(c.last_workout)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last check-in</dt>
                  <dd className="text-text">{fmtDate(c.last_checkin)}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function TrainerHome() {
  return (
    <TrainerLayout>
      <ClientList />
    </TrainerLayout>
  );
}
