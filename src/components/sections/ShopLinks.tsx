"use client";

import { useState } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";

const links = [
  {
    title: "Reebok Smart Ring",
    description: "20% off with code: Keyla 20",
    href: "https://www.reeboksmartring.com/products/reebok-smart-ring?variant=52098329313613",
    logo: "/Logo Scroll/Reebok_2019_logo.svg.png",
    code: "Keyla 20",
    discount: "20% Off",
  },
  {
    title: "The One Percent",
    description: "Resilience is Ritual. Premium athletic apparel.",
    href: "https://onepercentclo.com/password",
    logo: "/Logo Scroll/New Logo.png",
    code: null,
    discount: null,
  },
  {
    title: "Shop TLF",
    description: "Premium gym-to-street apparel.",
    href: "https://tlfapparel.com/?dt_id=2301538&utm_source=social&utm_medium=Collab&utm_campaign=BA15AVILA&utm_link=BA15AVILA",
    logo: null,
    logoText: "TLF",
    code: "BA15AVILA",
    discount: "25% Off",
  },
  {
    title: "Amazon Storefront",
    description: "Shop all of Keyla's favorite products.",
    href: "https://www.amazon.com/shop/keylanavila?ccs_id=a8c6eecd-1b23-4a03-a74f-3fae2772dd9e",
    logo: null,
    logoText: "amazon",
    code: null,
    discount: null,
  },
];

function CopyChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-terracotta/8 px-3 py-1 font-mono text-[11px] font-medium text-terracotta transition-colors duration-200 hover:bg-terracotta/15"
    >
      <span>{code}</span>
      <span className="text-terracotta/40">·</span>
      {copied ? (
        <span className="text-olive">Copied!</span>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function ShopLinks() {
  return (
    <section className="bg-bg-alt py-24 md:py-28">
      <Container>
        <SectionHeading
          label="Shop & Save"
          title="Keyla's Picks"
          subtitle="Exclusive discount codes and curated recommendations from brands I use and trust."
        />

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 md:grid-cols-2">
          {links.map((link, i) => (
            <ScrollReveal key={link.title} delay={i * 0.08}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-5 rounded-xl border border-terracotta/15 bg-bg px-6 py-5 transition-all duration-300 hover:border-terracotta/40 hover:shadow-[0_8px_32px_rgba(100,60,40,0.08)]"
              >
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-alt">
                  {link.logo ? (
                    <Image
                      src={link.logo}
                      alt={link.title}
                      width={40}
                      height={40}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-text">
                      {link.logoText}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-medium text-text transition-colors duration-200 group-hover:text-terracotta">
                    {link.title}
                  </span>
                  <span className="block font-sans text-sm font-light text-text-muted">
                    {link.description}
                  </span>
                  {link.code && (
                    <CopyChip code={link.code} />
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 text-text-muted/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-terracotta"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
