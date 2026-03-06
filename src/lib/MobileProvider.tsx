"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const MobileContext = createContext<boolean | null>(null);

export function useIsMobile(): boolean | null {
  return useContext(MobileContext);
}

export default function MobileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <MobileContext.Provider value={isMobile}>{children}</MobileContext.Provider>
  );
}
