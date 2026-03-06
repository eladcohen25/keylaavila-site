"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Button from "@/components/ui/Button";
import type { InstagramPost, InstagramProfile } from "@/lib/instagram";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <path d="M22 8v12a2 2 0 0 1-2 2H8" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const fallbackImages = [
  { src: "/images/fitness/gym-portrait.jpg", alt: "Gym portrait", type: "IMAGE" as const },
  { src: "/images/lifestyle/editorial-seated.jpg", alt: "Editorial", type: "IMAGE" as const },
  { src: "/images/pilates/pilates-studio.jpg", alt: "Pilates", type: "IMAGE" as const },
  { src: "/images/lifestyle/pilates-prep.jpg", alt: "Studio warmup", type: "IMAGE" as const },
  { src: "/images/fitness/puma-event.jpg", alt: "Puma event", type: "IMAGE" as const },
  { src: "/images/lifestyle/lifestyle-2.jpg", alt: "Lifestyle", type: "IMAGE" as const },
  { src: "/images/fitness/cable-training.jpg", alt: "Training", type: "IMAGE" as const },
  { src: "/images/lifestyle/night-editorial.jpg", alt: "Night editorial", type: "IMAGE" as const },
  { src: "/images/fitness/barbell-training.jpg", alt: "Barbell training", type: "IMAGE" as const },
];

function PostCard({
  imageSrc, alt, href, mediaType, caption, timestamp, index,
}: {
  imageSrc: string; alt: string; href: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  caption?: string; timestamp?: string; index: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.a
      href={href} target="_blank" rel="noopener noreferrer"
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-[4px] bg-border/20"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={imageSrc} alt={alt} fill
        className="object-cover transition-transform duration-[350ms] ease-out group-hover:scale-[1.03]"
        sizes="(max-width: 768px) 30vw, 18vw"
        quality={60}
      />
      {mediaType !== "IMAGE" && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-white">
          {mediaType === "VIDEO" ? <PlayIcon /> : <CarouselIcon />}
        </div>
      )}
      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-burgundy/20 p-3"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-4 text-white">
              <HeartIcon /><CommentIcon />
            </div>
            {caption && (
              <p className="mt-3 line-clamp-2 text-center font-sans text-[11px] font-light leading-relaxed text-white/85">
                {caption}
              </p>
            )}
            {timestamp && (
              <span className="mt-2 font-sans text-[10px] font-medium uppercase tracking-wider text-white/50">
                {formatTimestamp(timestamp)}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
  );
}

export default function ContentCreator() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/instagram");
        const data = await res.json();
        if (data.posts?.length > 0) {
          const isMob = window.matchMedia("(max-width: 768px)").matches;
          setPosts(data.posts.slice(0, isMob ? 6 : 9));
          setIsLive(true);
        }
        if (data.profile) setProfile(data.profile);
      } catch { /* fallback */ }
    }
    fetchPosts();
  }, []);

  return (
    <section id="content" className="relative bg-bg-alt py-24 md:py-28">
      <Container className="relative z-10">
        <SectionHeading
          label="Creator"
          title="Content That Educates & Inspires"
          subtitle="From workout breakdowns backed by kinesiology to honest wellness conversations — content designed to inform, empower, and connect."
        />

        {/* Instagram Profile Card */}
        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-16 max-w-2xl">
            <a
              href="https://instagram.com/keylanavila" target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-5 rounded-xl border border-terracotta/15 bg-blush px-6 py-5 transition-all duration-300 hover:border-terracotta/40 hover:shadow-[0_8px_32px_rgba(100,60,40,0.08)]"
            >
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-terracotta/20 ring-offset-2 ring-offset-blush transition-all duration-300 group-hover:ring-terracotta/50">
                <Image
                  src={profile?.profile_picture_url || "/images/hero/keyla-main.jpg"}
                  alt="Keyla Avila" fill className="object-cover" sizes="64px"
                  unoptimized={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-medium text-text">
                    @{profile?.username || "keylanavila"}
                  </span>
                  <Image
                    src="/Instagram check.png"
                    alt="Verified"
                    width={14}
                    height={14}
                    className="flex-shrink-0"
                  />
                  {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2 py-0.5 font-sans text-[9px] font-medium uppercase tracking-wider text-terracotta">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute hidden h-full w-full animate-ping rounded-full bg-terracotta/60 md:inline-flex" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-terracotta" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-sans text-xs font-light text-text-muted">
                  Creator · Trainer · Certified Pilates Instructor
                </p>
              </div>
              <div className="hidden items-center gap-6 sm:flex">
                <div className="flex gap-5">
                  {[
                    { value: profile?.media_count ? formatCount(profile.media_count) : "—", label: "Posts" },
                    { value: profile?.followers_count ? formatCount(profile.followers_count) : "—", label: "Followers" },
                    { value: profile?.follows_count ? formatCount(profile.follows_count) : "—", label: "Following" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <span className="block font-sans text-sm font-medium text-text">{s.value}</span>
                      <span className="block font-sans text-[10px] font-light text-text-muted">{s.label}</span>
                    </div>
                  ))}
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-text px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider text-bg transition-colors duration-250 group-hover:bg-terracotta">
                  <InstagramIcon size={12} />
                  Follow
                </span>
              </div>
            </a>
          </div>
        </ScrollReveal>

        {/* Feed Grid */}
        <ScrollReveal delay={0.2}>
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {isLive
                ? posts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      imageSrc={post.media_type === "VIDEO" ? post.thumbnail_url || post.media_url : post.media_url}
                      alt={post.caption?.slice(0, 100) || "Instagram post"}
                      href={post.permalink} mediaType={post.media_type}
                      caption={post.caption} timestamp={post.timestamp} index={i}
                    />
                  ))
                : fallbackImages.map((img, i) => (
                    <PostCard
                      key={img.src} imageSrc={img.src} alt={img.alt}
                      href="https://instagram.com/keylanavila" mediaType={img.type} index={i}
                    />
                  ))}
            </div>
            <div className="mt-8 text-center">
              <Button href="https://instagram.com/keylanavila" variant="text" arrowRight>
                View more on Instagram
              </Button>
            </div>
          </div>
        </ScrollReveal>

      </Container>
    </section>
  );
}
