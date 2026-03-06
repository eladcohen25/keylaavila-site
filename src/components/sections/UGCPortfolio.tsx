"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";

const categoryColors: Record<string, string> = {
  "UGC VIDEO": "bg-terracotta",
  "BRAND COLLAB": "bg-olive",
  "WEDDING": "bg-burgundy",
  "EVENT": "bg-burgundy",
  "MODELING": "bg-text",
  "TRAVEL": "bg-olive",
  "TIKTOK": "bg-text",
};

const cards = [
  { type: "UGC VIDEO", brand: "Hustle & Heart — Skincare", href: "https://www.instagram.com/reels/DRH_u2UjXdK/", thumbnail: "/images/ugc/hustle-skincare.jpg" },
  { type: "WEDDING", brand: "Wedding Content — Tory Cooper", href: "https://www.instagram.com/reels/DU2QzdBDEyG/", thumbnail: "/images/ugc/wedding-torycooper.jpg" },
  { type: "BRAND COLLAB", brand: "Reebok — Smart Ring", href: "https://www.instagram.com/reels/DVUY5XYDrq2/", thumbnail: "/images/ugc/reebok-smartring.jpg" },
  { type: "BRAND COLLAB", brand: "Etho Wellness Club", href: "https://www.tiktok.com/@keylanavilaa/video/7599898730539584798", thumbnail: "/images/ugc/etho-wellness.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DU4qTJyjNWl/", thumbnail: "/images/ugc/wedding-tory2.jpg" },
  { type: "MODELING", brand: "F1 — Las Vegas Campaign Shoot", href: "https://www.instagram.com/p/CxYnEVwvqA3/?img_index=2", thumbnail: "/images/ugc/f1-lasvegas.jpg" },
  { type: "BRAND COLLAB", brand: "Dry Bar — Beauty Salon", href: "https://www.tiktok.com/@keylanavilaa/video/7561932699489865015", thumbnail: "/images/ugc/drybar-salon.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DQZ1S6gknsi/", thumbnail: "/images/ugc/wedding-tory3.jpg" },
  { type: "BRAND COLLAB", brand: "Lululemon — Store Grand Opening", href: "https://www.instagram.com/reels/DORdqxCkm-8/", thumbnail: "/images/ugc/lululemon-opening.jpg" },
  { type: "TRAVEL", brand: "Visit Costa Rica", href: "https://www.tiktok.com/@keylanavilaa/video/7503013218017922350", thumbnail: "/images/ugc/costarica1.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DP_yMx5ke0u/", thumbnail: "/images/ugc/wedding-tory4.jpg" },
  { type: "BRAND COLLAB", brand: "Coffee & Chill x Etho Wellness", href: "https://www.tiktok.com/@keylanavilaa/video/7560572700029160717", thumbnail: "/images/ugc/coffee-etho.jpg" },
  { type: "UGC VIDEO", brand: "Hustle & Heart — Vegan Collagen Jelly", href: "https://www.instagram.com/reels/DRAN6JjDXYs/", thumbnail: "/images/ugc/hustle-collagen.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DQAMrKDEiMv/", thumbnail: "/images/ugc/wedding-tory5.jpg" },
  { type: "BRAND COLLAB", brand: "The Front Row — Fashion Events", href: "https://www.tiktok.com/@keylanavilaa/video/7558892233475280141", thumbnail: "/images/ugc/frontrow-fashion.jpg" },
  { type: "BRAND COLLAB", brand: "Kennetik — Beverage Company", href: "https://www.tiktok.com/@keylanavilaa/video/7540049268451626253", thumbnail: "/images/ugc/kennetik-beverage.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DP-dINBjtD0/", thumbnail: "/images/ugc/wedding-tory6.jpg" },
  { type: "BRAND COLLAB", brand: "TruFusion Collab", href: "https://www.tiktok.com/@keylanavilaa/video/7537072766026026295", thumbnail: "/images/ugc/trufusion.jpg" },
  { type: "EVENT", brand: "Luxury Event — Tory Cooper", href: "https://www.instagram.com/reels/DH2Asz0ysxV/", thumbnail: "/images/ugc/event-tory7.jpg" },
  { type: "BRAND COLLAB", brand: "Etho Wellness Club", href: "https://www.tiktok.com/@keylanavilaa/video/7526712408904109367", thumbnail: "/images/ugc/etho-wellness2.jpg" },
  { type: "TRAVEL", brand: "Visit Costa Rica", href: "https://www.tiktok.com/@keylanavilaa/video/7497739688090897710", thumbnail: "/images/ugc/costarica2.jpg" },
  { type: "BRAND COLLAB", brand: "One Percent Collab", href: "https://www.tiktok.com/@keylanavilaa/video/7525917584949136695", thumbnail: "/images/ugc/one-percent.jpg" },
  { type: "BRAND COLLAB", brand: "Jobee Swim", href: "https://www.tiktok.com/@keylanavilaa/video/7393854410738355502", thumbnail: "/images/ugc/jobee-swim.jpg" },
];

function Card({ card, compact }: { card: (typeof cards)[number]; compact: boolean }) {
  const pillColor = categoryColors[card.type] || "bg-terracotta";
  const sizeClasses = compact
    ? "h-[280px] w-[200px]"
    : "h-[380px] w-[280px]";

  return (
    <a
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative ${sizeClasses} flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-text/5 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.08] hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]`}
    >
      {compact ? (
        // Native img on mobile — no Next.js Image overhead, browser handles lazy loading
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.thumbnail}
          alt={card.brand}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={card.thumbnail}
          alt={card.brand}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="280px"
          quality={75}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white/80 transition-all duration-300 group-hover:bg-black/50 group-hover:text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-20">
        <span className={`mb-2 inline-block rounded-full ${pillColor} px-3 py-1 font-sans text-[9px] font-medium uppercase tracking-[0.12em] text-bg`}>
          {card.type}
        </span>
        <p className="font-sans text-sm font-medium text-white/90">
          {card.brand}
        </p>
      </div>
    </a>
  );
}

function DesktopCarousel() {
  const allCards = [...cards, ...cards];

  return (
    <div
      className="relative overflow-x-clip overflow-y-visible"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div
        className="group flex w-max items-center gap-5 py-8 pl-5 hover:[animation-play-state:paused]"
        style={{ animation: "marquee 80s linear infinite" }}
      >
        {allCards.map((card, i) => (
          <Card key={i} card={card} compact={false} />
        ))}
      </div>
    </div>
  );
}

function MobileCarousel() {
  const mobileCards = cards.slice(0, 8);

  return (
    <div className="scrollbar-hide -mx-1 overflow-x-auto px-5">
      <div className="flex w-max items-center gap-4 py-4">
        {mobileCards.map((card, i) => (
          <Card key={i} card={card} compact />
        ))}
      </div>
    </div>
  );
}

export default function UGCPortfolio() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    setMounted(true);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section id="ugc" className="bg-bg pt-24 pb-12 md:pt-28 md:pb-14">
      <Container>
        <SectionHeading
          label="UGC & Content"
          title="Content That Converts"
          subtitle="Real content for real audiences — built on expertise, not just aesthetics."
        />
      </Container>

      <ScrollReveal delay={0.15}>
        <div className="mt-16">
          {mounted ? (
            isMobile ? <MobileCarousel /> : <DesktopCarousel />
          ) : (
            // SSR placeholder — renders nothing costly
            <div className="h-[320px]" />
          )}
        </div>
      </ScrollReveal>

      <Container>
        <ScrollReveal delay={0.25}>
          <p className="mt-10 text-center font-sans text-sm font-light text-text-muted">
            More content available upon request —{" "}
            <a
              href="#booking"
              className="animated-underline font-medium text-terracotta transition-colors hover:text-burgundy"
            >
              Get in Touch →
            </a>
          </p>
        </ScrollReveal>
      </Container>
    </section>
  );
}
