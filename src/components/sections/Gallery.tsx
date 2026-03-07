"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { useIsMobile } from "@/lib/MobileProvider";

const galleryItems = [
  { id: 1, src: "/images/lifestyle/editorial-standing.jpg", alt: "Editorial portrait — standing", aspect: "aspect-[3/4]" },
  { id: 2, src: "/images/fitness/barbell-training.jpg", alt: "Barbell training session", aspect: "aspect-[3/4]" },
  { id: 3, src: "/images/lifestyle/editorial-profile.jpg", alt: "Editorial profile portrait", aspect: "aspect-[3/4]" },
  { id: 4, src: "/images/lifestyle/pilates-prep.jpg", alt: "Pilates studio warmup", aspect: "aspect-[4/5]" },
  { id: 5, src: "/images/fitness/gym-portrait.jpg", alt: "Gym portrait", aspect: "aspect-[3/4]" },
  { id: 6, src: "/images/lifestyle/night-editorial.jpg", alt: "Night editorial shoot", aspect: "aspect-[3/4]" },
  { id: 7, src: "/images/fitness/cable-training.jpg", alt: "Cable training", aspect: "aspect-[3/4]" },
  { id: 8, src: "/images/lifestyle/editorial-seated.jpg", alt: "Editorial seated portrait", aspect: "aspect-[3/4]" },
  { id: 9, src: "/images/pilates/pilates-studio.jpg", alt: "Rooftop movement", aspect: "aspect-[1/1]" },
  { id: 10, src: "/images/fitness/puma-event.jpg", alt: "Puma fitness event", aspect: "aspect-[3/4]" },
  { id: 11, src: "/images/fitness/training-session.jpg", alt: "Training session", aspect: "aspect-[4/5]" },
  { id: 12, src: "/images/pilates/pilates-casual.jpg", alt: "Pilates casual", aspect: "aspect-[4/5]" },
  { id: 13, src: "/images/fitness/fitness2-img_0273.jpg", alt: "Fitness portrait", aspect: "aspect-[3/4]" },
  { id: 14, src: "/images/fitness/fitness2-img_1594.jpg", alt: "Training session", aspect: "aspect-[3/4]" },
  { id: 15, src: "/images/fitness/fitness2-img_1595.jpg", alt: "Fitness editorial", aspect: "aspect-[4/5]" },
  { id: 16, src: "/images/fitness/fitness2-img_1597.jpg", alt: "Gym session", aspect: "aspect-[3/4]" },
  { id: 17, src: "/images/fitness/fitness2-img_1602.jpg", alt: "Workout portrait", aspect: "aspect-[3/4]" },
  { id: 18, src: "/images/fitness/fitness2-img_1604.jpg", alt: "Fitness lifestyle", aspect: "aspect-[4/5]" },
  { id: 19, src: "/images/fitness/fitness2-img_1605.jpg", alt: "Active lifestyle", aspect: "aspect-[3/4]" },
  { id: 20, src: "/images/fitness/fitness2-img_3050.jpg", alt: "Training moment", aspect: "aspect-[1/1]" },
  { id: 21, src: "/images/gallery/dsc06646.jpg", alt: "Studio portrait", aspect: "aspect-[3/4]" },
  { id: 22, src: "/images/gallery/img_1983.jpg", alt: "Lifestyle shoot", aspect: "aspect-[3/4]" },
  { id: 23, src: "/images/gallery/img_1984.jpg", alt: "Editorial portrait", aspect: "aspect-[4/5]" },
  { id: 24, src: "/images/gallery/img_1986.jpg", alt: "Movement portrait", aspect: "aspect-[3/4]" },
  { id: 25, src: "/images/gallery/img_4899.jpg", alt: "Outdoor session", aspect: "aspect-[3/4]" },
  { id: 26, src: "/images/gallery/03afffbc-3bf4-4894-89b5-c5e073422c61.jpg", alt: "Portrait", aspect: "aspect-[3/4]" },
  { id: 27, src: "/images/gallery/39.jpg", alt: "Fitness editorial", aspect: "aspect-[3/4]" },
  { id: 28, src: "/images/gallery/56.jpg", alt: "Active lifestyle", aspect: "aspect-[3/2]" },
];

const mobileItems = galleryItems.slice(0, 4);
const col1Mobile = mobileItems.filter((_, i) => i % 2 === 0);
const col2Mobile = mobileItems.filter((_, i) => i % 2 === 1);

const col1All = galleryItems.filter((_, i) => i % 3 === 0);
const col2All = galleryItems.filter((_, i) => i % 3 === 1);
const col3All = galleryItems.filter((_, i) => i % 3 === 2);

function GalleryMobile() {
  return (
    <div className="mt-12 grid grid-cols-2 gap-2">
      <div className="flex flex-col gap-2">
        {col1Mobile.map((item) => (
          <div key={item.id} className={`relative ${item.aspect} overflow-hidden rounded-[4px]`}>
            <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="45vw" quality={40} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-4">
        {col2Mobile.map((item) => (
          <div key={item.id} className={`relative ${item.aspect} overflow-hidden rounded-[4px]`}>
            <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="45vw" quality={40} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryDesktop() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const col1Y = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const col2Y = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const col3Y = useTransform(scrollYProgress, [0, 1], [0, -15]);

  return (
    <div className="mt-20 hidden grid-cols-3 gap-4 md:grid" ref={sectionRef}>
      <motion.div className="flex flex-col gap-4" style={{ y: col1Y }}>
        {col1All.map((item, i) => (
          <ScrollReveal key={item.id} delay={i * 0.06}>
            <div className={`group relative ${item.aspect} cursor-pointer overflow-hidden rounded-[4px]`}>
              <Image src={item.src} alt={item.alt} fill className="object-cover transition-all duration-[350ms] ease-out group-hover:scale-[1.02]" sizes="33vw" quality={75} />
              <div className="absolute inset-0 bg-text/0 transition-all duration-[350ms] group-hover:bg-text/5 group-hover:shadow-[0_8px_30px_rgba(100,60,40,0.15)]" />
            </div>
          </ScrollReveal>
        ))}
      </motion.div>
      <motion.div className="flex flex-col gap-4 pt-12" style={{ y: col2Y }}>
        {col2All.map((item, i) => (
          <ScrollReveal key={item.id} delay={i * 0.06 + 0.03}>
            <div className={`group relative ${item.aspect} cursor-pointer overflow-hidden rounded-[4px]`}>
              <Image src={item.src} alt={item.alt} fill className="object-cover transition-all duration-[350ms] ease-out group-hover:scale-[1.02]" sizes="33vw" quality={75} />
              <div className="absolute inset-0 bg-text/0 transition-all duration-[350ms] group-hover:bg-text/5 group-hover:shadow-[0_8px_30px_rgba(100,60,40,0.15)]" />
            </div>
          </ScrollReveal>
        ))}
      </motion.div>
      <motion.div className="flex flex-col gap-4 pt-6" style={{ y: col3Y }}>
        {col3All.map((item, i) => (
          <ScrollReveal key={item.id} delay={i * 0.06 + 0.06}>
            <div className={`group relative ${item.aspect} cursor-pointer overflow-hidden rounded-[4px]`}>
              <Image src={item.src} alt={item.alt} fill className="object-cover transition-all duration-[350ms] ease-out group-hover:scale-[1.02]" sizes="33vw" quality={75} />
              <div className="absolute inset-0 bg-text/0 transition-all duration-[350ms] group-hover:bg-text/5 group-hover:shadow-[0_8px_30px_rgba(100,60,40,0.15)]" />
            </div>
          </ScrollReveal>
        ))}
      </motion.div>
    </div>
  );
}

export default function Gallery() {
  const isMobile = useIsMobile();

  return (
    <section id="gallery" className="relative bg-bg-alt py-24 md:py-28">
      <Container className="relative z-10">
        <SectionHeading
          label="Gallery"
          title="A Visual Story"
          subtitle="Moments captured — in the studio, in training, and in life."
          decorativeLine
        />

        {isMobile !== false ? <GalleryMobile /> : <GalleryDesktop />}
      </Container>
    </section>
  );
}
