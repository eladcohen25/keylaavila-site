"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useIsMobile } from "@/lib/MobileProvider";

interface AnimatedTextProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  delay?: number;
  staggerChildren?: number;
  splitBy?: "word" | "line";
  once?: boolean;
}

function AnimatedTextDesktop({
  text,
  as: Tag = "h2",
  className = "",
  delay = 0,
  staggerChildren = 0.08,
  splitBy = "word",
  once = true,
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.3 });

  const parts = splitBy === "word" ? text.split(" ") : text.split("\n");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <Tag className={className}>
        {parts.map((part, i) => (
          <motion.span
            key={i}
            variants={childVariants}
            className="inline-block"
          >
            {part}
            {splitBy === "word" && i < parts.length - 1 && "\u00A0"}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
}

export default function AnimatedText(props: AnimatedTextProps) {
  const isMobile = useIsMobile();
  const Tag = props.as || "h2";

  // Mobile or initial SSR: render plain text, no observer, no stagger animation
  if (isMobile !== false) {
    return <Tag className={props.className}>{props.text}</Tag>;
  }

  return <AnimatedTextDesktop {...props} />;
}
