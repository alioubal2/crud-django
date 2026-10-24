"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError, errorMessage } from "@/lib/api";
import { confirmPasswordReset } from "@/lib/auth";
import { PasswordInput } from "./password-input";

export function ResetPasswordForm() {
  // Le lien de l'e-mail a la forme /reset-password?uid=...&token=...
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!uid || !token) {
    return <InvalidLink />;
  }
  return <NewPasswordForm uid={uid} token={token} />;
}

function NewPasswordForm({ uid, token }: { uid: string; token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [mismatch, setMismatch] = useState(false);

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
      await confirmPasswordReset({ uid, token, new_password: password });
      toast.success("Mot de passe modifié. Vous pouvez vous connecter.");
      router.replace("/login");
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};
  // non_field_errors : lien invalide, expiré ou déjà utilisé.
  if (fieldErrors.non_field_errors) {
    return <InvalidLink message={fieldErrors.non_field_errors[0]} />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error !== null && !fieldErrors.new_password && <FormError message={errorMessage(error)} />}
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          autoFocus
          aria-invalid={Boolean(fieldErrors.new_password)}
          aria-describedby={fieldErrors.new_password ? "new-password-error" : "new-password-hint"}
        />
        {fieldErrors.new_password ? (
          <FieldError id="new-password-error" messages={fieldErrors.new_password} />
        ) : (
          <p id="new-password-hint" className="text-xs text-muted-foreground">
            8 caractères minimum, pas uniquement des chiffres.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
        <PasswordInput
          id="confirm-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
          aria-invalid={mismatch}
          aria-describedby={mismatch ? "confirm-password-error" : undefined}
        />
        <FieldError
          id="confirm-password-error"
          messages={mismatch ? ["Les deux mots de passe ne correspondent pas."] : undefined}
        />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}

function InvalidLink({ message = "Ce lien de réinitialisation est incomplet." }: { message?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormError message={message} />
      <Button asChild variant="outline" className="w-full">
        <Link href="/forgot-password">Demander un nouveau lien</Link>
      </Button>
    </div>
  );
}
