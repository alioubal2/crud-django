"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { ApiError, errorMessage } from "@/lib/api";
import { confirmPasswordReset, requestPasswordReset, verifyPasswordResetCode } from "@/lib/auth";
import { PasswordInput } from "./password-input";

type Step = "email" | "code" | "password";

const STEP_NUMBERS: Record<Step, number> = { email: 1, code: 2, password: 3 };

// Trois étapes sur la même page :
//   1. l'e-mail       -> Django génère un code et l'affiche dans son terminal ;
//   2. le code        -> Django vérifie le code (sans le consommer) ;
//   3. le mot de passe -> Django revérifie le code puis change le mot de passe.
export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  // Message affiché à l'étape 2 quand on y revient (code expiré entre-temps...).
  const [codeError, setCodeError] = useState<string | null>(null);

  function backToCode(message: string) {
    setCode("");
    setCodeError(message);
    setStep("code");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium text-muted-foreground">Étape {STEP_NUMBERS[step]} sur 3</p>
      {step === "email" && (
        <EmailStep email={email} onEmailChange={setEmail} onCodeRequested={() => setStep("code")} />
      )}
      {step === "code" && (
        <CodeStep
          email={email}
          code={code}
          onCodeChange={setCode}
          initialError={codeError}
          onVerified={() => {
            setCodeError(null);
            setStep("password");
          }}
          onChangeEmail={() => {
            setCode("");
            setStep("email");
          }}
        />
      )}
      {step === "password" && <PasswordStep email={email} code={code} onCodeRejected={backToCode} />}
    </div>
  );
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
  code: string;
  onCodeChange: (code: string) => void;
  initialError: string | null;
  onVerified: () => void;
  onChangeEmail: () => void;
};

function CodeStep({ email, code, onCodeChange, initialError, onVerified, onChangeEmail }: CodeStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function verify(value: string) {
    setIsVerifying(true);
    setError(null);
    try {
      await verifyPasswordResetCode({ email, code: value });
      onVerified();
    } catch (err) {
      setError(errorMessage(err));
      onCodeChange("");
      setIsVerifying(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verify(code);
  }

  async function handleResend() {
    setIsResending(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      onCodeChange("");
      toast.success("Nouveau code généré. L'ancien ne fonctionne plus.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Si un compte existe pour <span className="font-medium text-foreground">{email}</span>, un code à 6 chiffres
        valable 10 minutes vient d&apos;être généré. En développement, il s&apos;affiche dans le terminal du
        serveur Django.
      </p>
      {error && <FormError message={error} />}

      <div className="flex flex-col items-center gap-2">
        <Label htmlFor="code">Code de vérification</Label>
        {/* InputOTP : un vrai <input> invisible + 6 cases d'affichage. Le collage
            d'un code entier et le remplissage automatique (one-time-code) marchent. */}
        <InputOTP
          id="code"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={onCodeChange}
          // Vérification automatique dès que les 6 chiffres sont saisis.
          onComplete={verify}
          disabled={isVerifying}
          autoFocus
          autoComplete="one-time-code"
          aria-invalid={Boolean(error)}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} className="size-11 text-lg" aria-invalid={Boolean(error)} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isVerifying || code.length !== 6}>
        {isVerifying ? "Vérification…" : "Vérifier le code"}
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

type PasswordStepProps = {
  email: string;
  code: string;
  onCodeRejected: (message: string) => void;
};

function PasswordStep({ email, code, onCodeRejected }: PasswordStepProps) {
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
      await confirmPasswordReset({ email, code, new_password: password });
      toast.success("Mot de passe modifié. Vous pouvez vous connecter.");
      router.replace("/login");
    } catch (err) {
      // Le code a expiré (ou a été remplacé) depuis sa vérification : retour à l'étape 2.
      if (err instanceof ApiError && err.fieldErrors.non_field_errors) {
        onCodeRejected(err.message);
        return;
      }
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <p role="status" className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        Code vérifié. Choisissez votre nouveau mot de passe.
      </p>
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
