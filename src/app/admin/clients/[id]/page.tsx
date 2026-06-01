"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { CHECKIN_LABELS } from "@/lib/checkin-types";
import TrendCharts from "@/components/admin/TrendCharts";
import ProgressPhotos from "@/components/admin/ProgressPhotos";
import { use } from "react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

interface CheckIn {
  id: string;
  created_at: string;
  week_of: string;
  client_name: string;
  sessions_with_keyla: number;
  solo_session: string | null;
  session_difficulty: string;
  push_preference: string;
  nutrition_rating: number;
  nutrition_notes: string | null;
  sleep_hours: number | null;
  recovery: string;
  energy_mood: number;
  weekly_notes: string | null;
  photo_front_url: string | null;
  photo_back_url: string | null;
  weight: number | null;
}

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "photos" | "trends">(
    "history"
  );
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseBrowser();

    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (!clientData) {
      router.replace("/admin/dashboard");
      return;
    }
    setClient(clientData);

    const { data: checkinData } = await supabase
      .from("checkins")
      .select("*")
      .eq("client_id", id)
      .order("week_of", { ascending: false });

    setCheckins(checkinData || []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function copyUrl() {
    const url = `${window.location.origin}/checkin/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!client) return null;

  const checkinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${id}`;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-4 flex items-center gap-1 font-sans text-sm text-text-muted transition hover:text-text"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Clients
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-light tracking-tight text-text">
              {client.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-muted">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  client.active
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {client.active ? "Active" : "Inactive"}
              </span>
            </div>
            {client.notes && (
              <p className="mt-2 max-w-lg font-sans text-sm text-text-muted">
                {client.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-bg p-2">
              <input
                readOnly
                value={checkinUrl}
                className="w-48 bg-transparent font-mono text-[11px] text-text outline-none sm:w-64"
              />
              <button
                onClick={copyUrl}
                className="shrink-0 rounded-md bg-terracotta px-2.5 py-1 font-sans text-[11px] font-medium text-white transition hover:bg-terracotta/90"
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            </div>
            <p className="font-sans text-[11px] text-text-muted">
              {checkins.length} check-ins total
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-bg p-1">
        {(["history", "photos", "trends"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 font-sans text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "bg-white text-text shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab === "history"
              ? "Check-In History"
              : tab === "photos"
                ? "Progress Photos"
                : "Trends"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "history" && (
        <CheckInHistory checkins={checkins} />
      )}
      {activeTab === "photos" && (
        <ProgressPhotos checkins={checkins} />
      )}
      {activeTab === "trends" && (
        <TrendCharts checkins={checkins} />
      )}
    </AdminLayout>
  );
}

function CheckInHistory({ checkins }: { checkins: CheckIn[] }) {
  if (checkins.length === 0) {
    return (
      <div className="rounded-xl border border-text/5 bg-white p-12 text-center">
        <p className="font-sans text-text-muted">No check-ins yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {checkins.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-text/5 bg-white p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-sans text-sm font-medium text-text">
                Week of {new Date(c.week_of).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </h4>
              <p className="mt-0.5 font-sans text-[11px] text-text-muted">
                Submitted{" "}
                {new Date(c.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MetricBadge label="Energy" value={c.energy_mood} max={5} />
              <MetricBadge label="Nutrition" value={c.nutrition_rating} max={5} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Sessions w/ Keyla" value={String(c.sessions_with_keyla)} />
            <MiniStat
              label="Difficulty"
              value={
                CHECKIN_LABELS.session_difficulty[
                  c.session_difficulty as keyof typeof CHECKIN_LABELS.session_difficulty
                ] || c.session_difficulty
              }
            />
            <MiniStat
              label="Preference"
              value={
                CHECKIN_LABELS.push_preference[
                  c.push_preference as keyof typeof CHECKIN_LABELS.push_preference
                ] ||
                c.push_preference ||
                "—"
              }
            />
            <MiniStat
              label="Recovery"
              value={
                CHECKIN_LABELS.recovery[
                  c.recovery as keyof typeof CHECKIN_LABELS.recovery
                ] || c.recovery
              }
            />
          </div>

          {c.sleep_hours && (
            <div className="mt-3">
              <MiniStat label="Sleep" value={`${c.sleep_hours} hrs/night`} />
            </div>
          )}

          {c.nutrition_notes && (
            <p className="mt-3 rounded-lg bg-bg p-3 font-sans text-xs text-text-muted">
              <span className="font-medium text-text">Nutrition notes:</span>{" "}
              {c.nutrition_notes}
            </p>
          )}

          {c.weekly_notes && (
            <p className="mt-2 rounded-lg bg-bg p-3 font-sans text-xs text-text-muted">
              <span className="font-medium text-text">Weekly notes:</span>{" "}
              {c.weekly_notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricBadge({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const pct = value / max;
  const color =
    pct >= 0.8
      ? "bg-green-50 text-green-700"
      : pct >= 0.6
        ? "bg-yellow-50 text-yellow-700"
        : "bg-red-50 text-red-700";

  return (
    <span className={`rounded-full px-2.5 py-1 font-sans text-[11px] font-medium ${color}`}>
      {label}: {value}/{max}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-[10px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 font-sans text-sm text-text">{value}</p>
    </div>
  );
}
