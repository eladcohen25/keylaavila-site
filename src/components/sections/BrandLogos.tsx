"use client";

import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useIsMobile } from "@/lib/MobileProvider";

const stats = [
  { value: "15K+", label: "Followers" },
  { value: "500+", label: "Posts" },
  { value: "8%+", label: "Engagement" },
  { value: "50+", label: "Collaborations" },
];

const logos = [
  { src: "/Logo Scroll/Lululemon_Athletica_logo.svg.png", alt: "Lululemon" },
  { src: "/Logo Scroll/Reebok_2019_logo.svg.png", alt: "Reebok" },
  { src: "/Logo Scroll/F1-logo.png", alt: "Formula 1" },
  { src: "/Logo Scroll/CostaRica_Logo_RGB-scaled.webp", alt: "Visit Costa Rica" },
  { src: "/Logo Scroll/1740357294436.jpg", alt: "Etho Wellness Club" },
  { src: "/Logo Scroll/Kenetik-Logo-Black-Transparent.webp", alt: "Kennetik" },
  { src: "/Logo Scroll/New Logo.png", alt: "Brand Partner" },
  { src: "/Logo Scroll/noa logo.PNG", alt: "Noa" },
];

const marqueeLogos = [...logos, ...logos, ...logos, ...logos];

export default function BrandLogos() {
  const isMobile = useIsMobile();

  // Mobile: hidden entirely to prevent crash
  if (isMobile !== false) {
    return <section className="relative bg-bg-alt" />;
  }

  // Desktop: full section with scrolling marquee
  return (
    <section className="relative bg-bg-alt pt-16 pb-28">
      <Container className="relative z-10">
        <SectionHeading title="Trusted By" />

        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-x-12">
                <div className="text-center">
                  <span className="block font-serif text-[32px] font-light leading-none text-text">
                    {stat.value}
                  </span>
                  <span className="mt-1 block font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    {stat.label}
                  </span>
                </div>
                {i < stats.length - 1 && (
                  <span className="h-1 w-1 rounded-full bg-terracotta" />
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </Container>

      {/* Scrolling logo marquee */}
      <ScrollReveal delay={0.2}>
        <div
          className="relative mt-16 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div
            className="flex w-max items-center gap-16 hover:[animation-play-state:paused]"
            style={{ animation: "marquee 60s linear infinite" }}
          >
            {marqueeLogos.map((logo, i) => (
              <div
                key={`${logo.alt}-${i}`}
                className="flex flex-shrink-0 items-center justify-center opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={120}
                  height={44}
                  className="h-12 w-auto max-w-[140px] object-contain"
                  style={{ height: "auto", width: "auto", maxHeight: 48 }}
                  quality={50}
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <Container className="relative z-10">
        <ScrollReveal delay={0.3}>
          <p className="mt-10 text-center font-sans text-xs font-light text-text-muted/60">
            Logos shown with permission. More collaborations available upon request.
          </p>
        </ScrollReveal>
      </Container>
    </section>
  );
}
