"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import UGCPortfolio from "@/components/sections/UGCPortfolio";
import BrandLogos from "@/components/sections/BrandLogos";
import Credentials from "@/components/sections/Credentials";
import Testimonials from "@/components/sections/Testimonials";
import ContentCreator from "@/components/sections/ContentCreator";
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
        <UGCPortfolio />
        <BrandLogos />
        <ContentCreator />
        <Credentials />
        <Testimonials />
        <Gallery />
        <Booking />
        <FAQ />
        <ShopLinks />
      </main>
      <Footer />
    </>
  );
}
