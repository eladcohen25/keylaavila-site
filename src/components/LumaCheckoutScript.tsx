import Script from "next/script";

/** Include once in root layout so all Luma checkout links work. */
export default function LumaCheckoutScript() {
  return <Script id="luma-checkout" src="https://embed.lu.ma/checkout-button.js" strategy="afterInteractive" />;
}
