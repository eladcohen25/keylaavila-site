import { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="theme-app flex min-h-screen items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta font-sans text-base font-bold text-white">
            KA
          </span>
          <h1 className="font-serif text-3xl tracking-tight text-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-xs font-sans text-sm text-text-muted">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-6 text-center font-sans text-sm text-text-muted">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
