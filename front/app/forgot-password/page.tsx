import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Étape 1 sur 3 · Indiquez votre e-mail pour recevoir un code à 6 chiffres."
      footerText="Vous vous en souvenez ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
