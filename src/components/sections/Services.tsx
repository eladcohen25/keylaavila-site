"use client";

import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";

const services = [
  {
    number: "01",
    title: "Personal Training",
    description:
      "Science-backed, fully personalized 1-on-1 training programs designed around your body, your goals, and your life. Every session is intentional — rooted in proper biomechanics and progressive programming.",
    idealFor: "Women ready for structured, expert-led training that delivers real, lasting results.",
    outcomes: [
      "Custom programming based on your unique biomechanics",
      "Progressive overload with proper form guidance",
      "Sustainable strength, confidence, and physique changes",
    ],
    cta: { label: "Book a Session", href: "#booking" },
  },
  {
    number: "02",
    title: "Group Fitness & Events",
    description:
      "High-energy group fitness instruction available for corporate events, brand activations, studio takeovers, and private gatherings. Specializing in HIIT, strength circuits, and Pilates-based formats that leave every participant feeling challenged and energized.",
    idealFor: "Event planners, brands, studios, and organizations looking for a dynamic, expert-led fitness experience.",
    outcomes: [
      "HIIT · Strength Training · Pilates",
      "Custom event formats",
      "Corporate wellness programming",
    ],
    cta: { label: "Book for Your Event", href: "#booking" },
  },
  {
    number: "03",
    title: "Pilates Instruction",
    description:
      "Certified Pilates instruction that blends classical technique with a modern, functional approach. Sessions focus on deep core engagement, spinal mobility, and whole-body control.",
    idealFor: "Anyone looking to improve posture, reduce tension, and build strength with intention and precision.",
    outcomes: [
      "Improved core stability and postural alignment",
      "Greater body awareness and movement control",
      "A practice that complements training and daily life",
    ],
    cta: { label: "Join Pilates", href: "#booking" },
  },
  {
    number: "04",
    title: "Content Creation & UGC",
    description:
      "Authentic, high-quality content rooted in real expertise. From workout breakdowns and product integrations to lifestyle and wellness storytelling — every piece of content is on-brand, credible, and built to convert.",
    idealFor: "Fitness, wellness, beauty, and lifestyle brands looking for expert-backed UGC and organic-feeling sponsored content.",
    outcomes: [
      "UGC video and photo content",
      "Instagram & TikTok reels",
      "Product reviews and tutorials",
      "Gym, lifestyle, and wellness niches",
    ],
    cta: { label: "Partner on Content", href: "#booking" },
  },
  {
    number: "05",
    title: "Modeling",
    description:
      "Available for fitness, lifestyle, and wellness brand shoots. With a background in content creation and an authentic athletic aesthetic, Keyla brings both professionalism and genuine brand alignment to every shoot.",
    idealFor: "Brands and photographers seeking a fitness model with a strong personal brand and real-world athletic credibility.",
    outcomes: [
      "Fitness and lifestyle brand campaigns",
      "Lookbook and product shoots",
      "Social media and digital ad content",
    ],
    cta: { label: "Book for a Shoot", href: "#booking" },
  },
];

export default function Services() {
  return (
    <section id="services" className="bg-bg pt-20 pb-24 md:pb-28">
      <Container>
        <SectionHeading
          label="Services"
          title="How We Work Together"
          subtitle="Whether you're looking for expert training, mindful Pilates instruction, content creation, or an authentic brand partnership — there's a path here for you."
        />

        <div className="mt-20 space-y-0">
          {services.map((service, i) => (
            <ScrollReveal key={service.number} delay={i * 0.1}>
              <div className="relative">
                {i !== 0 && <div className="gradient-divider" />}

                <div className="relative grid gap-8 py-14 md:grid-cols-12 md:gap-12">
                  <span className="pointer-events-none absolute -left-2 top-8 select-none font-serif text-[140px] leading-none text-terracotta/[0.05] md:left-0">
                    {service.number}
                  </span>

                  <div className="relative md:col-span-4">
                    <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                      {service.number}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl font-light tracking-[-0.01em] text-text md:text-3xl">
                      {service.title}
                    </h3>
                  </div>

                  <div className="relative md:col-span-8">
                    <p className="font-sans text-base font-light leading-[1.8] text-text/80">
                      {service.description}
                    </p>

                    <div className="mt-6">
                      <span className="inline-block rounded-[20px] bg-blush px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-burgundy">
                        Ideal For
                      </span>
                      <p className="mt-2 font-sans text-sm font-light leading-relaxed text-text-muted">
                        {service.idealFor}
                      </p>
                    </div>

                    <ul className="mt-6 space-y-2">
                      {service.outcomes.map((outcome) => (
                        <li
                          key={outcome}
                          className="flex items-start gap-3 font-sans text-sm font-light text-text/70"
                        >
                          <span className="mt-1.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-terracotta/60" />
                          {outcome}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <a
                        href={service.cta.href}
                        className="animated-underline inline-flex items-center gap-2 font-sans text-sm font-medium tracking-wider text-terracotta transition-colors hover:text-burgundy"
                      >
                        {service.cta.label}
                        <span className="transition-transform duration-300 hover:translate-x-1">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
