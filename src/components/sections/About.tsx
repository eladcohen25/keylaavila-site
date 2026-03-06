"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import { useIsMobile } from "@/lib/MobileProvider";

function AboutImageDesktop() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <div ref={sectionRef}>
      <ScrollReveal direction="left">
        <motion.div className="relative" style={{ y: imageY }}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[8px_8px_40px_rgba(100,60,40,0.12)]">
            <Image
              src="/images/lifestyle/main-photo.jpg"
              alt="Keyla Avila — editorial portrait"
              fill
              className="object-cover"
              sizes="40vw"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-xl bg-blush/50" />
        </motion.div>
      </ScrollReveal>
    </div>
  );
}

function AboutImageMobile() {
  return (
    <div className="relative">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[8px_8px_40px_rgba(100,60,40,0.12)]">
        <Image
          src="/images/lifestyle/main-photo.jpg"
          alt="Keyla Avila — editorial portrait"
          fill
          className="object-cover"
          sizes="90vw"
          quality={50}
        />
      </div>
      <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-xl bg-blush/50" />
    </div>
  );
}

export default function About() {
  const isMobile = useIsMobile();

  return (
    <section
      id="about"
      className="relative bg-bg-alt py-28 md:py-36 lg:py-44"
    >
      <Container className="relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-20">
          {/* Image Column */}
          <div className="lg:col-span-5">
            {isMobile !== false ? <AboutImageMobile /> : <AboutImageDesktop />}
          </div>

          {/* Text Column */}
          <div className="lg:col-span-7">
            <SectionHeading
              label="About Keyla"
              title="Where Science Meets Soul"
              align="left"
            />

            <div className="mt-10 space-y-6">
              <ScrollReveal delay={0.15}>
                <p className="border-l-[3px] border-terracotta pl-5 font-sans text-base font-light leading-[1.8] text-text/80">
                  I&apos;m Keyla — a certified personal trainer, Pilates
                  instructor, and content creator with a degree in kinesiology.
                  My approach to wellness lives at the intersection of science,
                  movement, and authentic self-expression.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.25}>
                <p className="font-sans text-base font-light leading-[1.8] text-text/80">
                  With a foundation in human movement science and years of
                  hands-on training experience, I bring an evidence-based yet
                  deeply personal approach to every session, every piece of
                  content, and every collaboration.
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.35}>
                <p className="font-sans text-base font-light leading-[1.8] text-text/80">
                  I believe in training that feels as good as it looks —
                  programs built on proper biomechanics, progressive overload,
                  and a genuine love for the process. Whether it&apos;s through
                  one-on-one training, Pilates instruction, or the content I
                  create, my goal is always the same: to help you move better,
                  feel stronger, and build something sustainable.
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={0.45}>
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border/40 pt-10">
                <div className="flex items-start gap-3">
                  <span className="mt-2 block h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
                  <div>
                    <span className="font-serif text-3xl font-light text-text">
                      B.S.
                    </span>
                    <p className="mt-1 font-sans text-sm font-light text-text-muted">
                      Kinesiology — understanding how the body moves, adapts,
                      and thrives.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-2 block h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
                  <div>
                    <span className="font-serif text-3xl font-light text-text">
                      Certified
                    </span>
                    <p className="mt-1 font-sans text-sm font-light text-text-muted">
                      Pilates instructor bringing mindful movement to every
                      practice.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.55}>
              <div className="mt-10">
                <Button href="#services" variant="text" arrowRight>
                  See how we can work together
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
