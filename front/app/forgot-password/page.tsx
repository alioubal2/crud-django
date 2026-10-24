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
      description="Indiquez votre e-mail : un code à 6 chiffres vous permettra d'en choisir un nouveau."
      footerText="Vous vous en souvenez ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
