import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keyla Avila — Creator, Trainer & Certified Pilates Instructor",
  description:
    "Content creator, certified personal trainer, and Pilates instructor with a degree in kinesiology. Elevating wellness through movement, education, and authentic content.",
  keywords: [
    "Keyla Avila",
    "personal trainer",
    "Pilates instructor",
    "content creator",
    "wellness",
    "kinesiology",
    "fitness",
  ],
  openGraph: {
    title: "Keyla Avila — Creator, Trainer & Certified Pilates Instructor",
    description:
      "Content creator, certified personal trainer, and Pilates instructor with a degree in kinesiology.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
