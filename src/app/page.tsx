"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import LazySection from "@/components/ui/LazySection";
import UGCPortfolio from "@/components/sections/UGCPortfolio";
import BrandLogos from "@/components/sections/BrandLogos";
import ContentCreator from "@/components/sections/ContentCreator";
import Credentials from "@/components/sections/Credentials";
import Testimonials from "@/components/sections/Testimonials";
import Gallery from "@/components/sections/Gallery";
import Booking from "@/components/sections/Booking";
import FAQ from "@/components/sections/FAQ";
import ShopLinks from "@/components/sections/ShopLinks";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <LazySection minHeight={500}>
          <UGCPortfolio />
        </LazySection>
        <LazySection minHeight={400}>
          <BrandLogos />
        </LazySection>
        <LazySection minHeight={600}>
          <ContentCreator />
        </LazySection>
        <LazySection minHeight={500}>
          <Credentials />
        </LazySection>
        <LazySection minHeight={400}>
          <Testimonials />
        </LazySection>
        <LazySection minHeight={600}>
          <Gallery />
        </LazySection>
        <LazySection minHeight={500}>
          <Booking />
        </LazySection>
        <LazySection minHeight={400}>
          <FAQ />
        </LazySection>
        <LazySection minHeight={300}>
          <ShopLinks />
        </LazySection>
      </main>
      <Footer />
    </>
  );
}
