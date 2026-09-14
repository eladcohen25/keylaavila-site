import Image from "next/image";
import { CSSProperties } from "react";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  url,
  size = 40,
  className = "",
  color,
}: {
  name: string | null;
  url: string | null;
  size?: number;
  className?: string;
  /** Trainer-assigned label color — tints the initials and adds a ring. */
  color?: string | null;
}) {
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(11, size * 0.36),
  };
  if (color) {
    style.boxShadow = `0 0 0 2px ${color}`;
    if (!url) {
      style.backgroundColor = `${color}26`; // ~15% alpha
      style.color = color;
    }
  }
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-terracotta/15 font-sans font-medium text-terracotta ${className}`}
      style={style}
    >
      {url ? (
        <Image src={url} alt={name ?? "Client"} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
