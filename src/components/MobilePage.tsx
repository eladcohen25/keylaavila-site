"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { InstagramPost, InstagramProfile } from "@/lib/instagram";

/* ─── Shared utilities ─── */
const cn = (...c: string[]) => c.filter(Boolean).join(" ");
const CONTAINER = "mx-auto w-full max-w-[1280px] px-6";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

/* ─── Heading (replaces SectionHeading — zero framer-motion) ─── */
function Heading({ label, title, subtitle, align = "center", decorativeLine }: {
  label?: string; title: string; subtitle?: string; align?: "left" | "center"; decorativeLine?: boolean;
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      {label && <span className="mb-4 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">{label}</span>}
      <h2 className="font-serif text-3xl font-light leading-tight tracking-[-0.01em] text-text">{title}</h2>
      {decorativeLine && <div className={`mt-3 h-px w-12 bg-terracotta ${align === "center" ? "mx-auto" : ""}`} />}
      {subtitle && <p className="mt-5 font-sans text-base font-light leading-relaxed text-text-muted">{subtitle}</p>}
    </div>
  );
}

/* ─── NAVBAR ─── */
function MobNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navLinks = [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#booking" },
  ];

  return (
    <>
      <header className={cn("fixed top-0 left-0 z-50 w-full transition-all duration-500", scrolled ? "bg-bg shadow-[0_1px_0_0_rgba(0,0,0,0.04)]" : "bg-transparent")}>
        <div className={cn(CONTAINER, "flex items-center justify-between py-4")}>
          <a href="#" className="relative block h-10 w-28">
            <Image src="/final keyla logo.png" alt="Keyla Avila" fill className="object-contain" sizes="128px" priority />
          </a>
          <button onClick={() => setOpen(!open)} className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5" aria-label="Menu">
            <span className={cn("block h-[1.5px] w-6 bg-text transition-all duration-300", open ? "translate-y-[4.5px] rotate-45" : "")} />
            <span className={cn("block h-[1.5px] w-6 bg-text transition-opacity duration-200", open ? "opacity-0" : "")} />
            <span className={cn("block h-[1.5px] w-6 bg-text transition-all duration-300", open ? "-translate-y-[4.5px] -rotate-45" : "")} />
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg">
          <nav className="flex flex-col items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-serif text-3xl font-light text-text">{l.label}</a>
            ))}
            <a href="#booking" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg">Work With Me</a>
          </nav>
        </div>
      )}
    </>
  );
}

/* ─── HERO ─── */
function MobHero() {
  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/hero/keyla-hero.jpg" alt="Keyla Avila" fill className="object-cover object-top" priority sizes="100vw" quality={60} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      </div>
      <div className={cn(CONTAINER, "relative z-10 flex h-full flex-col justify-end pb-16 pt-32")}>
        <div className="max-w-2xl">
          <span className="mb-5 inline-block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">Creator · Trainer · Pilates Instructor</span>
          <h1 className="font-serif text-[2.8rem] font-light leading-[1.05] tracking-tight text-white">
            <span className="block">Movement,</span>
            <span className="block">Wellness &</span>
            <span className="block text-[3.2rem] italic text-terracotta">Intention</span>
          </h1>
          <p className="mt-6 max-w-md font-sans text-sm font-light leading-relaxed text-white/70">
            Certified personal trainer and Pilates instructor helping women build strength, confidence, and sustainable wellness — backed by a degree in kinesiology.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#booking" className="inline-flex items-center justify-center rounded-full bg-bg px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-text">Book Training</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── ABOUT ─── */
function MobAbout() {
  return (
    <section id="about" className="relative bg-bg-alt py-28">
      <div className={CONTAINER}>
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-[8px_8px_40px_rgba(100,60,40,0.12)]">
                <Image src="/images/lifestyle/main-photo.jpg" alt="Keyla Avila" fill className="object-cover" sizes="90vw" quality={50} />
              </div>
              <div className="absolute -bottom-6 -right-6 -z-10 h-full w-full rounded-xl bg-blush/50" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <Heading label="About Keyla" title="Where Science Meets Soul" align="left" />
            <div className="mt-8 space-y-5">
              <p className="border-l-[3px] border-terracotta pl-5 font-sans text-base font-light leading-[1.8] text-text/80">
                I&apos;m Keyla — a certified personal trainer, Pilates instructor, and content creator with a degree in kinesiology. My approach to wellness lives at the intersection of science, movement, and authentic self-expression.
              </p>
              <p className="font-sans text-base font-light leading-[1.8] text-text/80">
                With a foundation in human movement science and years of hands-on training experience, I bring an evidence-based yet deeply personal approach to every session, every piece of content, and every collaboration.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border/40 pt-8">
              <div className="flex items-start gap-3">
                <span className="mt-2 block h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
                <div><span className="font-serif text-3xl font-light text-text">B.S.</span><p className="mt-1 font-sans text-sm font-light text-text-muted">Kinesiology</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-2 block h-2 w-2 flex-shrink-0 rounded-full bg-terracotta" />
                <div><span className="font-serif text-3xl font-light text-text">Certified</span><p className="mt-1 font-sans text-sm font-light text-text-muted">Pilates Instructor</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SERVICES ─── */
const services = [
  { number: "01", title: "Personal Training", description: "Science-backed, fully personalized 1-on-1 training programs designed around your body, your goals, and your life.", idealFor: "Women ready for structured, expert-led training.", cta: { label: "Book a Session", href: "#booking" } },
  { number: "02", title: "Group Fitness & Events", description: "High-energy group fitness instruction for corporate events, brand activations, and private gatherings.", idealFor: "Event planners, brands, and studios.", cta: { label: "Book for Your Event", href: "#booking" } },
  { number: "03", title: "Pilates Instruction", description: "Certified Pilates instruction blending classical technique with a modern, functional approach.", idealFor: "Anyone looking to improve posture and build strength with intention.", cta: { label: "Join Pilates", href: "#booking" } },
  { number: "04", title: "Content Creation & UGC", description: "Authentic, high-quality content rooted in real expertise — from workout breakdowns to lifestyle storytelling.", idealFor: "Fitness, wellness, beauty, and lifestyle brands.", cta: { label: "Partner on Content", href: "#booking" } },
  { number: "05", title: "Modeling", description: "Available for fitness, lifestyle, and wellness brand shoots with authentic athletic aesthetics.", idealFor: "Brands seeking a fitness model with real-world credibility.", cta: { label: "Book for a Shoot", href: "#booking" } },
];

function MobServices() {
  return (
    <section id="services" className="bg-bg pt-20 pb-24">
      <div className={CONTAINER}>
        <Heading label="Services" title="How We Work Together" subtitle="Whether you're looking for expert training, Pilates, content creation, or a brand partnership — there's a path here for you." />
        <div className="mt-16 space-y-0">
          {services.map((s, i) => (
            <div key={s.number} className="relative">
              {i !== 0 && <div className="h-px bg-gradient-to-r from-transparent via-terracotta/25 to-transparent" />}
              <div className="relative py-10">
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">{s.number}</span>
                <h3 className="mt-2 font-serif text-2xl font-light tracking-[-0.01em] text-text">{s.title}</h3>
                <p className="mt-4 font-sans text-base font-light leading-[1.8] text-text/80">{s.description}</p>
                <span className="mt-4 inline-block rounded-[20px] bg-blush px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-burgundy">Ideal For</span>
                <p className="mt-2 font-sans text-sm font-light text-text-muted">{s.idealFor}</p>
                <a href={s.cta.href} className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium tracking-wider text-terracotta">{s.cta.label} →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── UGC PORTFOLIO ─── */
const categoryColors: Record<string, string> = {
  "UGC VIDEO": "bg-terracotta",
  "BRAND COLLAB": "bg-olive",
  "WEDDING": "bg-burgundy",
  "EVENT": "bg-burgundy",
  "MODELING": "bg-text",
  "TRAVEL": "bg-olive",
};

const ugcCards = [
  { type: "UGC VIDEO", brand: "Hustle & Heart — Skincare", href: "https://www.instagram.com/reels/DRH_u2UjXdK/", thumbnail: "/images/ugc/hustle-skincare.jpg" },
  { type: "WEDDING", brand: "Wedding Content — Tory Cooper", href: "https://www.instagram.com/reels/DU2QzdBDEyG/", thumbnail: "/images/ugc/wedding-torycooper.jpg" },
  { type: "BRAND COLLAB", brand: "Reebok — Smart Ring", href: "https://www.instagram.com/reels/DVUY5XYDrq2/", thumbnail: "/images/ugc/reebok-smartring.jpg" },
  { type: "BRAND COLLAB", brand: "Etho Wellness Club", href: "https://www.tiktok.com/@keylanavilaa/video/7599898730539584798", thumbnail: "/images/ugc/etho-wellness.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DU4qTJyjNWl/", thumbnail: "/images/ugc/wedding-tory2.jpg" },
  { type: "MODELING", brand: "F1 — Las Vegas Campaign", href: "https://www.instagram.com/p/CxYnEVwvqA3/?img_index=2", thumbnail: "/images/ugc/f1-lasvegas.jpg" },
  { type: "BRAND COLLAB", brand: "Dry Bar — Beauty Salon", href: "https://www.tiktok.com/@keylanavilaa/video/7561932699489865015", thumbnail: "/images/ugc/drybar-salon.jpg" },
  { type: "WEDDING", brand: "Luxury Wedding — Tory Cooper", href: "https://www.instagram.com/reels/DQZ1S6gknsi/", thumbnail: "/images/ugc/wedding-tory3.jpg" },
  { type: "BRAND COLLAB", brand: "Lululemon — Store Grand Opening", href: "https://www.instagram.com/reels/DORdqxCkm-8/", thumbnail: "/images/ugc/lululemon-opening.jpg" },
  { type: "TRAVEL", brand: "Visit Costa Rica", href: "https://www.tiktok.com/@keylanavilaa/video/7503013218017922350", thumbnail: "/images/ugc/costarica1.jpg" },
  { type: "BRAND COLLAB", brand: "Coffee & Chill x Etho Wellness", href: "https://www.tiktok.com/@keylanavilaa/video/7560572700029160717", thumbnail: "/images/ugc/coffee-etho.jpg" },
  { type: "UGC VIDEO", brand: "Hustle & Heart — Vegan Collagen Jelly", href: "https://www.instagram.com/reels/DRAN6JjDXYs/", thumbnail: "/images/ugc/hustle-collagen.jpg" },
  { type: "BRAND COLLAB", brand: "Kennetik — Beverage Company", href: "https://www.tiktok.com/@keylanavilaa/video/7540049268451626253", thumbnail: "/images/ugc/kennetik-beverage.jpg" },
  { type: "BRAND COLLAB", brand: "TruFusion Collab", href: "https://www.tiktok.com/@keylanavilaa/video/7537072766026026295", thumbnail: "/images/ugc/trufusion.jpg" },
  { type: "EVENT", brand: "Luxury Event — Tory Cooper", href: "https://www.instagram.com/reels/DH2Asz0ysxV/", thumbnail: "/images/ugc/event-tory7.jpg" },
  { type: "TRAVEL", brand: "Visit Costa Rica", href: "https://www.tiktok.com/@keylanavilaa/video/7497739688090897710", thumbnail: "/images/ugc/costarica2.jpg" },
  { type: "BRAND COLLAB", brand: "One Percent Collab", href: "https://www.tiktok.com/@keylanavilaa/video/7525917584949136695", thumbnail: "/images/ugc/one-percent.jpg" },
  { type: "BRAND COLLAB", brand: "Jobee Swim", href: "https://www.tiktok.com/@keylanavilaa/video/7393854410738355502", thumbnail: "/images/ugc/jobee-swim.jpg" },
];

const marqueeCards = [...ugcCards, ...ugcCards];

function MobUGC() {
  return (
    <section id="ugc" className="bg-bg pt-24 pb-12">
      <div className={CONTAINER}>
        <Heading
          label="UGC & Content"
          title="Content That Converts"
          subtitle="Real content for real audiences — built on expertise, not just aesthetics."
        />
      </div>

      <div
        className="relative mt-12 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
        }}
      >
        <div
          className="flex w-max items-center gap-3 pl-3"
          style={{ animation: "marquee 50s linear infinite" }}
        >
          {marqueeCards.map((card, i) => {
            const pillColor = categoryColors[card.type] || "bg-terracotta";
            return (
              <a
                key={i}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-[260px] w-[180px] flex-shrink-0 overflow-hidden rounded-xl bg-text/5"
              >
                <Image
                  src={card.thumbnail}
                  alt={card.brand}
                  fill
                  className="object-cover"
                  sizes="180px"
                  quality={50}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white/80">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-12">
                  <span className={cn("mb-1.5 inline-block rounded-full px-2.5 py-0.5 font-sans text-[8px] font-medium uppercase tracking-[0.1em] text-bg", pillColor)}>
                    {card.type}
                  </span>
                  <p className="font-sans text-[12px] font-medium leading-snug text-white/90">{card.brand}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <div className={cn(CONTAINER, "mt-8")}>
        <p className="text-center font-sans text-sm font-light text-text-muted">
          More content available upon request —{" "}
          <a href="#booking" className="font-medium text-terracotta">Get in Touch →</a>
        </p>
      </div>
    </section>
  );
}

/* ─── CONTENT CREATOR (Instagram Feed) ─── */
function MobContentCreator() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch("/api/instagram").then(r => r.json()).then(data => {
      if (data.posts?.length > 0) { setPosts(data.posts.slice(0, 6)); setIsLive(true); }
      if (data.profile) setProfile(data.profile);
    }).catch(() => {});
  }, []);

  return (
    <section id="content" className="relative bg-bg-alt py-24">
      <div className={CONTAINER}>
        <Heading label="Creator" title="Content That Educates & Inspires" subtitle="From workout breakdowns to honest wellness conversations — content designed to inform, empower, and connect." />
        <div className="mx-auto mt-10 max-w-2xl">
          <a href="https://instagram.com/keylanavila" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-terracotta/15 bg-blush px-5 py-4">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-terracotta/20 ring-offset-2 ring-offset-blush">
              <Image src={profile?.profile_picture_url || "/images/hero/keyla-main.jpg"} alt="Keyla" fill className="object-cover" sizes="48px" quality={40} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-medium text-text">@{profile?.username || "keylanavila"}</span>
                <Image src="/Instagram check.png" alt="Verified" width={14} height={14} className="flex-shrink-0" />
              </div>
              <p className="mt-0.5 font-sans text-xs font-light text-text-muted">
                {profile?.followers_count ? formatCount(profile.followers_count) + " followers" : "Creator · Trainer · Pilates Instructor"}
              </p>
            </div>
            <span className="flex-shrink-0 rounded-full bg-text px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-bg">Follow</span>
          </a>
        </div>
        <div className="mx-auto mt-6 max-w-4xl">
          <div className="grid grid-cols-3 gap-2">
            {(isLive ? posts : []).map((post) => (
              <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-[4px] bg-border/20">
                <Image src={post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url} alt="Post" fill className="object-cover" sizes="30vw" quality={40} />
              </a>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a href="https://instagram.com/keylanavila" className="inline-flex items-center gap-2 font-sans text-sm font-medium tracking-wider text-terracotta">View more on Instagram →</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CREDENTIALS ─── */
const credentials = [
  { icon: "🎓", title: "Kinesiology Degree", description: "A B.S. in Kinesiology provides the foundation for everything I do." },
  { icon: "✦", title: "Certified Pilates Instructor", description: "Comprehensive Pilates certification with training in mat and reformer work." },
  { icon: "◈", title: "Personal Training Certification", description: "Nationally recognized certification backed by ongoing education." },
  { icon: "○", title: "Evidence-Based Approach", description: "Every program is rooted in exercise science — not trends." },
];

function MobCredentials() {
  return (
    <section id="credentials" className="relative overflow-hidden bg-bg-alt py-24">
      <div className={CONTAINER}>
        <Heading label="Expertise" title="Built on Education, Driven by Passion" subtitle="A strong foundation in human movement science sets the standard for every session." />
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {credentials.map((c) => (
            <div key={c.title} className="rounded-[10px] border border-terracotta/15 bg-bg p-5">
              <span className="text-2xl">{c.icon}</span>
              <h3 className="mt-3 font-serif text-lg font-medium text-text">{c.title}</h3>
              <p className="mt-2 font-sans text-sm font-light leading-[1.8] text-text/70">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
const testimonials = [
  { quote: "Training with Keyla has completely changed how I think about fitness. Her knowledge of the body is unmatched.", name: "Sarah M.", context: "Personal Training Client" },
  { quote: "Keyla's Pilates sessions are a perfect blend of challenging and restorative. My posture and core strength have transformed.", name: "Jessica L.", context: "Pilates Student" },
  { quote: "As a brand, working with Keyla was a dream. She brought genuine expertise and authenticity to our campaign.", name: "Brand Partner", context: "Wellness Brand Collaboration" },
];

function MobTestimonials() {
  const [active, setActive] = useState(0);
  return (
    <section id="testimonials" className="bg-bg py-24">
      <div className={CONTAINER}>
        <Heading label="Kind Words" title="Trusted by Clients & Brands" />
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <span className="block font-serif text-5xl text-terracotta/30">&ldquo;</span>
          <blockquote className="mt-4 font-serif text-xl font-light leading-[1.6] text-text">{testimonials[active].quote}</blockquote>
          <div className="mt-6">
            <span className="font-sans text-sm font-medium text-text">{testimonials[active].name}</span>
            <span className="mx-2 text-border">·</span>
            <span className="font-sans text-sm font-light text-text-muted">{testimonials[active].context}</span>
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} className="flex h-8 items-center justify-center">
                <span className={cn("block rounded-full transition-all duration-300", i === active ? "h-2 w-6 bg-terracotta" : "h-2 w-2 bg-blush")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GALLERY ─── */
const galleryItems = [
  { src: "/images/lifestyle/editorial-standing.jpg", alt: "Editorial", aspect: "aspect-[3/4]" },
  { src: "/images/fitness/barbell-training.jpg", alt: "Training", aspect: "aspect-[3/4]" },
  { src: "/images/lifestyle/editorial-profile.jpg", alt: "Profile", aspect: "aspect-[3/4]" },
  { src: "/images/lifestyle/pilates-prep.jpg", alt: "Pilates", aspect: "aspect-[4/5]" },
];

function MobGallery() {
  return (
    <section id="gallery" className="relative bg-bg-alt py-24">
      <div className={CONTAINER}>
        <Heading label="Gallery" title="A Visual Story" subtitle="Moments captured — in the studio, in training, and in life." decorativeLine />
        <div className="mt-12 grid grid-cols-2 gap-2">
          {galleryItems.map((item, i) => (
            <div key={item.src} className={cn("relative overflow-hidden rounded-[4px]", item.aspect, i % 2 === 1 ? "mt-4" : "")}>
              <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="45vw" quality={40} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── BOOKING ─── */
const ENDPOINT = "https://script.google.com/macros/s/AKfycbxdTdLPODiqSBHXQ5Ew4GYiTXYath8NhfAFhoX1hF40Tb47Fgaekcpvc6GRLZJg_Ts/exec";
const clientInterests = ["Personal Training", "Group Fitness / Event", "Pilates", "General Inquiry"];
const hearAboutOptions = ["Instagram", "TikTok", "Referral", "Google", "Other"];
const collabTypes = ["UGC Content", "Sponsored Post", "Brand Ambassador", "Event / Activation", "Wedding Content Creation", "Modeling / Campaign", "Other"];
const budgetRanges = ["Under $500", "$500 – $1,000", "$1,000 – $2,500", "$2,500 – $5,000", "$5,000+", "Flexible / Open"];

type FormMode = "client" | "brand";
type SubmitState = "idle" | "loading" | "success" | "error";

function MobBooking() {
  const [mode, setMode] = useState<FormMode>("client");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [clientData, setClientData] = useState({ name: "", email: "", phone: "", interest: "", budget: "", hearAbout: "", goals: "" });
  const [brandData, setBrandData] = useState({ brandName: "", contactName: "", email: "", phone: "", website: "", collabType: "", budget: "", campaign: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("loading");
    const payload = mode === "client"
      ? { inquiryType: "client", fullName: clientData.name, email: clientData.email, phone: clientData.phone, interestedIn: clientData.interest, budgetRange: clientData.budget, heardAbout: clientData.hearAbout, goals: clientData.goals }
      : { inquiryType: "brand", brandName: brandData.brandName, contactName: brandData.contactName, email: brandData.email, phone: brandData.phone, website: brandData.website, interestedIn: brandData.collabType, budgetRange: brandData.budget, goals: brandData.campaign };
    try {
      await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), mode: "no-cors" });
      setSubmitState("success");
    } catch { setSubmitState("error"); setTimeout(() => setSubmitState("idle"), 4000); }
  }

  const inp = "w-full rounded-lg border border-border bg-bg/50 px-5 py-4 font-sans text-sm font-light text-text placeholder:text-text-muted/50 transition-all duration-200 focus:border-terracotta focus:outline-none";
  const lbl = "mb-2 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta";

  return (
    <section id="booking" className="bg-bg py-24">
      <div className={CONTAINER}>
        <Heading label="Work With Me" title="Let's Connect" subtitle="Whether you're looking for training, Pilates, or a brand partnership — I'd love to hear from you." />
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="mb-8 flex items-center justify-center gap-1 rounded-full border border-border p-1">
            {(["client", "brand"] as const).map((tab) => (
              <button key={tab} onClick={() => { setMode(tab); setSubmitState("idle"); }}
                className={cn("rounded-full px-6 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.08em] transition-all", mode === tab ? "bg-terracotta text-bg" : "text-text-muted")}>
                {tab === "client" ? "I'm a Client" : "I'm a Brand"}
              </button>
            ))}
          </div>
          {submitState === "success" ? (
            <div className="rounded-xl border border-terracotta/20 bg-blush/50 px-8 py-12 text-center">
              <h3 className="font-serif text-2xl font-light text-text">Thank You!</h3>
              <p className="mt-3 font-sans text-sm font-light text-text-muted">Your inquiry has been received. I&apos;ll get back to you within 48 hours.</p>
              <button onClick={() => setSubmitState("idle")} className="mt-6 font-sans text-sm font-medium text-terracotta">Send another inquiry</button>
            </div>
          ) : mode === "client" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className={lbl}>Full Name</label><input type="text" required placeholder="Your full name" className={inp} value={clientData.name} onChange={e => setClientData({ ...clientData, name: e.target.value })} /></div>
              <div><label className={lbl}>Email</label><input type="email" required placeholder="your@email.com" className={inp} value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} /></div>
              <div><label className={lbl}>Phone</label><input type="tel" placeholder="(555) 123-4567" className={inp} value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} /></div>
              <div><label className={lbl}>I&apos;m Interested In</label>
                <select required className={cn(inp, "appearance-none")} value={clientData.interest} onChange={e => setClientData({ ...clientData, interest: e.target.value })}>
                  <option value="" disabled>Select</option>{clientInterests.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Budget Range</label>
                <select className={cn(inp, "appearance-none")} value={clientData.budget} onChange={e => setClientData({ ...clientData, budget: e.target.value })}>
                  <option value="" disabled>Select</option>{budgetRanges.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Tell Me About Your Goals</label><textarea rows={4} placeholder="What are you hoping to achieve?" className={cn(inp, "resize-none")} value={clientData.goals} onChange={e => setClientData({ ...clientData, goals: e.target.value })} /></div>
              <button type="submit" disabled={submitState === "loading"} className="w-full rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg disabled:opacity-60">
                {submitState === "loading" ? "Sending..." : "Send Inquiry"}
              </button>
              {submitState === "error" && <p className="text-sm text-burgundy">Something went wrong. Please try again.</p>}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className={lbl}>Brand Name</label><input type="text" required placeholder="Your brand" className={inp} value={brandData.brandName} onChange={e => setBrandData({ ...brandData, brandName: e.target.value })} /></div>
              <div><label className={lbl}>Contact Name</label><input type="text" required placeholder="Your name" className={inp} value={brandData.contactName} onChange={e => setBrandData({ ...brandData, contactName: e.target.value })} /></div>
              <div><label className={lbl}>Email</label><input type="email" required placeholder="you@brand.com" className={inp} value={brandData.email} onChange={e => setBrandData({ ...brandData, email: e.target.value })} /></div>
              <div><label className={lbl}>Phone</label><input type="tel" placeholder="(555) 123-4567" className={inp} value={brandData.phone} onChange={e => setBrandData({ ...brandData, phone: e.target.value })} /></div>
              <div><label className={lbl}>Type of Collaboration</label>
                <select required className={cn(inp, "appearance-none")} value={brandData.collabType} onChange={e => setBrandData({ ...brandData, collabType: e.target.value })}>
                  <option value="" disabled>Select</option>{collabTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Budget Range</label>
                <select required className={cn(inp, "appearance-none")} value={brandData.budget} onChange={e => setBrandData({ ...brandData, budget: e.target.value })}>
                  <option value="" disabled>Select</option>{budgetRanges.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Campaign Details</label><textarea rows={4} placeholder="Share your goals, timeline, deliverables..." className={cn(inp, "resize-none")} value={brandData.campaign} onChange={e => setBrandData({ ...brandData, campaign: e.target.value })} /></div>
              <button type="submit" disabled={submitState === "loading"} className="w-full rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg disabled:opacity-60">
                {submitState === "loading" ? "Sending..." : "Send Partnership Inquiry"}
              </button>
              {submitState === "error" && <p className="text-sm text-burgundy">Something went wrong. Please try again.</p>}
            </form>
          )}
          <div className="mt-16 space-y-8">
            <div className="border-t border-border/40 pt-8">
              <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">Direct Contact</h4>
              <a href="mailto:keylaavila01@gmail.com" className="mt-3 block font-sans text-base font-light text-text">keylaavila01@gmail.com</a>
              <a href="https://instagram.com/keylanavila" target="_blank" rel="noopener noreferrer" className="mt-2 block font-sans text-base font-light text-text">@keylanavila</a>
            </div>
            <div className="rounded-r-lg border-l-[3px] border-terracotta bg-blush px-6 py-6">
              <p className="font-serif text-lg font-light italic leading-relaxed text-text/70">&ldquo;Every great transformation starts with a single intentional step.&rdquo;</p>
              <span className="mt-3 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">— Keyla</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  { q: "What does a typical personal training session look like?", a: "Every session is tailored to your goals. We begin with a dynamic warm-up, move into the main training block, and finish with cooldown and mobility work. All programming is based on proper biomechanics." },
  { q: "Do I need Pilates experience to start?", a: "Not at all. My sessions meet you where you are — whether you're a complete beginner or experienced practitioner. We'll start with foundational movement patterns and progress at your pace." },
  { q: "Are sessions available in-person or virtually?", a: "Both. I offer in-person sessions locally as well as virtual training and Pilates for clients anywhere via live video call." },
  { q: "How does brand collaboration work?", a: "I work with brands on a project basis — from single posts to long-term partnerships. Every collaboration begins with a conversation to ensure alignment on values and creative direction." },
  { q: "What makes your approach different?", a: "My kinesiology degree gives me a deep understanding of human movement science. Every program I design is rooted in evidence — not trends." },
  { q: "How often should I train?", a: "Most clients see great results with 3–4 sessions per week, but I'll design a program that fits your life realistically. Consistency matters more than frequency." },
  { q: "Do you offer nutrition guidance?", a: "I share evidence-based nutritional guidance as part of my holistic approach. For specific dietary needs, I refer trusted nutrition professionals." },
  { q: "What's your cancellation policy?", a: "I ask for at least 24 hours' notice for cancellations or rescheduling." },
];

function MobFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section id="faq" className="bg-bg py-24">
      <div className={CONTAINER}>
        <Heading label="FAQ" title="Common Questions" subtitle="Everything you need to know before we start working together." />
        <div className="mx-auto mt-12 max-w-3xl">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border/40">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="pr-6 font-serif text-base font-light text-text">{faq.q}</span>
                <span className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center text-terracotta transition-transform duration-200", openIdx === i ? "rotate-45" : "")}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" /></svg>
                </span>
              </button>
              <div className={cn("grid transition-all duration-300", openIdx === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <p className="pb-5 font-sans text-sm font-light leading-[1.8] text-text/70">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SHOP LINKS ─── */
const shopLinks = [
  { title: "Reebok Smart Ring", description: "20% off with code: Keyla 20", href: "https://www.reeboksmartring.com/products/reebok-smart-ring?variant=52098329313613", logoText: "Reebok", code: "Keyla 20" },
  { title: "The One Percent", description: "Resilience is Ritual.", href: "https://onepercentclo.com/password", logoText: "1%", code: null },
  { title: "Shop TLF", description: "Premium gym-to-street apparel.", href: "https://tlfapparel.com/?dt_id=2301538&utm_source=social&utm_medium=Collab&utm_campaign=BA15AVILA&utm_link=BA15AVILA", logoText: "TLF", code: "BA15AVILA" },
  { title: "Amazon Storefront", description: "Shop Keyla's favorite products.", href: "https://www.amazon.com/shop/keylanavila", logoText: "amazon", code: null },
];

function MobShopLinks() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  return (
    <section className="bg-bg-alt py-24">
      <div className={CONTAINER}>
        <Heading label="Shop & Save" title="Keyla's Picks" subtitle="Exclusive discount codes and curated recommendations." />
        <div className="mx-auto mt-12 max-w-4xl space-y-3">
          {shopLinks.map((link, i) => (
            <a key={link.title} href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border border-terracotta/15 bg-bg px-5 py-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-bg-alt">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wide text-text">{link.logoText}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-serif text-base font-medium text-text">{link.title}</span>
                <span className="block font-sans text-sm font-light text-text-muted">{link.description}</span>
                {link.code && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(link.code!); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-terracotta/8 px-3 py-1 font-mono text-[11px] font-medium text-terracotta">
                    {link.code} · {copiedIdx === i ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-text-muted/40">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function MobFooter() {
  return (
    <footer className="border-t border-terracotta/30 bg-text py-16">
      <div className={CONTAINER}>
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <a href="#" className="relative block h-12 w-32"><Image src="/final keyla logo.png" alt="Keyla Avila" fill className="object-contain brightness-0 invert" sizes="128px" /></a>
            <p className="mt-4 max-w-xs font-sans text-sm font-light leading-relaxed text-border/70">Creator, certified personal trainer, and Pilates instructor.</p>
          </div>
          <div>
            <h4 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">Navigate</h4>
            <ul className="space-y-3">
              {[["About","#about"],["Services","#services"],["Gallery","#gallery"],["FAQ","#faq"],["Contact","#booking"]].map(([l,h]) => (
                <li key={h}><a href={h} className="font-sans text-sm font-light text-border/50">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">Connect</h4>
            <a href="mailto:keylaavila01@gmail.com" className="block font-sans text-sm font-light text-border/50">keylaavila01@gmail.com</a>
          </div>
        </div>
        <div className="mt-12 border-t border-border/10 pt-6">
          <p className="font-sans text-xs font-light text-border/30">© {new Date().getFullYear()} Keyla Avila. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── FULL MOBILE PAGE ─── */
export default function MobilePage() {
  return (
    <>
      <MobNavbar />
      <main>
        <MobHero />
        <MobAbout />
        <MobServices />
        <MobUGC />
        <MobContentCreator />
        <MobCredentials />
        <MobTestimonials />
        <MobGallery />
        <MobBooking />
        <MobFAQ />
        <MobShopLinks />
      </main>
      <MobFooter />
    </>
  );
}
