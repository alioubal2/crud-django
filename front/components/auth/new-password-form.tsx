"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/lib/api";
import { confirmPasswordReset } from "@/lib/auth";
import { NewPasswordFields } from "./new-password-fields";

// Étape 3 : le nouveau mot de passe. Django n'accepte que si le code a été
// vérifié à l'étape 2 par ce même navigateur (mémorisé dans la session).
export function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setIsSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(password);
      toast.success("Mot de passe modifié. Vous pouvez vous connecter.");
      router.replace("/login");
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};

  // Vérification absente ou expirée (code de plus de 10 minutes, nouveau code
  // demandé entre-temps, page ouverte directement...) : il faut recommencer.
  if (fieldErrors.non_field_errors) {
    return (
      <div className="flex flex-col gap-4">
        <FormError message={fieldErrors.non_field_errors[0]} />
        <Button asChild className="w-full">
          <Link href="/forgot-password">Recommencer</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error !== null && !fieldErrors.new_password && <FormError message={errorMessage(error)} />}
      <NewPasswordFields
        label="Nouveau mot de passe"
        password={password}
        onPasswordChange={setPassword}
        confirmation={confirmation}
        onConfirmationChange={setConfirmation}
        passwordErrors={fieldErrors.new_password}
        mismatch={mismatch}
        autoFocus
      />
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
