import { Resend } from "resend";
import {
  CHECKIN_LABELS,
  type CheckInRecord,
} from "@/lib/checkin-types";

function fmt(n: number | null, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${n}${suffix}`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px 8px 0;color:#6B5F57;font-size:13px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1C1917;">${value}</td>
  </tr>`;
}

export async function sendCheckInEmail(
  checkin: CheckInRecord,
  photoFrontSignedUrl: string | null,
  photoBackSignedUrl: string | null
): Promise<void> {
  const to = process.env.KEYLA_EMAIL;
  if (!to) throw new Error("KEYLA_EMAIL is not set");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

  const from =
    process.env.RESEND_FROM_EMAIL ??
    "Keyla Check-In <checkin@keylaavila.com>";

  const difficulty = CHECKIN_LABELS.session_difficulty[checkin.session_difficulty];
  const recovery = CHECKIN_LABELS.recovery[checkin.recovery];
  const sessions =
    checkin.sessions_with_keyla >= 4
      ? "4+"
      : String(checkin.sessions_with_keyla);

  const photoBlock = (label: string, url: string | null) =>
    url
      ? `<div style="margin-top:12px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.08em;color:#C4714A;">${label}</p>
          <a href="${url}"><img src="${url}" alt="${label}" width="200" style="border-radius:8px;display:block;max-width:100%;height:auto;" /></a>
          <p style="margin:6px 0 0;"><a href="${url}" style="color:#C4714A;font-size:12px;">Open full image</a></p>
        </div>`
      : `<p style="color:#6B5F57;font-size:13px;">${label}: not uploaded</p>`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:12px;border:1px solid #D4C0B5;overflow:hidden;">
      <div style="background:#1C1917;padding:24px 28px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C4714A;">Weekly Check-In</p>
        <h1 style="margin:8px 0 0;font-size:22px;font-weight:400;color:#F5F0EA;">${checkin.client_name}</h1>
        <p style="margin:4px 0 0;font-size:13px;color:#D4C0B5;">Week of ${checkin.week_of}</p>
      </div>

      <div style="padding:24px 28px;background:#EDE5D8;border-bottom:1px solid #D4C0B5;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#6B5F57;">Coaching signals</p>
        <ul style="margin:0;padding:0;list-style:none;">
          <li style="margin-bottom:10px;font-size:14px;color:#1C1917;">
            <strong>Difficulty:</strong> ${difficulty}
          </li>
          <li style="font-size:14px;color:#1C1917;">
            <strong>Recovery / Energy:</strong> ${recovery} / ${checkin.energy_mood}/5
          </li>
        </ul>
      </div>

      <div style="padding:24px 28px;">
        <h2 style="margin:0 0 12px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C4714A;">Body metrics</h2>
        <table style="border-collapse:collapse;width:100%;">
          ${row("Weight", fmt(checkin.weight, " lbs"))}
          ${row("Waist", fmt(checkin.waist, '"'))}
          ${row("Hips", fmt(checkin.hips, '"'))}
          ${row("Chest", fmt(checkin.chest, '"'))}
          ${row("Arms", fmt(checkin.arms, '"'))}
          ${row("Thighs", fmt(checkin.thighs, '"'))}
        </table>

        <h2 style="margin:24px 0 12px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C4714A;">Training</h2>
        <table style="border-collapse:collapse;width:100%;">
          ${row("Sessions with Keyla", sessions)}
          ${row("Solo session", checkin.solo_session ? CHECKIN_LABELS.solo_session[checkin.solo_session] : "—")}
          ${row("Difficulty", difficulty)}
        </table>

        <h2 style="margin:24px 0 12px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C4714A;">Fuel & recovery</h2>
        <table style="border-collapse:collapse;width:100%;">
          ${row("Nutrition", `${checkin.nutrition_rating}/5`)}
          ${row("Sleep", fmt(checkin.sleep_hours, " hrs/night"))}
          ${row("Recovery", recovery)}
          ${row("Energy & mood", `${checkin.energy_mood}/5`)}
        </table>
        ${
          checkin.nutrition_notes
            ? `<p style="margin:12px 0 0;padding:12px;background:#F5F0EA;border-radius:8px;font-size:13px;color:#1C1917;line-height:1.6;"><strong>Food notes:</strong> ${checkin.nutrition_notes}</p>`
            : ""
        }

        ${
          checkin.weekly_notes
            ? `<h2 style="margin:24px 0 12px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C4714A;">Wins & struggles</h2>
               <p style="margin:0;padding:12px;background:#F5F0EA;border-radius:8px;font-size:13px;color:#1C1917;line-height:1.6;">${checkin.weekly_notes}</p>`
            : ""
        }

        <h2 style="margin:24px 0 12px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#C4714A;">Progress photos</h2>
        ${photoBlock("Front", photoFrontSignedUrl)}
        ${photoBlock("Back", photoBackSignedUrl)}
      </div>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#6B5F57;">Sent from keylaavila.com weekly check-in</p>
  </div>
</body>
</html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Weekly Check-In — ${checkin.client_name} (week of ${checkin.week_of})`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
