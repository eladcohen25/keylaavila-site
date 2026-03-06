"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import ScrollReveal from "@/components/ui/ScrollReveal";

type FormMode = "client" | "brand";
type SubmitState = "idle" | "loading" | "success" | "error";

const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxdTdLPODiqSBHXQ5Ew4GYiTXYath8NhfAFhoX1hF40Tb47Fgaekcpvc6GRLZJg_Ts/exec";

const clientInterests = [
  "Personal Training",
  "Group Fitness / Event",
  "Pilates",
  "General Inquiry",
];

const hearAboutOptions = ["Instagram", "TikTok", "Referral", "Google", "Other"];

const collabTypes = [
  "UGC Content",
  "Sponsored Post",
  "Brand Ambassador",
  "Event / Activation",
  "Wedding Content Creation",
  "Modeling / Shoot",
  "Other",
];

const budgetRanges = [
  "Under $500",
  "$500–$1,500",
  "$1,500–$5,000",
  "$5,000+",
  "Let's Discuss",
];

export default function Booking() {
  const [mode, setMode] = useState<FormMode>("client");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const [clientData, setClientData] = useState({
    name: "", email: "", phone: "", interest: "", budget: "", hearAbout: "", goals: "",
  });

  const [brandData, setBrandData] = useState({
    brandName: "", contactName: "", email: "", phone: "", website: "",
    collabType: "", budget: "", campaign: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("loading");

    const payload =
      mode === "client"
        ? {
            inquiryType: "Client",
            fullName: clientData.name,
            contactName: "",
            email: clientData.email,
            phone: clientData.phone,
            instagramHandle: "",
            interestedIn: clientData.interest,
            heardAbout: clientData.hearAbout,
            brandName: "",
            website: "",
            budgetRange: clientData.budget,
            goals: clientData.goals,
          }
        : {
            inquiryType: "Brand",
            fullName: "",
            contactName: brandData.contactName,
            email: brandData.email,
            phone: brandData.phone,
            instagramHandle: "",
            interestedIn: brandData.collabType,
            heardAbout: "",
            brandName: brandData.brandName,
            website: brandData.website,
            budgetRange: brandData.budget,
            goals: brandData.campaign,
          };

    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });
      setSubmitState("success");
      setClientData({ name: "", email: "", phone: "", interest: "", budget: "", hearAbout: "", goals: "" });
      setBrandData({ brandName: "", contactName: "", email: "", phone: "", website: "", collabType: "", budget: "", campaign: "" });
    } catch {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 4000);
    }
  }

  const inputClasses =
    "w-full rounded-lg border border-border bg-bg/50 px-5 py-4 font-sans text-sm font-light text-text placeholder:text-text-muted/50 transition-all duration-200 focus:border-terracotta focus:shadow-[0_0_0_3px_rgba(196,113,74,0.2)] focus:outline-none";

  const labelClasses =
    "mb-2 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta";

  return (
    <section id="booking" className="bg-bg py-24 md:py-28">
      <Container>
        <SectionHeading
          label="Work With Me"
          title="Let's Connect"
          subtitle="Whether you're looking for training, Pilates, or a brand partnership — I'd love to hear from you."
        />

        <div className="mx-auto mt-20 grid max-w-5xl gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <ScrollReveal>
              {/* Toggle */}
              <div className="mb-10 flex items-center justify-center gap-1 rounded-full border border-border p-1 md:inline-flex">
                {(["client", "brand"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setSubmitState("idle"); }}
                    className={`relative rounded-full px-6 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.08em] transition-all duration-250 ${
                      mode === tab
                        ? "bg-terracotta text-bg"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {tab === "client" ? "I'm a Client" : "I'm a Brand"}
                  </button>
                ))}
              </div>

              {/* Success state */}
              <AnimatePresence mode="wait">
                {submitState === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border border-terracotta/20 bg-blush/50 px-8 py-12 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-terracotta">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="font-serif text-2xl font-light text-text">
                      Thank You!
                    </h3>
                    <p className="mx-auto mt-3 max-w-md font-sans text-sm font-light leading-relaxed text-text-muted">
                      Your inquiry has been received. I&apos;ll get back to you within 48 hours.
                    </p>
                    <button
                      onClick={() => setSubmitState("idle")}
                      className="mt-6 font-sans text-sm font-medium text-terracotta transition-colors hover:text-burgundy"
                    >
                      Send another inquiry
                    </button>
                  </motion.div>
                ) : mode === "client" ? (
                  <motion.form
                    key="client"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="c-name" className={labelClasses}>Full Name</label>
                        <input id="c-name" type="text" required placeholder="Your full name"
                          className={inputClasses} value={clientData.name}
                          onChange={(e) => setClientData({ ...clientData, name: e.target.value })} />
                      </div>
                      <div>
                        <label htmlFor="c-email" className={labelClasses}>Email</label>
                        <input id="c-email" type="email" required placeholder="your@email.com"
                          className={inputClasses} value={clientData.email}
                          onChange={(e) => setClientData({ ...clientData, email: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-phone" className={labelClasses}>Phone Number</label>
                      <input id="c-phone" type="tel" placeholder="(555) 123-4567"
                        className={inputClasses} value={clientData.phone}
                        onChange={(e) => setClientData({ ...clientData, phone: e.target.value })} />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="c-interest" className={labelClasses}>I&apos;m Interested In</label>
                        <select id="c-interest" required className={`${inputClasses} appearance-none`}
                          value={clientData.interest}
                          onChange={(e) => setClientData({ ...clientData, interest: e.target.value })}>
                          <option value="" disabled>Select an option</option>
                          {clientInterests.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="c-hear" className={labelClasses}>How Did You Hear About Keyla?</label>
                        <select id="c-hear" className={`${inputClasses} appearance-none`}
                          value={clientData.hearAbout}
                          onChange={(e) => setClientData({ ...clientData, hearAbout: e.target.value })}>
                          <option value="" disabled>Select an option</option>
                          {hearAboutOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-budget" className={labelClasses}>Budget Range</label>
                      <select id="c-budget" className={`${inputClasses} appearance-none`}
                        value={clientData.budget}
                        onChange={(e) => setClientData({ ...clientData, budget: e.target.value })}>
                        <option value="" disabled>Select a range</option>
                        {budgetRanges.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="c-goals" className={labelClasses}>Tell Me About Your Goals</label>
                      <textarea id="c-goals" rows={5} placeholder="What are you hoping to achieve?"
                        className={`${inputClasses} resize-none`} value={clientData.goals}
                        onChange={(e) => setClientData({ ...clientData, goals: e.target.value })} />
                    </div>

                    <button
                      type="submit"
                      disabled={submitState === "loading"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg transition-all duration-250 hover:bg-burgundy disabled:opacity-60 md:w-auto"
                    >
                      {submitState === "loading" ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                          </svg>
                          Sending...
                        </>
                      ) : "Send Inquiry"}
                    </button>

                    {submitState === "error" && (
                      <p className="font-sans text-sm text-burgundy">
                        Something went wrong. Please try again or email directly.
                      </p>
                    )}
                  </motion.form>
                ) : (
                  <motion.form
                    key="brand"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="b-brand" className={labelClasses}>Brand / Company Name</label>
                        <input id="b-brand" type="text" required placeholder="Your brand name"
                          className={inputClasses} value={brandData.brandName}
                          onChange={(e) => setBrandData({ ...brandData, brandName: e.target.value })} />
                      </div>
                      <div>
                        <label htmlFor="b-contact" className={labelClasses}>Contact Name</label>
                        <input id="b-contact" type="text" required placeholder="Your full name"
                          className={inputClasses} value={brandData.contactName}
                          onChange={(e) => setBrandData({ ...brandData, contactName: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="b-email" className={labelClasses}>Email</label>
                        <input id="b-email" type="email" required placeholder="you@brand.com"
                          className={inputClasses} value={brandData.email}
                          onChange={(e) => setBrandData({ ...brandData, email: e.target.value })} />
                      </div>
                      <div>
                        <label htmlFor="b-phone" className={labelClasses}>Phone Number</label>
                        <input id="b-phone" type="tel" placeholder="(555) 123-4567"
                          className={inputClasses} value={brandData.phone}
                          onChange={(e) => setBrandData({ ...brandData, phone: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="b-website" className={labelClasses}>Website (Optional)</label>
                        <input id="b-website" type="url" placeholder="https://yourbrand.com"
                          className={inputClasses} value={brandData.website}
                          onChange={(e) => setBrandData({ ...brandData, website: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label htmlFor="b-collab" className={labelClasses}>Type of Collaboration</label>
                        <select id="b-collab" required className={`${inputClasses} appearance-none`}
                          value={brandData.collabType}
                          onChange={(e) => setBrandData({ ...brandData, collabType: e.target.value })}>
                          <option value="" disabled>Select an option</option>
                          {collabTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="b-budget" className={labelClasses}>Budget Range</label>
                        <select id="b-budget" required className={`${inputClasses} appearance-none`}
                          value={brandData.budget}
                          onChange={(e) => setBrandData({ ...brandData, budget: e.target.value })}>
                          <option value="" disabled>Select a range</option>
                          {budgetRanges.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="b-campaign" className={labelClasses}>Tell Me About Your Campaign or Project</label>
                      <textarea id="b-campaign" rows={5}
                        placeholder="Share your campaign goals, timeline, deliverables..."
                        className={`${inputClasses} resize-none`} value={brandData.campaign}
                        onChange={(e) => setBrandData({ ...brandData, campaign: e.target.value })} />
                    </div>

                    <button
                      type="submit"
                      disabled={submitState === "loading"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-text px-8 py-4 font-sans text-[13px] font-medium uppercase tracking-[0.08em] text-bg transition-all duration-250 hover:bg-burgundy disabled:opacity-60 md:w-auto"
                    >
                      {submitState === "loading" ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                          </svg>
                          Sending...
                        </>
                      ) : "Send Partnership Inquiry"}
                    </button>

                    {submitState === "error" && (
                      <p className="font-sans text-sm text-burgundy">
                        Something went wrong. Please try again or email directly.
                      </p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </ScrollReveal>
          </div>

          {/* Right sidebar — context-aware */}
          <div className="lg:col-span-5">
            <ScrollReveal delay={0.2}>
              <div className="space-y-10">
                <AnimatePresence mode="wait">
                  {mode === "client" ? (
                    <motion.div
                      key="client-info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                        For Clients
                      </h4>
                      <p className="mt-3 font-sans text-sm font-light leading-relaxed text-text/70">
                        Looking for personal training, group fitness, or Pilates instruction?
                        Fill out the form and I&apos;ll get back to you within 48 hours to
                        discuss your goals and find the right fit.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="brand-info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                        For Brands
                      </h4>
                      <p className="mt-3 font-sans text-sm font-light leading-relaxed text-text/70">
                        Interested in a collaboration or partnership? I work with brands
                        that align with my values in wellness, fitness, beauty, and lifestyle.
                        Let&apos;s create something meaningful together.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-border/40 pt-8">
                  <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                    Direct Contact
                  </h4>
                  <a href="mailto:hello@keylaavila.com" className="mt-3 block font-sans text-base font-light text-text transition-colors duration-200 hover:text-terracotta">
                    hello@keylaavila.com
                  </a>
                  <a href="https://instagram.com/keylanavila" target="_blank" rel="noopener noreferrer" className="mt-2 block font-sans text-base font-light text-text transition-colors duration-200 hover:text-terracotta">
                    @keylanavila
                  </a>
                </div>

                <div className="rounded-r-lg border-l-[3px] border-terracotta bg-blush px-6 py-6">
                  <p className="font-serif text-lg font-light italic leading-relaxed text-text/70">
                    &ldquo;Every great transformation starts with a single intentional step.&rdquo;
                  </p>
                  <span className="mt-3 block font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-terracotta">
                    — Keyla
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
