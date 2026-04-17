"use client";

type LumaButtonProps = {
  children?: React.ReactNode;
  className?: string;
};

/** Checkout link — load `LumaCheckoutScript` once in root layout. */
export default function LumaButton({ children = "Register", className = "" }: LumaButtonProps) {
  return (
    <a
      href="https://luma.com/event/evt-tYo72TZfVKm9Zjv"
      className={className}
      data-luma-action="checkout"
      data-luma-event-id="evt-tYo72TZfVKm9Zjv"
    >
      {children}
    </a>
  );
}
