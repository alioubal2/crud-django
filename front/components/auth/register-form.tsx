"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, errorMessage } from "@/lib/api";
import { register } from "@/lib/auth";
import { NewPasswordFields } from "./new-password-fields";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Vérification côté navigateur uniquement : Django ne reçoit qu'un mot de passe.
    if (password !== confirmation) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setIsSubmitting(true);
    setError(null);
    try {
      // Django ouvre la session à l'inscription : on va directement au tableau de bord.
      await register({ email, username, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error !== null && <FormError message={errorMessage(error)} />}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" messages={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Nom d&apos;utilisateur</Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? "username-error" : undefined}
        />
        <FieldError id="username-error" messages={fieldErrors.username} />
      </div>
      <NewPasswordFields
        password={password}
        onPasswordChange={setPassword}
        confirmation={confirmation}
        onConfirmationChange={setConfirmation}
        passwordErrors={fieldErrors.password}
        mismatch={mismatch}
      />
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
