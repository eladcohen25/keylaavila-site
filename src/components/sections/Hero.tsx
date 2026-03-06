"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      {/* Full-bleed background image */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease }}
      >
        <Image
          src="/images/hero/keyla-main.jpg"
          alt="Keyla Avila — Creator, trainer, and Pilates instructor"
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
          quality={90}
        />
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </motion.div>

      {/* Content */}
      <Container className="relative z-10 flex h-full flex-col justify-end pb-16 pt-32 md:justify-center md:pb-20">
        <div className="max-w-2xl">
          <motion.span
            className="mb-5 inline-block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/70"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease }}
          >
            Creator · Trainer · Pilates Instructor
          </motion.span>

          <motion.h1
            className="font-serif text-[2.8rem] font-light leading-[1.05] tracking-tight text-white md:text-[4rem] lg:text-[5rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease }}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease }}
            >
              Movement,
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease }}
            >
              Wellness &
            </motion.span>
            <motion.span
              className="block text-[3.2rem] italic text-terracotta md:text-[4.5rem] lg:text-[5.6rem]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease }}
            >
              Intention
            </motion.span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-lg font-sans text-base font-light leading-relaxed text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease }}
          >
            Certified personal trainer and Pilates instructor with a
            kinesiology degree — creating content that moves, educates, and
            inspires.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease }}
          >
            <Button href="#booking">Book Training</Button>
            <a
              href="#ugc"
              className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/40 px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-white transition-all duration-250 hover:border-white hover:bg-white/10"
            >
              For Brands
            </a>
          </motion.div>

          {/* Credential stat cards */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4, ease }}
          >
            {[
              { top: "B.S.", bottom: "Kinesiology" },
              { top: "Certified", bottom: "Pilates Instructor" },
              { top: "100K+", bottom: "Community" },
            ].map((stat) => (
              <div
                key={stat.bottom}
                className="flex flex-col rounded-md border border-white/15 bg-white/5 px-5 py-3 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10"
              >
                <span className="font-serif text-lg font-medium text-white md:text-xl">
                  {stat.top}
                </span>
                <span className="font-sans text-[10px] font-medium uppercase tracking-[0.1em] text-white/50 md:text-[11px]">
                  {stat.bottom}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>

      {/* Scroll indicator — bottom center */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.8, ease }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            Scroll
          </span>
          <div className="h-8 w-px bg-terracotta" />
        </motion.div>
      </motion.div>
    </section>
  );
}
