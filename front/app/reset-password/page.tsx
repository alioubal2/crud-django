import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Choisissez le mot de passe que vous utiliserez désormais."
      footerText="Finalement pas besoin ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      {/* Le formulaire lit uid et token dans l'URL (useSearchParams) : Next.js
          exige une frontière Suspense pour pré-rendre le reste de la page. */}
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
