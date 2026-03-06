"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useIsMobile } from "@/lib/MobileProvider";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  once?: boolean;
  threshold?: number;
}

function AnimatedReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 24,
  duration = 0.65,
  once = true,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const directionOffset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...directionOffset[direction] }
      }
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export default function ScrollReveal(props: ScrollRevealProps) {
  const isMobile = useIsMobile();

  // Mobile or initial SSR: render immediately — no observer, no animation
  if (isMobile !== false) {
    return <div className={props.className}>{props.children}</div>;
  }

  return <AnimatedReveal {...props} />;
}
