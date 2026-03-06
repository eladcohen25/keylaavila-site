"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { useIsMobile } from "@/lib/MobileProvider";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Results", href: "#testimonials" },
  { label: "Content", href: "#content" },
  { label: "Gallery", href: "#gallery" },
  { label: "FAQ", href: "#faq" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/keylanavila",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@keylanavilaa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.38a8.16 8.16 0 0 0 4.76 1.53v-3.4a4.85 4.85 0 0 1-.87-.82z" />
      </svg>
    ),
  },
];

/* Mobile Navbar: zero framer-motion, CSS transitions only */
function NavbarMobile() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`mob-slide-down fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-bg shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <Container className="flex items-center justify-between py-4">
          <a href="#" className="relative block h-10 w-28">
            <Image
              src="/final keyla logo.png"
              alt="Keyla Avila"
              fill
              className="object-contain"
              sizes="128px"
              priority
            />
          </a>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[1.5px] w-6 bg-text transition-all duration-300 ${mobileOpen ? "translate-y-[4.5px] rotate-45" : ""}`}
            />
            <span
              className={`block h-[1.5px] w-6 bg-text transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-[1.5px] w-6 bg-text transition-all duration-300 ${mobileOpen ? "-translate-y-[4.5px] -rotate-45" : ""}`}
            />
          </button>
        </Container>
      </header>

      {/* Mobile menu overlay — only mount when open to avoid persistent GPU layer */}
      {mobileOpen && (
      <div
        className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg"
      >
        <nav className="flex flex-col items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-serif text-3xl font-light text-text"
            >
              {link.label}
            </a>
          ))}

          <div className="flex items-center gap-5">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-text/70 transition-colors duration-200 hover:text-terracotta"
              >
                {social.icon}
              </a>
            ))}
          </div>

          <a
            href="#booking"
            onClick={() => setMobileOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg transition-colors hover:bg-terracotta"
          >
            Work With Me
          </a>
        </nav>
      </div>
      )}
    </>
  );
}

/* Desktop Navbar: full framer-motion animations */
function NavbarDesktop() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-bg/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Container className="flex items-center justify-between py-4 md:py-5">
          <a href="#" className="relative block h-10 w-28 md:h-12 md:w-32">
            <Image
              src="/final keyla logo.png"
              alt="Keyla Avila"
              fill
              className="object-contain"
              sizes="128px"
              priority
            />
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="animated-underline font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-text/60 transition-colors duration-200 hover:text-text"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center lg:flex">
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-text/70 transition-colors duration-200 hover:text-terracotta"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <a
              href="#booking"
              className="ml-6 inline-flex items-center justify-center rounded-full bg-text px-6 py-3 font-sans text-[12px] font-medium uppercase tracking-[0.08em] text-bg transition-all duration-250 hover:bg-terracotta"
            >
              Work With Me
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label="Toggle menu"
          >
            <motion.span
              className="block h-[1.5px] w-6 bg-text"
              animate={mobileOpen ? { rotate: 45, y: 4.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block h-[1.5px] w-6 bg-text"
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block h-[1.5px] w-6 bg-text"
              animate={mobileOpen ? { rotate: -45, y: -4.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </Container>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-serif text-3xl font-light text-text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                className="flex items-center gap-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: navLinks.length * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="text-text/70 transition-colors duration-200 hover:text-terracotta"
                  >
                    {social.icon}
                  </a>
                ))}
              </motion.div>

              <motion.a
                href="#booking"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg transition-colors hover:bg-terracotta"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: (navLinks.length + 1) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                Work With Me
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Navbar() {
  const isMobile = useIsMobile();

  if (isMobile !== false) return <NavbarMobile />;
  return <NavbarDesktop />;
}
