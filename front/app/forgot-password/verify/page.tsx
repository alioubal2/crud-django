import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { VerifyCodeForm } from "@/components/auth/verify-code-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Vérification du code",
};

export default function VerifyCodePage() {
  return (
    <AuthCard
      title="Vérification du code"
      description="Étape 2 sur 3 · Saisissez le code à 6 chiffres."
      footerText="Vous vous en souvenez ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      {/* Le formulaire lit l'e-mail dans l'URL (useSearchParams) : Next.js
          exige une frontière Suspense pour pré-rendre le reste de la page. */}
      <Suspense fallback={<Skeleton className="h-56 w-full" />}>
        <VerifyCodeForm />
      </Suspense>
    </AuthCard>
  );
}
