"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useIsMobile } from "@/lib/MobileProvider";

const testimonials = [
  {
    quote: "Training with Keyla has completely changed how I think about fitness. Her knowledge of the body is unmatched — she doesn't just tell you what to do, she explains why. I've never felt stronger or more confident.",
    name: "Sarah M.",
    context: "Personal Training Client",
  },
  {
    quote: "Keyla's Pilates sessions are a perfect blend of challenging and restorative. She has this incredible ability to make you feel taken care of while pushing you to your edge. My posture and core strength have transformed.",
    name: "Jessica L.",
    context: "Pilates Student",
  },
  {
    quote: "As a brand, working with Keyla was a dream. She brought genuine expertise and authenticity to our campaign — something rare in the creator space. Her content performed beautifully and her audience trusted every word.",
    name: "Brand Partner",
    context: "Wellness Brand Collaboration",
  },
  {
    quote: "I came to Keyla with years of gym intimidation and no idea where to start. She met me exactly where I was and built me a program that actually made sense for my body. I look forward to every single session.",
    name: "Amanda R.",
    context: "Personal Training Client",
  },
];

function TestimonialsMobile() {
  const [active, setActive] = useState(0);

  return (
    <div className="relative mx-auto mt-20 max-w-3xl text-center">
      <span className="mb-8 block font-serif text-6xl text-terracotta/30">
        &ldquo;
      </span>

      <div className="relative min-h-[180px]">
        <blockquote className="font-serif text-xl font-light leading-[1.6] text-text transition-opacity duration-400">
          {testimonials[active].quote}
        </blockquote>
      </div>

      <div className="mt-8 transition-opacity duration-300">
        <span className="font-sans text-sm font-medium text-text">
          {testimonials[active].name}
        </span>
        <span className="mx-2 text-border">·</span>
        <span className="font-sans text-sm font-light text-text-muted">
          {testimonials[active].context}
        </span>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`View testimonial ${i + 1}`}
            className="group relative flex h-8 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === active
                  ? "h-2 w-6 bg-terracotta"
                  : "h-2 w-2 bg-blush group-hover:bg-terracotta/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function TestimonialsDesktop() {
  const [active, setActive] = useState(0);

  return (
    <div className="relative mx-auto mt-20 max-w-3xl">
      <ScrollReveal>
        <div className="text-center">
          <span className="mb-8 block font-serif text-6xl text-terracotta/30">
            &ldquo;
          </span>

          <div className="relative min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={active}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-2xl font-light leading-[1.6] text-text"
              >
                {testimonials[active].quote}
              </motion.blockquote>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <span className="font-sans text-sm font-medium text-text">
                {testimonials[active].name}
              </span>
              <span className="mx-2 text-border">·</span>
              <span className="font-sans text-sm font-light text-text-muted">
                {testimonials[active].context}
              </span>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-3">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`View testimonial ${i + 1}`}
                className="group relative flex h-8 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === active
                      ? "h-2 w-6 bg-terracotta"
                      : "h-2 w-2 bg-blush group-hover:bg-terracotta/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default function Testimonials() {
  const isMobile = useIsMobile();

  return (
    <section id="testimonials" className="bg-bg py-24 md:py-28">
      <Container>
        <SectionHeading
          label="Kind Words"
          title="Trusted by Clients & Brands"
          subtitle="Real experiences from the women and brands I've had the privilege to work with."
        />

        {isMobile !== false ? <TestimonialsMobile /> : <TestimonialsDesktop />}
      </Container>
    </section>
  );
}
