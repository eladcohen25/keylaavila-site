"use client";

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

const gradientColors: Record<string, string> = {
  "UGC VIDEO": "from-[#C4714A] to-[#a85d3b]",
  "BRAND COLLAB": "from-[#6B7355] to-[#565e44]",
  "WEDDING": "from-[#7D3A3A] to-[#632e2e]",
  "EVENT": "from-[#7D3A3A] to-[#632e2e]",
  "MODELING": "from-[#1C1917] to-[#2d2a27]",
  "TRAVEL": "from-[#6B7355] to-[#565e44]",
  "TIKTOK": "from-[#1C1917] to-[#2d2a27]",
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

export default function UGCPortfolio() {
  const desktopCards = [...cards, ...cards];
  const mobileCards = cards.slice(0, 6);

  return (
    <section id="ugc" className="bg-bg pt-24 pb-12 md:pt-28 md:pb-14">
      <Container>
        <SectionHeading
          label="UGC & Content"
          title="Content That Converts"
          subtitle="Real content for real audiences — built on expertise, not just aesthetics."
        />
      </Container>

      {/*
        MOBILE: plain CSS grid of text cards. No images, no JS animation,
        no framer-motion, no dynamic state. Pure HTML/CSS via Tailwind.
        Hidden on md+ screens.
      */}
      <div className="mt-10 px-5 md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {mobileCards.map((card, i) => (
            <a
              key={i}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex h-[140px] flex-col justify-end rounded-xl bg-gradient-to-br ${gradientColors[card.type] || "from-[#C4714A] to-[#a85d3b]"} p-4`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white/70">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
                <span className="font-sans text-[8px] font-medium uppercase tracking-[0.1em] text-white/60">
                  {card.type}
                </span>
              </div>
              <p className="mt-1.5 font-sans text-[13px] font-medium leading-snug text-white/95">
                {card.brand}
              </p>
            </a>
          ))}
        </div>
        <p className="mt-6 text-center font-sans text-sm font-light text-text-muted">
          More content available —{" "}
          <a href="#booking" className="font-medium text-terracotta">
            Get in Touch →
          </a>
        </p>
      </div>

      {/*
        DESKTOP: full image marquee carousel with hover effects.
        Hidden on mobile screens.
      */}
      <div className="hidden md:block">
        <ScrollReveal delay={0.15}>
          <div
            className="relative mt-16 overflow-x-clip overflow-y-visible"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            }}
          >
            <div
              className="group flex w-max items-center gap-5 py-8 pl-5 hover:[animation-play-state:paused]"
              style={{ animation: "marquee 80s linear infinite" }}
            >
              {desktopCards.map((card, i) => {
                const pillColor = categoryColors[card.type] || "bg-terracotta";
                return (
                  <a
                    key={i}
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/card relative h-[380px] w-[280px] flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-text/5 transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.08] hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
                  >
                    <Image
                      src={card.thumbnail}
                      alt={card.brand}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
                      sizes="280px"
                      quality={75}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/30 text-white/80 transition-all duration-300 group-hover/card:bg-black/50 group-hover/card:text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-20">
                      <span className={`mb-2 inline-block rounded-full ${pillColor} px-3 py-1 font-sans text-[9px] font-medium uppercase tracking-[0.12em] text-bg`}>
                        {card.type}
                      </span>
                      <p className="font-sans text-sm font-medium text-white/90">{card.brand}</p>
                    </div>
                  </a>
                );
              })}
            </div>
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
      </div>
    </section>
  );
}
