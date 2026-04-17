"use client";

import { useEffect, useState } from "react";

/** April 19, 2026, 5:00 PM Pacific (PDT) → April 20, 2026 00:00:00.000 UTC */
const EVENT_END_MS = Date.UTC(2026, 3, 20, 0, 0, 0);
const LUMA_HREF = "https://luma.com/event/evt-tYo72TZfVKm9Zjv";
const LUMA_EVENT_ID = "evt-tYo72TZfVKm9Zjv";

const POST_EVENT_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatRemaining(ms: number) {
  if (ms <= 0) return null;
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return { d, h, m, s };
}

export default function EventCountdownBanner() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = mounted ? EVENT_END_MS - now : null;
  const remaining = diff !== null && diff > 0 ? formatRemaining(diff) : null;
  const postEvent = diff !== null && diff <= 0;
  const longPast = diff !== null && diff <= -POST_EVENT_GRACE_MS;

  return (
    <a
      href={LUMA_HREF}
      data-luma-action="checkout"
      data-luma-event-id={LUMA_EVENT_ID}
      className="fixed left-0 right-0 top-0 z-[60] flex min-h-[var(--event-banner-height)] cursor-pointer items-center border-b border-border/50 bg-bg-alt/95 text-text shadow-[0_1px_0_0_rgba(100,60,40,0.06)] backdrop-blur-[6px] transition-colors duration-200 hover:bg-bg-alt"
      aria-label="Join BIEBERCHELLA — get tickets"
    >
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-2 px-3 py-2.5 sm:px-5 md:flex-row md:items-center md:justify-between md:gap-6 md:py-0">
        <div className="flex items-center justify-between gap-3 md:contents">
          <p className="font-sans text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-text-muted md:flex-shrink md:tracking-[0.16em]">
            <span className="text-text">JOIN BIEBERCHELLA</span>
            <span className="mx-1.5 hidden font-normal text-border sm:inline">·</span>
            <span className="mt-0.5 block font-normal normal-case tracking-normal text-text-muted sm:mt-0 sm:inline">
              Apr 19 · 5:00 PM PT
            </span>
          </p>
          <span className="shrink-0 rounded-full bg-text px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-bg md:hidden">
            Get tickets
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center md:justify-center">
          {!mounted ? (
            <span className="font-sans text-[12px] tabular-nums tracking-wide text-text-muted/40 md:text-[13px]">
              —d —h —m —s
            </span>
          ) : longPast ? (
            <span className="font-sans text-[12px] font-medium tabular-nums text-text-muted md:text-[13px]">
              Event ended — thank you for joining
            </span>
          ) : postEvent ? (
            <span className="font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-terracotta md:text-[13px]">
              Happening now
            </span>
          ) : remaining ? (
            <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 font-sans text-[12px] tabular-nums text-text md:text-[13px]">
              <span>
                <strong className="font-semibold text-text">{remaining.d}</strong>
                <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">d</span>
              </span>
              <span className="text-border">·</span>
              <span>
                <strong className="font-semibold text-text">{pad2(remaining.h)}</strong>
                <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">h</span>
              </span>
              <span className="text-border">·</span>
              <span>
                <strong className="font-semibold text-text">{pad2(remaining.m)}</strong>
                <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">m</span>
              </span>
              <span className="text-border">·</span>
              <span>
                <strong className="font-semibold text-text">{pad2(remaining.s)}</strong>
                <span className="ml-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-text-muted">s</span>
              </span>
            </div>
          ) : null}
        </div>

        <span className="hidden shrink-0 rounded-full bg-text px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.08em] text-bg md:inline-flex md:items-center md:justify-center">
          Get tickets
        </span>
      </div>
    </a>
  );
}
