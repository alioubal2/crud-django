import { AlertCircle } from "lucide-react";

// Erreur générale d'un formulaire (identifiants incorrects, serveur injoignable...).
// role="alert" : les lecteurs d'écran l'annoncent dès son apparition.
export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

// Erreur propre à un champ, reliée à l'input par aria-describedby.
export function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {messages.join(" ")}
    </p>
  );
}
