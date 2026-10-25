"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/api";
import { requestPasswordReset, verifyPasswordResetCode } from "@/lib/auth";

// Étape 2 : le code à 6 chiffres. Une fois vérifié, Django le note dans la
// session et on passe à la page du nouveau mot de passe.
export function VerifyCodeForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  if (!email) {
    return (
      <div className="flex flex-col gap-4">
        <FormError message="Adresse e-mail manquante. Recommencez depuis le début." />
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">Recommencer</Link>
        </Button>
      </div>
    );
  }
  return <CodeForm email={email} />;
}

function CodeForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(value: string) {
    setIsVerifying(true);
    setError(null);
    try {
      await verifyPasswordResetCode({ email, code: value });
      router.push("/forgot-password/new-password");
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
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
      setCode("");
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
          onChange={setCode}
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
        <Button asChild variant="link" className="px-0">
          <Link href="/forgot-password">Changer d&apos;adresse</Link>
        </Button>
        <Button type="button" variant="link" className="px-0" onClick={handleResend} disabled={isResending}>
          {isResending ? "Envoi…" : "Renvoyer un code"}
        </Button>
      </div>
    </form>
  );
}
