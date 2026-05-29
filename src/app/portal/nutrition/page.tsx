"use client";

import { useEffect, useState } from "react";
import PortalGate from "@/components/portal/PortalGate";
import { useProfile } from "@/hooks/useProfile";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { type NutritionPlan } from "@/lib/portal/types";
import { Card, Spinner } from "@/components/portal/ui";

function Macro({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4 text-center">
      <p className="font-serif text-2xl font-light text-text">
        {value ?? "—"}
        {value != null && <span className="text-base text-text-muted"> {unit}</span>}
      </p>
      <p className="mt-1 font-sans text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </div>
  );
}

function NutritionInner() {
  const { profile } = useProfile();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("client_id", profile.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const p = (data as NutritionPlan) ?? null;
      setPlan(p);

      if (p?.pdf_url) {
        // pdf_url stores the storage path; create a short-lived signed URL.
        const { data: signed } = await supabase.storage
          .from("nutrition-plans")
          .createSignedUrl(p.pdf_url, 60 * 60);
        setPdfUrl(signed?.signedUrl ?? null);
      }
      setLoading(false);
    })();
  }, [profile]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="font-serif text-3xl font-light tracking-tight text-text md:text-4xl">
        Nutrition
      </h1>
      <p className="mt-1 font-sans text-sm text-text-muted">
        Your meal plan and macro targets from Keyla.
      </p>

      <div className="mt-8">
        {loading ? (
          <Spinner />
        ) : !plan ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">
              No nutrition plan yet. Keyla will add yours soon.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Macro label="Calories" value={plan.calories} unit="kcal" />
              <Macro label="Protein" value={plan.protein_g} unit="g" />
              <Macro label="Carbs" value={plan.carbs_g} unit="g" />
              <Macro label="Fats" value={plan.fats_g} unit="g" />
            </div>

            {plan.notes && (
              <Card>
                <h2 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Notes from Keyla
                </h2>
                <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text">
                  {plan.notes}
                </p>
              </Card>
            )}

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-terracotta px-5 py-3 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download meal plan (PDF)
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function NutritionPage() {
  return (
    <PortalGate>
      <NutritionInner />
    </PortalGate>
  );
}
