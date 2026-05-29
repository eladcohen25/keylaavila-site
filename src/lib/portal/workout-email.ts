import { Resend } from "resend";
import { formatDuration } from "@/lib/portal/types";

export interface EmailSetLog {
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  done: boolean;
}

export interface EmailExercise {
  name: string;
  target_sets: number | null;
  target_reps: string | null;
  notes: string | null;
  sets: EmailSetLog[];
}

export interface WorkoutEmailPayload {
  clientName: string;
  dayLabel: string;
  durationSeconds: number;
  exercises: EmailExercise[];
}

function setLine(s: EmailSetLog): string {
  const parts: string[] = [];
  parts.push(s.weight != null ? `${s.weight} lb` : "—");
  parts.push(s.reps != null ? `${s.reps} reps` : "— reps");
  if (s.rpe != null) parts.push(`@ RPE ${s.rpe}`);
  const text = parts.join(" × ").replace("× @", "@");
  const check = s.done ? "✓" : "○";
  return `<span style="color:${s.done ? "#1C1917" : "#A89A8F"};">${check} Set ${s.set_number}: ${text}</span>`;
}

export async function sendWorkoutEmail(payload: WorkoutEmailPayload): Promise<void> {
  const to = process.env.KEYLA_EMAIL;
  if (!to) throw new Error("KEYLA_EMAIL is not set");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

  const from =
    process.env.RESEND_FROM_EMAIL ?? "Keyla Portal <portal@keylaavila.com>";

  const exerciseBlocks = payload.exercises
    .map((ex) => {
      const setsHtml = ex.sets
        .map((s) => `<li style="margin-bottom:4px;font-size:13px;">${setLine(s)}</li>`)
        .join("");
      const target =
        ex.target_sets || ex.target_reps
          ? `<span style="font-size:12px;color:#6B5F57;"> — target ${ex.target_sets ?? "?"} × ${ex.target_reps ?? "?"}</span>`
          : "";
      return `<div style="margin-bottom:18px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1C1917;">${ex.name}${target}</p>
        <ul style="margin:0;padding:0 0 0 4px;list-style:none;">${setsHtml}</ul>
        ${ex.notes ? `<p style="margin:6px 0 0;font-size:12px;color:#6B5F57;font-style:italic;">"${ex.notes}"</p>` : ""}
      </div>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #D4C0B5;overflow:hidden;">
      <div style="background:#1C1917;padding:24px 28px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C4714A;">Workout Logged</p>
        <h1 style="margin:8px 0 0;font-size:22px;font-weight:400;color:#F5F0EA;">${payload.clientName}</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#D4C0B5;">${payload.dayLabel} · ${formatDuration(payload.durationSeconds)}</p>
      </div>
      <div style="padding:24px 28px;">
        ${exerciseBlocks || '<p style="color:#6B5F57;">No sets logged.</p>'}
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#6B5F57;">Sent from the keylaavila.com client portal</p>
  </div>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Workout logged — ${payload.clientName} (${payload.dayLabel})`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
