import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Bon retour"
      description="Connectez-vous pour retrouver vos tâches."
      footerText="Pas encore de compte ?"
      footerLinkLabel="Créer un compte"
      footerHref="/register"
    >
      <LoginForm />
    </AuthCard>
  );
}
