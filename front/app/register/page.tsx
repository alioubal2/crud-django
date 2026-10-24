import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Créer un compte"
      description="Quelques secondes suffisent pour commencer."
      footerText="Déjà inscrit ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      <RegisterForm />
    </AuthCard>
  );
}
