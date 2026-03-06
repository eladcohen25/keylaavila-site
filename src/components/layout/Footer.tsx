"use client";

import Image from "next/image";
import Container from "@/components/ui/Container";
import ScrollReveal from "@/components/ui/ScrollReveal";

const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Gallery", href: "#gallery" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#booking" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/keylanavila" },
  { label: "TikTok", href: "#" },
  { label: "YouTube", href: "#" },
];

export default function Footer() {
  return (
    <footer className="border-t border-terracotta/30 bg-text py-16 md:py-20">
      <Container>
        <ScrollReveal>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            <div>
              <a href="#" className="relative block h-12 w-32">
                <Image
                  src="/final keyla logo.png"
                  alt="Keyla Avila"
                  fill
                  className="object-contain brightness-0 invert"
                  sizes="128px"
                />
              </a>
              <p className="mt-4 max-w-xs font-sans text-sm font-light leading-relaxed text-border/70">
                Creator, certified personal trainer, and Pilates instructor.
                Elevating wellness through movement, education, and authentic
                connection.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                Navigate
              </h4>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-sans text-sm font-light text-border/50 transition-colors duration-200 hover:text-terracotta"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                Connect
              </h4>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-sm font-light text-border/50 transition-colors duration-200 hover:text-terracotta"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:keylaavila01@gmail.com"
                className="mt-6 inline-block font-sans text-sm font-light text-border/50 transition-colors duration-200 hover:text-terracotta"
              >
                keylaavila01@gmail.com
              </a>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/10 pt-8 md:flex-row">
            <p className="font-sans text-xs font-light text-border/30">
              © {new Date().getFullYear()} Keyla Avila. All rights reserved.
            </p>
            <p className="font-sans text-xs font-light text-border/20">
              Designed with intention
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </footer>
  );
}
