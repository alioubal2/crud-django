import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS } from "@/lib/todo-utils";
import type { Priority } from "@/lib/types";

// Une couleur par priorité, prise dans la palette du thème (globals.css) :
//   haute   -> warning (orange) : à traiter en premier
//   normale -> primary (indigo) : la couleur d'accent de l'application
//   basse   -> neutre (gris)    : peut attendre
const PRIORITY_STYLES: Record<Priority, { badge: string; dot: string }> = {
  high: { badge: "border-warning/40 bg-warning/10 text-warning", dot: "bg-warning" },
  normal: { badge: "border-primary/30 bg-primary/10 text-primary", dot: "bg-primary" },
  low: { badge: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority].badge}>
      <PriorityDot priority={priority} />
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

// Pastille seule, utilisée dans la liste déroulante du formulaire.
export function PriorityDot({ priority }: { priority: Priority }) {
  return <span className={`size-1.5 shrink-0 rounded-full ${PRIORITY_STYLES[priority].dot}`} aria-hidden="true" />;
}
