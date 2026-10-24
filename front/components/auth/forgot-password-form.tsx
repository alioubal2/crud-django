"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, errorMessage } from "@/lib/api";
import { confirmPasswordReset, requestPasswordReset } from "@/lib/auth";
import { PasswordInput } from "./password-input";

// Deux étapes sur la même page :
//   1. l'e-mail -> Django génère un code et l'affiche dans son terminal ;
//   2. le code + le nouveau mot de passe.
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");

  if (step === "email") {
    return <EmailStep email={email} onEmailChange={setEmail} onCodeRequested={() => setStep("code")} />;
  }
  return <CodeStep email={email} onChangeEmail={() => setStep("email")} />;
}

type EmailStepProps = {
  email: string;
  onEmailChange: (email: string) => void;
  onCodeRequested: () => void;
};

function EmailStep({ email, onEmailChange, onCodeRequested }: EmailStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      onCodeRequested();
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
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="email"
          placeholder="vous@exemple.com"
          required
          autoFocus
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" messages={fieldErrors.email} />
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Envoi…" : "Recevoir un code"}
      </Button>
    </form>
  );
}

type CodeStepProps = {
  email: string;
  onChangeEmail: () => void;
};

function CodeStep({ email, onChangeEmail }: CodeStepProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
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
      await confirmPasswordReset({ email, code, new_password: password });
      toast.success("Mot de passe modifié. Vous pouvez vous connecter.");
      router.replace("/login");
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setCode("");
      toast.success("Nouveau code généré. L'ancien ne fonctionne plus.");
    } catch (err) {
      setError(err);
    } finally {
      setIsResending(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};
  // Erreur générale (code faux, expiré, trop d'essais, trop de demandes...) ;
  // les erreurs propres à un champ s'affichent sous ce champ.
  const showGeneralError = error !== null && !fieldErrors.code && !fieldErrors.new_password;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Si un compte existe pour <span className="font-medium text-foreground">{email}</span>, un code à 6 chiffres
        valable 10 minutes vient d&apos;être généré. En développement, il s&apos;affiche dans le terminal du
        serveur Django.
      </p>
      {showGeneralError && <FormError message={errorMessage(error)} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
          className="text-center font-mono text-lg tracking-[0.5em]"
          aria-invalid={Boolean(fieldErrors.code)}
          aria-describedby={fieldErrors.code ? "code-error" : undefined}
        />
        <FieldError id="code-error" messages={fieldErrors.code} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <PasswordInput
          id="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
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

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting || code.length !== 6}>
        {isSubmitting ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
      <div className="flex justify-between gap-2">
        <Button type="button" variant="link" className="px-0" onClick={onChangeEmail}>
          Changer d&apos;adresse
        </Button>
        <Button type="button" variant="link" className="px-0" onClick={handleResend} disabled={isResending}>
          {isResending ? "Envoi…" : "Renvoyer un code"}
        </Button>
      </div>
    </form>
  );
}
