"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useIsMobile } from "@/lib/MobileProvider";

const faqs = [
  { question: "What does a typical personal training session look like?", answer: "Every session is tailored to your goals and current fitness level. We begin with a dynamic warm-up, move into the main training block (strength, hypertrophy, or functional training), and finish with cooldown and mobility work. All programming is based on proper biomechanics and progressive overload principles." },
  { question: "Do I need Pilates experience to start?", answer: "Not at all. My Pilates sessions are designed to meet you where you are, whether you're a complete beginner or experienced practitioner. We'll start with foundational movement patterns and progress at a pace that feels right for your body." },
  { question: "Are sessions available in-person or virtually?", answer: "Both. I offer in-person sessions locally as well as virtual training and Pilates for clients anywhere. Virtual sessions are conducted live via video call with the same attention to form and detail as in-person work." },
  { question: "How does brand collaboration work?", answer: "I work with brands on a project basis — from single posts to long-term partnerships. Every collaboration begins with a conversation to ensure alignment on values, audience, and creative direction. I bring genuine expertise and a trusted audience to every partnership." },
  { question: "What makes your approach different?", answer: "My kinesiology degree gives me a deep understanding of human movement science that most trainers and instructors don't have. Every program I design is rooted in evidence — not trends. Combined with my Pilates certification and years of training experience, I offer a truly informed, holistic approach to fitness." },
  { question: "How often should I train?", answer: "This depends on your goals, schedule, and experience level. Most clients see great results with 3–4 sessions per week, but I'll design a program that fits your life realistically. Consistency matters more than frequency." },
  { question: "Do you offer nutrition guidance?", answer: "While I don't provide formal meal plans (I'm not a registered dietitian), I do share evidence-based nutritional guidance and habits as part of my holistic approach. For clients with specific dietary needs, I'm happy to refer trusted nutrition professionals." },
  { question: "What's your cancellation policy?", answer: "I ask for at least 24 hours' notice for cancellations or rescheduling. This allows me to offer the spot to another client and helps us both maintain a consistent training rhythm." },
];

/* Mobile: pure CSS transitions, zero framer-motion */
function FAQItemMobile({ question, answer, isOpen, onToggle }: {
  question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left transition-colors duration-200 hover:text-terracotta"
        aria-expanded={isOpen}
      >
        <span className="pr-8 font-serif text-lg font-light tracking-[-0.01em] text-text">
          {question}
        </span>
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center text-terracotta transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="pb-6 font-sans text-sm font-light leading-[1.8] text-text/70">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/* Desktop: framer-motion AnimatePresence for smooth height animation */
function FAQItemDesktop({ question, answer, isOpen, onToggle }: {
  question: string; answer: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left transition-colors duration-200 hover:text-terracotta"
        aria-expanded={isOpen}
      >
        <span className="pr-8 font-serif text-lg font-light tracking-[-0.01em] text-text md:text-xl">
          {question}
        </span>
        <motion.span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-terracotta"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 font-sans text-sm font-light leading-[1.8] text-text/70 md:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const isMobile = useIsMobile();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mobile = isMobile !== false;

  const FAQItem = mobile ? FAQItemMobile : FAQItemDesktop;

  return (
    <section id="faq" className="bg-bg py-24 md:py-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            label="FAQ"
            title="Common Questions"
            subtitle="Everything you need to know before we start working together."
          />
          <div className="mt-16">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <FAQItem
                  question={faq.question} answer={faq.answer}
                  isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
