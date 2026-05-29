"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";

type SubmitState = "idle" | "loading" | "success" | "error";

/** Resize + compress an image to JPEG, max 1200px on longest side, ~80% quality.
 *  Keeps each photo well under Vercel's 4.5 MB body limit. */
async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

const inputClasses =
  "w-full rounded-lg border border-border bg-bg/50 px-5 py-4 font-sans text-sm font-light text-text placeholder:text-text-muted/50 transition-all duration-200 focus:border-terracotta focus:shadow-[0_0_0_3px_rgba(196,113,74,0.2)] focus:outline-none";

const labelClasses =
  "mb-2 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function Section({
  num,
  title,
  note,
  children,
}: {
  num: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-terracotta/15 bg-bg p-6 md:p-8">
      <div className="mb-6 border-b border-border/40 pb-4">
        <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
          {num}
        </span>
        <h2 className="mt-1 font-serif text-2xl font-light text-text">{title}</h2>
        {note && (
          <p className="mt-2 font-sans text-sm font-light text-text-muted">{note}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function ScaleInput({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
  required,
}: {
  name: string;
  value: number | "";
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  required?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between gap-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-all ${
              value === n
                ? "border-terracotta bg-terracotta/10 text-text"
                : "border-border bg-bg/50 text-text-muted hover:border-terracotta/40"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={n}
              required={required && value === ""}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span className="font-serif text-xl font-light">{n}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-sans text-[10px] uppercase tracking-wider text-text-muted">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  required,
  colorMap,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  colorMap?: Record<string, string>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        const color = colorMap?.[opt.value];
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
              selected
                ? color
                  ? `${color} border-current`
                  : "border-terracotta bg-terracotta/10"
                : "border-border bg-bg/50 hover:border-terracotta/30"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              required={required && !value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 accent-terracotta"
            />
            <span className="font-sans text-sm font-light text-text">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function PhotoUpload({
  id,
  label,
  file,
  onChange,
}: {
  id: string;
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div
        className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-bg/30 transition-colors hover:border-terracotta/50"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <div className="relative h-[200px] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`${label} preview`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute right-2 top-2 rounded-full bg-text/80 px-3 py-1 font-sans text-[10px] uppercase tracking-wider text-bg"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <svg
              className="mx-auto mb-2 text-text-muted/50"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="font-sans text-sm text-text-muted">Tap to upload</p>
            <p className="mt-1 font-sans text-[11px] text-text-muted/70">
              JPEG, PNG, or WebP · max 10 MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

export default function CheckInForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [clientName, setClientName] = useState("");
  const [weekOf, setWeekOf] = useState(todayISO);
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [sessions, setSessions] = useState("");
  const [soloSession, setSoloSession] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [pushPref, setPushPref] = useState("");
  const [nutritionRating, setNutritionRating] = useState<number | "">("");
  const [nutritionNotes, setNutritionNotes] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [recovery, setRecovery] = useState("");
  const [energyMood, setEnergyMood] = useState<number | "">("");
  const [weeklyNotes, setWeeklyNotes] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState("loading");
    setErrorMsg("");
    setMissingFields([]);

    const form = e.currentTarget;
    const fd = new FormData(form);

    if (photoFront) fd.set("photo_front", await compressImage(photoFront));
    if (photoBack) fd.set("photo_back", await compressImage(photoBack));

    try {
      const res = await fetch("/api/checkin", { method: "POST", body: fd });

      let json: { ok?: boolean; error?: string; missing?: string[] };
      try {
        json = await res.json();
      } catch {
        setErrorMsg(
          res.ok ? "Unexpected response from server" : `Server error (${res.status})`
        );
        setSubmitState("error");
        return;
      }

      if (!res.ok) {
        setErrorMsg(json.error ?? "Submission failed");
        if (Array.isArray(json.missing)) setMissingFields(json.missing);
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      form.reset();
      setClientName("");
      setWeekOf(todayISO());
      setPhotoFront(null);
      setPhotoBack(null);
      setSessions("");
      setSoloSession("");
      setDifficulty("");
      setPushPref("");
      setNutritionRating("");
      setNutritionNotes("");
      setSleepHours("");
      setRecovery("");
      setEnergyMood("");
      setWeeklyNotes("");
    } catch {
      setErrorMsg("Network error — please try again.");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <div className="rounded-xl border border-terracotta/20 bg-blush/50 px-8 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-terracotta"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-light text-text">Check-In Sent</h2>
        <p className="mx-auto mt-3 max-w-md font-sans text-sm font-light leading-relaxed text-text-muted">
          Thank you — Keyla received your weekly check-in. Honest answers help
          her coach you better.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="mt-8 font-sans text-sm font-medium text-terracotta transition-colors hover:text-burgundy"
        >
          Submit another check-in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section num="01" title="The Basics">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="client_name" className={labelClasses}>
              Your name <span className="text-burgundy">*</span>
            </label>
            <input
              id="client_name"
              name="client_name"
              type="text"
              required
              placeholder="First & last name"
              className={inputClasses}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="week_of" className={labelClasses}>
              Week of <span className="text-burgundy">*</span>
            </label>
            <input
              id="week_of"
              name="week_of"
              type="date"
              required
              className={inputClasses}
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section
        num="02"
        title="Progress Photos"
        note="Same lighting, outfit, and spot each week. Optional but very helpful."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <PhotoUpload
            id="photo_front"
            label="Front photo"
            file={photoFront}
            onChange={setPhotoFront}
          />
          <PhotoUpload
            id="photo_back"
            label="Back photo"
            file={photoBack}
            onChange={setPhotoBack}
          />
        </div>
      </Section>

      <Section num="03" title="Training">
        <div>
          <p className={labelClasses}>
            Sessions with Keyla this week <span className="text-burgundy">*</span>
          </p>
          <RadioGroup
            name="sessions_with_keyla"
            required
            value={sessions}
            onChange={setSessions}
            options={[
              { value: "0", label: "0" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4+", label: "4+" },
            ]}
          />
        </div>

        <div>
          <p className={labelClasses}>Your solo session</p>
          <RadioGroup
            name="solo_session"
            value={soloSession}
            onChange={setSoloSession}
            options={[
              { value: "completed", label: "Completed" },
              { value: "partial", label: "Partial" },
              { value: "skipped", label: "Skipped" },
            ]}
          />
        </div>

        <div>
          <p className={labelClasses}>
            How challenging were the sessions? <span className="text-burgundy">*</span>
          </p>
          <RadioGroup
            name="session_difficulty"
            required
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "too_easy", label: "Too easy (coasted)" },
              { value: "just_right", label: "Just right (worked hard)" },
              { value: "too_hard", label: "Too hard (couldn't keep up)" },
            ]}
          />
        </div>

        <div>
          <p className={labelClasses}>
            For next week, how do you want it? <span className="text-burgundy">*</span>
          </p>
          <RadioGroup
            name="push_preference"
            required
            value={pushPref}
            onChange={setPushPref}
            colorMap={{
              push_more: "border-burgundy/40 bg-burgundy/10 text-burgundy",
              keep_same: "border-olive/40 bg-olive/10 text-olive",
              ease_off: "border-terracotta/40 bg-terracotta/10 text-terracotta",
            }}
            options={[
              { value: "push_more", label: "Push me harder" },
              { value: "keep_same", label: "Keep it here" },
              { value: "ease_off", label: "Ease off a bit" },
            ]}
          />
        </div>
      </Section>

      <Section num="04" title="Fuel & Recovery">
        <div>
          <p className={labelClasses}>
            How dialed was your nutrition? <span className="text-burgundy">*</span>
          </p>
          <ScaleInput
            name="nutrition_rating"
            required
            value={nutritionRating}
            onChange={setNutritionRating}
            lowLabel="Off track"
            highLabel="On point"
          />
        </div>

        <div>
          <label htmlFor="nutrition_notes" className={labelClasses}>
            Food / cravings / meals notes
          </label>
          <textarea
            id="nutrition_notes"
            name="nutrition_notes"
            rows={3}
            placeholder="Anything Keyla should know about your eating this week…"
            className={`${inputClasses} resize-none`}
            value={nutritionNotes}
            onChange={(e) => setNutritionNotes(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="sleep_hours" className={labelClasses}>
            Avg sleep (hrs/night)
          </label>
          <input
            id="sleep_hours"
            name="sleep_hours"
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="e.g. 7.5"
            className={inputClasses}
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
          />
        </div>

        <div>
          <p className={labelClasses}>
            Recovery feel <span className="text-burgundy">*</span>
          </p>
          <RadioGroup
            name="recovery"
            required
            value={recovery}
            onChange={setRecovery}
            options={[
              { value: "fresh", label: "Fresh & recovered" },
              { value: "okay", label: "Okay" },
              { value: "sore", label: "Sore / run down" },
              { value: "exhausted", label: "Exhausted" },
            ]}
          />
        </div>

        <div>
          <p className={labelClasses}>
            Energy & mood this week <span className="text-burgundy">*</span>
          </p>
          <ScaleInput
            name="energy_mood"
            required
            value={energyMood}
            onChange={setEnergyMood}
            lowLabel="Drained"
            highLabel="Energized"
          />
        </div>
      </Section>

      <Section num="05" title="Wins & Struggles">
        <div>
          <label htmlFor="weekly_notes" className={labelClasses}>
            Tell me about your week
          </label>
          <textarea
            id="weekly_notes"
            name="weekly_notes"
            rows={5}
            placeholder="What went well? What got in the way? Be honest — it helps me coach you better."
            className={`${inputClasses} resize-none`}
            value={weeklyNotes}
            onChange={(e) => setWeeklyNotes(e.target.value)}
          />
        </div>
      </Section>

      {submitState === "error" && (
        <div className="rounded-lg border border-burgundy/30 bg-burgundy/5 px-5 py-4">
          <p className="font-sans text-sm text-burgundy">{errorMsg}</p>
          {missingFields.length > 0 && (
            <p className="mt-2 font-sans text-xs text-text-muted">
              Missing: {missingFields.join(", ")}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitState === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg transition-all duration-250 hover:bg-terracotta disabled:opacity-60 md:w-auto"
      >
        {submitState === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            Submitting…
          </>
        ) : (
          "Submit Check-In"
        )}
      </button>
    </form>
  );
}

export function CheckInHeader() {
  return (
    <header className="border-b border-border/40 bg-bg-alt py-6">
      <Container className="flex items-center justify-between">
        <Link href="/" className="relative block h-10 w-28">
          <Image
            src="/final keyla logo.png"
            alt="Keyla Avila"
            fill
            className="object-contain"
            sizes="128px"
            priority
          />
        </Link>
        <Link
          href="/"
          className="font-sans text-[12px] font-medium uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-terracotta"
        >
          ← Back to site
        </Link>
      </Container>
    </header>
  );
}
