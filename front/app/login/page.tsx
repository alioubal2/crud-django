import type { Metadata } from "next";

import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Connexion"
      subtitle="Retrouvez vos tâches."
      footerText="Pas encore de compte ?"
      footerLinkLabel="Créer un compte"
      footerHref="/register"
    >
      <LoginForm />
    </AuthCard>
  );
}
