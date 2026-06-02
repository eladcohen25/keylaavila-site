"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  currentMonthStartLocal,
  monthLabelFromKey,
  monthKeyFromDate,
  todayYmdLocal,
} from "@/lib/trainer/billing";
import { PortalButton } from "@/components/portal/ui";

export default function PostMonthlyCharges({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function post() {
    const monthLabel = monthLabelFromKey(monthKeyFromDate(todayYmdLocal()));
    if (
      !confirm(
        `Post monthly charges for ${monthLabel} for all clients with an active recurring charge? Already-posted clients will be skipped.`
      )
    )
      return;

    setLoading(true);
    setMessage("");
    const supabase = getSupabaseBrowser();
    const chargeDate = currentMonthStartLocal();

    const { data: recurring, error: fetchErr } = await supabase
      .from("recurring_charges")
      .select("*")
      .eq("active", true);

    if (fetchErr) {
      setMessage(fetchErr.message);
      setLoading(false);
      return;
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rc of recurring ?? []) {
      const { error } = await supabase.from("charges").insert({
        client_id: rc.client_id,
        amount: rc.amount,
        charge_type: "monthly",
        description: rc.description,
        charge_date: chargeDate,
        recurring_charge_id: rc.id,
      });
      if (error) {
        if (error.code === "23505") skipped += 1;
        else errors.push(error.message);
      } else {
        created += 1;
      }
    }

    if (errors.length) {
      setMessage(`Posted ${created}, skipped ${skipped}. Errors: ${errors.join("; ")}`);
    } else if ((recurring ?? []).length === 0) {
      setMessage("No active recurring charges set up yet.");
    } else {
      setMessage(`Posted ${created} charge(s). Skipped ${skipped} (already posted this month).`);
    }
    setLoading(false);
    onDone();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PortalButton onClick={post} disabled={loading} variant="secondary">
        {loading ? "Posting…" : "Post monthly charges"}
      </PortalButton>
      {message && (
        <p className="font-sans text-sm text-text-muted">{message}</p>
      )}
    </div>
  );
}
