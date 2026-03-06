"use client";

import AnimatedText from "./AnimatedText";
import ScrollReveal from "./ScrollReveal";

interface SectionHeadingProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  light?: boolean;
  decorativeLine?: boolean;
}

export default function SectionHeading({
  label,
  title,
  subtitle,
  align = "center",
  className = "",
  light = false,
  decorativeLine = false,
}: SectionHeadingProps) {
  const alignClasses = align === "center" ? "text-center mx-auto" : "text-left";
  const textColor = light ? "text-bg" : "text-text";
  const subtitleColor = light ? "text-border" : "text-text-muted";

  return (
    <div className={`max-w-2xl ${alignClasses} ${className}`}>
      {label && (
        <ScrollReveal>
          <span className="mb-4 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
            {label}
          </span>
        </ScrollReveal>
      )}
      <AnimatedText
        text={title}
        as="h2"
        className={`font-serif text-3xl font-light leading-tight tracking-[-0.01em] md:text-4xl lg:text-5xl ${textColor}`}
      />
      {decorativeLine && (
        <ScrollReveal delay={0.2}>
          <div
            className={`mt-3 h-px w-12 bg-terracotta ${align === "center" ? "mx-auto" : ""}`}
          />
        </ScrollReveal>
      )}
      {subtitle && (
        <ScrollReveal delay={0.3}>
          <p
            className={`mt-5 font-sans text-base font-light leading-relaxed ${subtitleColor}`}
          >
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
