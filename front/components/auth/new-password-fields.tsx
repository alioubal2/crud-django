"use client";

import { FieldError } from "@/components/form-message";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";

type NewPasswordFieldsProps = {
  password: string;
  onPasswordChange: (value: string) => void;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
  // Erreurs renvoyées par Django pour le mot de passe (trop court, trop courant...).
  passwordErrors?: string[];
  // Vrai quand les deux saisies diffèrent (vérifié à l'envoi du formulaire).
  mismatch: boolean;
  label?: string;
  autoFocus?: boolean;
};

// Champ « mot de passe » + champ « confirmation », utilisés à l'inscription
// et lors de la réinitialisation.
export function NewPasswordFields({
  password,
  onPasswordChange,
  confirmation,
  onConfirmationChange,
  passwordErrors,
  mismatch,
  label = "Mot de passe",
  autoFocus = false,
}: NewPasswordFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{label}</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="new-password"
          required
          autoFocus={autoFocus}
          aria-invalid={Boolean(passwordErrors)}
          aria-describedby={passwordErrors ? "password-error" : "password-hint"}
        />
        {passwordErrors ? (
          <FieldError id="password-error" messages={passwordErrors} />
        ) : (
          <p id="password-hint" className="text-xs text-muted-foreground">
            8 caractères minimum, pas uniquement des chiffres.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password-confirmation">Confirmer le mot de passe</Label>
        <PasswordInput
          id="password-confirmation"
          value={confirmation}
          onChange={(event) => onConfirmationChange(event.target.value)}
          autoComplete="new-password"
          required
          aria-invalid={mismatch}
          aria-describedby={mismatch ? "password-confirmation-error" : undefined}
        />
        <FieldError
          id="password-confirmation-error"
          messages={mismatch ? ["Les deux mots de passe ne correspondent pas."] : undefined}
        />
      </div>
    </>
  );
}
