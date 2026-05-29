import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import CheckInForm, { CheckInHeader } from "@/components/checkin/CheckInForm";

export const metadata: Metadata = {
  title: "Weekly Check-In — Keyla Avila",
  description:
    "Submit your weekly training check-in. Honest answers help Keyla coach you better — takes about 3 minutes.",
  robots: { index: false, follow: false },
};

export default function CheckInPage() {
  return (
    <>
      <CheckInHeader />
      <main className="bg-bg py-12 md:py-20">
        <Container className="max-w-3xl">
          <div className="mb-10 text-center md:mb-14">
            <span className="mb-4 inline-block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
              Client Portal
            </span>
            <h1 className="font-serif text-4xl font-light tracking-tight text-text md:text-5xl">
              Weekly Check-In
            </h1>
            <p className="mx-auto mt-4 max-w-lg font-sans text-base font-light leading-relaxed text-text-muted">
              Honest answers = better coaching. This takes about 3 minutes —
              measure in the morning when you can, and be real about your week.
            </p>
            <div className="mx-auto mt-4 h-px w-12 bg-terracotta" />
          </div>

          <CheckInForm />
        </Container>
      </main>
    </>
  );
}
