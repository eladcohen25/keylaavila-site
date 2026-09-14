"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/portal/ui";

export interface PhotoCheckIn {
  id: string;
  created_at: string;
  week_of: string;
  photo_front_url: string | null;
  photo_back_url: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Grid of a client's progress photos (one card per check-in, newest first)
 * with a lightbox for flipping through weeks side by side.
 */
export default function ProgressPhotosPanel({
  checkins,
  photoUrls,
}: {
  checkins: PhotoCheckIn[];
  photoUrls: Map<string, string>;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const resolve = (v: string | null) => (v ? photoUrls.get(v) ?? null : null);
  const withPhotos = checkins.filter((c) => resolve(c.photo_front_url) || resolve(c.photo_back_url));

  if (withPhotos.length === 0) {
    return (
      <Card className="text-center">
        <p className="font-sans text-sm text-text-muted">
          No progress photos yet. Photos show up here automatically when this client
          attaches them to a weekly check-in.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-4 font-sans text-sm text-text-muted">
        {withPhotos.length} check-in{withPhotos.length === 1 ? "" : "s"} with photos · newest first ·
        click any card to compare weeks
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withPhotos.map((c, idx) => {
          const front = resolve(c.photo_front_url);
          const back = resolve(c.photo_back_url);
          return (
            <button
              key={c.id}
              onClick={() => setSelectedIdx(idx)}
              className="group overflow-hidden rounded-2xl border border-border bg-white text-left shadow-sm transition hover:border-terracotta/40 hover:shadow-md"
            >
              <div className="flex">
                {front && <Thumb url={front} label="Front" />}
                {back && <Thumb url={back} label="Back" />}
              </div>
              <div className="flex items-center justify-between p-3">
                <p className="font-sans text-xs font-medium text-text">
                  Week of {fmtDate(c.week_of)}
                </p>
                <p className="font-sans text-[10px] text-text-muted">
                  Submitted {fmtDate(c.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedIdx !== null && (
        <Lightbox
          checkins={withPhotos}
          resolve={resolve}
          currentIdx={selectedIdx}
          onClose={() => setSelectedIdx(null)}
          onNav={setSelectedIdx}
        />
      )}
    </>
  );
}

function Thumb({ url, label }: { url: string; label: string }) {
  return (
    <div className="relative aspect-[3/4] flex-1">
      <Image src={url} alt={label} fill unoptimized className="object-cover" sizes="(max-width: 640px) 50vw, 200px" />
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {label}
      </span>
    </div>
  );
}

function Lightbox({
  checkins,
  resolve,
  currentIdx,
  onClose,
  onNav,
}: {
  checkins: PhotoCheckIn[];
  resolve: (v: string | null) => string | null;
  currentIdx: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}) {
  const c = checkins[currentIdx];
  const front = resolve(c.photo_front_url);
  const back = resolve(c.photo_back_url);

  // Keyboard navigation: ← → to move between weeks, Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIdx > 0) onNav(currentIdx - 1);
      if (e.key === "ArrowRight" && currentIdx < checkins.length - 1) onNav(currentIdx + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, checkins.length, onClose, onNav]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex max-h-[85vh] max-w-4xl items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <NavButton dir="prev" disabled={currentIdx === 0} onClick={() => onNav(currentIdx - 1)} />

        <div className="flex gap-4 overflow-hidden rounded-xl">
          {front && <Full url={front} label="Front" />}
          {back && <Full url={back} label="Back" />}
        </div>

        <NavButton dir="next" disabled={currentIdx === checkins.length - 1} onClick={() => onNav(currentIdx + 1)} />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <p className="rounded-full bg-black/60 px-4 py-1.5 font-sans text-xs text-white">
          Week of {fmtDate(c.week_of)} · {currentIdx + 1} / {checkins.length}
        </p>
      </div>
    </div>
  );
}

function Full({ url, label }: { url: string; label: string }) {
  return (
    <div className="relative aspect-[3/4] w-[40vw] max-w-[320px]">
      <Image src={url} alt={label} fill unoptimized className="rounded-lg object-cover" sizes="40vw" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
        {label}
      </span>
    </div>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30"
      aria-label={dir === "prev" ? "Previous" : "Next"}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}
