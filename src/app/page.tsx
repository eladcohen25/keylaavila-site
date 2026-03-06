"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const MobilePage = dynamic(() => import("@/components/MobilePage"), { ssr: false });

const DesktopPage = dynamic(() => import("@/components/DesktopPage"), { ssr: false });

export default function Home() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile === null) return null;

  return isMobile ? <MobilePage /> : <DesktopPage />;
}
