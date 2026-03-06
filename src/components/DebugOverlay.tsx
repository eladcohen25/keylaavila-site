"use client";

import { useEffect, useRef } from "react";

export default function DebugOverlay() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isMob = window.innerWidth < 768;
    console.log(
      "%c[KEYLA DEBUG] Initialized",
      "color: #C4714A; font-weight: bold"
    );
    console.log("[DEBUG] Screen:", window.innerWidth, "x", window.innerHeight);
    console.log("[DEBUG] PixelRatio:", window.devicePixelRatio);
    console.log("[DEBUG] Mobile:", isMob);
    console.log("[DEBUG] UA:", navigator.userAgent);

    function logPerf() {
      const nodes = document.querySelectorAll("*").length;
      const imgs = document.querySelectorAll("img").length;
      const loadedImgs = document.querySelectorAll("img[src]:not([src=''])").length;
      const videos = document.querySelectorAll("video").length;
      const motionEls = document.querySelectorAll("[style*=transform],[style*=opacity]").length;
      console.log(
        `[DEBUG] DOM=${nodes} img=${imgs}(loaded:${loadedImgs}) video=${videos} motionStyled=${motionEls}`
      );

      const perf = performance as unknown as {
        memory?: {
          usedJSHeapSize: number;
          jsHeapSizeLimit: number;
          totalJSHeapSize: number;
        };
      };
      if (perf.memory) {
        const mb = (b: number) => (b / 1048576).toFixed(1);
        console.log(
          `[DEBUG] JSHeap: ${mb(perf.memory.usedJSHeapSize)}MB used / ${mb(perf.memory.totalJSHeapSize)}MB total / ${mb(perf.memory.jsHeapSizeLimit)}MB limit`
        );
      }
    }

    logPerf();
    const perfInterval = setInterval(logPerf, 5000);

    // Track section visibility with a SINGLE shared observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id || "unnamed";
          if (entry.isIntersecting) {
            console.log(
              `%c[DEBUG] → SECTION ENTER: #${id}`,
              "color: #6B7355; font-weight: bold"
            );
          } else {
            console.log(`[DEBUG] ← section leave: #${id}`);
          }
        });
      },
      { threshold: 0.05 }
    );

    // Observe after a tick so sections are in DOM
    requestAnimationFrame(() => {
      document
        .querySelectorAll("section[id]")
        .forEach((el) => observer.observe(el));
      console.log(
        "[DEBUG] Watching",
        document.querySelectorAll("section[id]").length,
        "sections"
      );
    });

    // FPS monitor (logs when FPS drops below 30)
    let frames = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;
    function measureFps() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 2000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        if (fps < 30) {
          lowFpsCount++;
          console.warn(`[DEBUG] ⚠ LOW FPS: ${fps} (drop #${lowFpsCount})`);
        }
        frames = 0;
        lastTime = now;
      }
      fpsRaf = requestAnimationFrame(measureFps);
    }
    let fpsRaf = requestAnimationFrame(measureFps);

    // Global error / crash handler
    const onError = (e: ErrorEvent) => {
      console.error(
        "[DEBUG] UNCAUGHT ERROR:",
        e.message,
        "\n  at",
        e.filename,
        "line",
        e.lineno
      );
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error("[DEBUG] UNHANDLED PROMISE:", e.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // Track scroll position
    let scrollLogTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (scrollLogTimer) return;
      scrollLogTimer = setTimeout(() => {
        scrollLogTimer = null;
        const pct = Math.round(
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
            100
        );
        console.log(
          `[DEBUG] Scroll: ${window.scrollY}px (${pct}% of page)`
        );
      }, 1000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearInterval(perfInterval);
      cancelAnimationFrame(fpsRaf);
      observer.disconnect();
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
