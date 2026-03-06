"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { useIsMobile } from "@/lib/MobileProvider";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  arrowRight?: boolean;
}

const variants = {
  primary: "bg-text text-bg hover:bg-burgundy",
  secondary: "bg-transparent border-[1.5px] border-current text-text hover:bg-blush hover:text-burgundy",
  text: "bg-transparent text-terracotta animated-underline px-0 py-0",
};

export default function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  type = "button",
  arrowRight = false,
}: ButtonProps) {
  const isMobile = useIsMobile();
  const mobile = isMobile !== false;

  const baseClasses =
    variant === "text"
      ? "inline-flex items-center gap-2 font-sans text-sm font-medium tracking-wider transition-all duration-300"
      : "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] transition-all duration-250";

  const combinedClasses = `group ${baseClasses} ${variants[variant]} ${className}`;

  const content = (
    <>
      {children}
      {arrowRight && (
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      )}
    </>
  );

  // Mobile: plain HTML elements, zero framer-motion
  if (mobile) {
    if (href) {
      return <a href={href} className={combinedClasses}>{content}</a>;
    }
    return <button type={type} onClick={onClick} className={combinedClasses}>{content}</button>;
  }

  // Desktop: framer-motion hover/tap effects
  if (href) {
    return (
      <motion.a
        href={href}
        className={combinedClasses}
        whileHover={{ scale: variant === "text" ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={combinedClasses}
      whileHover={{ scale: variant === "text" ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.button>
  );
}
