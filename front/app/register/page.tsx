import type { Metadata } from "next";

import { AuthCard } from "@/components/AuthCard";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Quelques secondes suffisent."
      footerText="Déjà inscrit ?"
      footerLinkLabel="Se connecter"
      footerHref="/login"
    >
      <RegisterForm />
    </AuthCard>
  );
}
