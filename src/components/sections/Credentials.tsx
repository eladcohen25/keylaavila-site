"use client";

import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";

const credentials = [
  {
    icon: "🎓",
    title: "Kinesiology Degree",
    description:
      "A Bachelor of Science in Kinesiology provides the foundation for everything I do — from understanding biomechanics and muscle physiology to designing programs that are both safe and effective.",
  },
  {
    icon: "✦",
    title: "Certified Pilates Instructor",
    description:
      "Comprehensive Pilates certification with training in mat and reformer work, allowing me to guide clients through mindful, controlled movement with precision and care.",
  },
  {
    icon: "◈",
    title: "Personal Training Certification",
    description:
      "Nationally recognized personal training certification backed by ongoing education in strength training, corrective exercise, and program design.",
  },
  {
    icon: "○",
    title: "Evidence-Based Approach",
    description:
      "Every program, recommendation, and piece of content is rooted in exercise science — not trends. My educational background ensures my methods are grounded in research.",
  },
];

const philosophy = [
  { number: "01", principle: "Science First", detail: "Programming rooted in biomechanics and exercise physiology." },
  { number: "02", principle: "Holistic Wellness", detail: "Training that honors the whole person — body, mind, and lifestyle." },
  { number: "03", principle: "Sustainable Progress", detail: "Building habits and strength that last, not quick fixes." },
  { number: "04", principle: "Intentional Movement", detail: "Quality over quantity. Every rep, every breath, every session — with purpose." },
];

export default function Credentials() {
  return (
    <section id="credentials" className="relative overflow-hidden bg-bg-alt py-24 pb-[100px] md:py-28 md:pb-[100px]">
      {/* Background training video */}
      <div className="absolute right-0 top-0 hidden h-full w-2/5 overflow-hidden opacity-[0.18] lg:block">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover object-center"
          aria-hidden="true"
        >
          <source src="/videos/training-clip.mp4" type="video/mp4" />
        </video>
      </div>

      <Container className="relative z-10">
        <SectionHeading
          label="Expertise"
          title="Built on Education, Driven by Passion"
          subtitle="A strong foundation in human movement science sets the standard for every session, every program, and every piece of content."
        />

        {/* Credentials Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-2">
          {credentials.map((cred, i) => (
            <ScrollReveal key={cred.title} delay={i * 0.08}>
              <div className="rounded-[10px] border border-terracotta/15 bg-bg/80 p-6 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-terracotta hover:shadow-[0_12px_36px_rgba(100,60,40,0.1)]">
                <span className="text-2xl">{cred.icon}</span>
                <h3 className="mt-4 font-serif text-xl font-medium tracking-[-0.01em] text-text md:text-2xl">
                  {cred.title}
                </h3>
                <p className="mt-3 font-sans text-sm font-light leading-[1.8] text-text/70">
                  {cred.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Philosophy */}
        <div className="mt-24">
          <ScrollReveal>
            <h3 className="text-center font-serif text-2xl font-light tracking-[-0.01em] text-text md:text-3xl">
              Training Philosophy
            </h3>
          </ScrollReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {philosophy.map((item, i) => (
              <ScrollReveal key={item.number} delay={i * 0.08}>
                <div className="border-t border-terracotta/20 pt-6 text-center">
                  <span className="font-sans text-[13px] font-medium uppercase tracking-[0.1em] text-terracotta">
                    {item.number}
                  </span>
                  <h4 className="mt-2 font-serif text-lg font-medium text-text">
                    {item.principle}
                  </h4>
                  <p className="mt-2 font-sans text-sm font-light leading-relaxed text-text-muted">
                    {item.detail}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
