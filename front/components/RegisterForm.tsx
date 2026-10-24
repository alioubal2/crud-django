"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, errorMessage } from "@/lib/api";
import { register } from "@/lib/auth";
import { Alert } from "./Alert";
import { FormField } from "./FormField";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Django ouvre la session à l'inscription : on va directement aux tâches.
      await register({ email, username, password });
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
        id="username"
        label="Nom d'utilisateur"
        value={username}
        onChange={setUsername}
        autoComplete="username"
        required
        errors={fieldErrors.username}
      />
      <FormField
        id="password"
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
        errors={fieldErrors.password}
      />
      <button type="submit" className="btn-primary mt-2" disabled={isSubmitting}>
        {isSubmitting ? "Création…" : "Créer mon compte"}
      </button>
    </form>
  );
}
