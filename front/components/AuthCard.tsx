import Link from "next/link";

import { Logo } from "./Logo";

type AuthCardProps = {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
  children: React.ReactNode;
};

// Cadre commun aux pages de connexion et d'inscription.
export function AuthCard({ title, subtitle, footerText, footerLinkLabel, footerHref, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <Logo />
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-muted">
          {footerText}{" "}
          <Link href={footerHref} className="link">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
