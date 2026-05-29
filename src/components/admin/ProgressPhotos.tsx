"use client";

import { useState } from "react";
import Image from "next/image";

interface CheckIn {
  id: string;
  week_of: string;
  photo_front_url: string | null;
  photo_back_url: string | null;
}

export default function ProgressPhotos({ checkins }: { checkins: CheckIn[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const withPhotos = checkins.filter(
    (c) => c.photo_front_url || c.photo_back_url
  );

  if (withPhotos.length === 0) {
    return (
      <div className="rounded-xl border border-text/5 bg-white p-12 text-center">
        <p className="font-sans text-text-muted">No progress photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withPhotos.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => setSelectedIdx(idx)}
            className="group overflow-hidden rounded-xl border border-text/5 bg-white transition hover:border-terracotta/30 hover:shadow-md"
          >
            <div className="flex">
              {c.photo_front_url && (
                <div className="relative aspect-[3/4] flex-1">
                  <Image
                    src={c.photo_front_url}
                    alt="Front"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                </div>
              )}
              {c.photo_back_url && (
                <div className="relative aspect-[3/4] flex-1">
                  <Image
                    src={c.photo_back_url}
                    alt="Back"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-sans text-xs font-medium text-text">
                Week of{" "}
                {new Date(c.week_of).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedIdx !== null && (
        <PhotoLightbox
          checkins={withPhotos}
          currentIdx={selectedIdx}
          onClose={() => setSelectedIdx(null)}
          onNav={(idx) => setSelectedIdx(idx)}
        />
      )}
    </>
  );
}

function PhotoLightbox({
  checkins,
  currentIdx,
  onClose,
  onNav,
}: {
  checkins: CheckIn[];
  currentIdx: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}) {
  const c = checkins[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex max-h-[80vh] max-w-4xl items-center gap-4">
        <button
          onClick={() => onNav(Math.max(0, currentIdx - 1))}
          disabled={currentIdx === 0}
          className="shrink-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex gap-4 overflow-hidden rounded-xl">
          {c.photo_front_url && (
            <div className="relative aspect-[3/4] w-[40vw] max-w-[300px]">
              <Image
                src={c.photo_front_url}
                alt="Front"
                fill
                className="rounded-lg object-cover"
                sizes="40vw"
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                Front
              </span>
            </div>
          )}
          {c.photo_back_url && (
            <div className="relative aspect-[3/4] w-[40vw] max-w-[300px]">
              <Image
                src={c.photo_back_url}
                alt="Back"
                fill
                className="rounded-lg object-cover"
                sizes="40vw"
              />
              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                Back
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onNav(Math.min(checkins.length - 1, currentIdx + 1))}
          disabled={currentIdx === checkins.length - 1}
          className="shrink-0 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <p className="rounded-full bg-black/60 px-4 py-1.5 font-sans text-xs text-white">
          Week of{" "}
          {new Date(c.week_of).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · {currentIdx + 1} / {checkins.length}
        </p>
      </div>
    </div>
  );
}
