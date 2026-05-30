"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useProfile } from "@/hooks/useProfile";
import type { NutritionPlan } from "@/lib/portal/types";
import { Card, Field, TextInput, TextArea, PortalButton, ErrorBanner, Spinner } from "@/components/portal/ui";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export default function NutritionEditor({ clientId }: { clientId: string }) {
  const { profile } = useProfile();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("nutrition_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const p = (data as NutritionPlan) ?? null;
      setPlan(p);
      if (p) {
        setCalories(p.calories != null ? String(p.calories) : "");
        setProtein(p.protein_g != null ? String(p.protein_g) : "");
        setCarbs(p.carbs_g != null ? String(p.carbs_g) : "");
        setFats(p.fats_g != null ? String(p.fats_g) : "");
        setNotes(p.notes ?? "");
        if (p.pdf_url) setPdfName(p.pdf_url.split("/").pop() ?? "current.pdf");
      }
      setLoading(false);
    })();
  }, [clientId]);

  function pickFile(f: File | null) {
    setError("");
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      setError("PDF must be under 20 MB.");
      return;
    }
    setPdfFile(f);
    setPdfName(f.name);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError("");
    setMsg("");
    const supabase = getSupabaseBrowser();

    let pdfPath = plan?.pdf_url ?? null;

    if (pdfFile) {
      const path = `${clientId}/meal-plan-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("nutrition-plans")
        .upload(path, pdfFile, { contentType: "application/pdf", upsert: true });
      if (upErr) {
        setSaving(false);
        setError(`PDF upload failed: ${upErr.message}`);
        return;
      }
      pdfPath = path;
    }

    const payload = {
      client_id: clientId,
      pdf_url: pdfPath,
      notes: notes.trim() || null,
      calories: calories === "" ? null : Number(calories),
      protein_g: protein === "" ? null : Number(protein),
      carbs_g: carbs === "" ? null : Number(carbs),
      fats_g: fats === "" ? null : Number(fats),
      updated_at: new Date().toISOString(),
      updated_by: profile.id,
    };

    const { error: saveErr } = plan
      ? await supabase.from("nutrition_plans").update(payload).eq("id", plan.id)
      : await supabase.from("nutrition_plans").insert(payload);

    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    setPdfFile(null);
    setMsg("Nutrition plan saved.");
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) return <Spinner />;

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Macro targets
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Calories">
            <TextInput type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2000" />
          </Field>
          <Field label="Protein (g)">
            <TextInput type="number" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="150" />
          </Field>
          <Field label="Carbs (g)">
            <TextInput type="number" inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="200" />
          </Field>
          <Field label="Fats (g)">
            <TextInput type="number" inputMode="numeric" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="60" />
          </Field>
        </div>
      </div>

      <Field label="Notes for client">
        <TextArea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Meal timing, food swaps, hydration, supplements…"
        />
      </Field>

      <div>
        <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
          Meal plan PDF
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-3">
          <PortalButton variant="secondary" onClick={() => fileRef.current?.click()}>
            {pdfName ? "Replace PDF" : "Upload PDF"}
          </PortalButton>
          {pdfName && (
            <span className="font-sans text-sm text-text-muted">
              {pdfFile ? "New: " : "Current: "}
              {pdfName}
            </span>
          )}
        </div>
      </div>

      <ErrorBanner message={error} />
      {msg && <p className="font-sans text-sm font-medium text-olive">{msg}</p>}

      <PortalButton onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save nutrition plan"}
      </PortalButton>
    </Card>
  );
}
