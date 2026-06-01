import Image from "next/image";

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
}: {
  name: string | null;
  url: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-terracotta/15 font-sans font-medium text-terracotta ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {url ? (
        <Image src={url} alt={name ?? "Client"} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
