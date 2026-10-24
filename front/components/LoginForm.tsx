"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, errorMessage } from "@/lib/api";
import { login } from "@/lib/auth";
import { Alert } from "./Alert";
import { FormField } from "./FormField";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Empêche le navigateur de recharger la page : React gère l'envoi.
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      router.replace("/todos");
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error !== null && <Alert message={errorMessage(error)} />}
      <FormField
        id="email"
        label="Adresse e-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
        errors={fieldErrors.email}
      />
      <FormField
        id="password"
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
        errors={fieldErrors.password}
      />
      <button type="submit" className="btn-primary mt-2" disabled={isSubmitting}>
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
