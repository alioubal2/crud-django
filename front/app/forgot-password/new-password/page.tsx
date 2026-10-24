import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
};

export default function NewPasswordPage() {
  return (
    <AuthCard
      title="Nouveau mot de passe"
      description="Étape 3 sur 3 · Code vérifié. Choisissez votre nouveau mot de passe."
      footerText="Finalement pas besoin ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      <NewPasswordForm />
    </AuthCard>
  );
}
