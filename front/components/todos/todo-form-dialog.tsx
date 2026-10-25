"use client";

import { useState } from "react";

import { FieldError, FormError } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, errorMessage } from "@/lib/api";
import { PRIORITY_LABELS, STATUS_COLUMNS } from "@/lib/todo-utils";
import type { Priority, Todo, TodoInput, TodoStatus } from "@/lib/types";
import { PriorityDot } from "./priority-badge";

type TodoFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // null : création ; une tâche : modification de cette tâche.
  todo: Todo | null;
  // Colonne pré-sélectionnée lors d'une création (bouton « Ajouter une tâche »).
  defaultStatus: TodoStatus;
  onSubmit: (input: TodoInput) => Promise<void>;
};

// Un seul formulaire pour créer et modifier une tâche.
export function TodoFormDialog({ open, onOpenChange, todo, defaultStatus, onSubmit }: TodoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            {todo ? "Mettez à jour les informations de la tâche." : "Seul le titre est obligatoire."}
          </DialogDescription>
        </DialogHeader>
        {/* Le contenu du Dialog est démonté à la fermeture : le formulaire repart
            de l'état de la tâche à chaque ouverture. */}
        <TodoForm todo={todo} defaultStatus={defaultStatus} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}

function TodoForm({ todo, defaultStatus, onSubmit }: Pick<TodoFormDialogProps, "todo" | "defaultStatus" | "onSubmit">) {
  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [status, setStatus] = useState<TodoStatus>(todo?.status ?? defaultStatus);
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? "normal");
  const [dueDate, setDueDate] = useState(todo?.due_date ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [titleError, setTitleError] = useState<string[]>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Validation immédiate côté client pour le confort ; Django revalide de toute façon.
    if (title.trim() === "") {
      setTitleError(["Le titre est obligatoire."]);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setTitleError(undefined);
    try {
      await onSubmit({ title, description, status, priority, due_date: dueDate || null });
    } catch (err) {
      setError(err);
      setIsSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {};
  const titleMessages = titleError ?? fieldErrors.title;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error !== null && <FormError message={errorMessage(error)} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="todo-title">Titre</Label>
        <Input
          id="todo-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex. Préparer la réunion"
          maxLength={200}
          required
          autoFocus
          aria-invalid={Boolean(titleMessages)}
          aria-describedby={titleMessages ? "todo-title-error" : undefined}
        />
        <FieldError id="todo-title-error" messages={titleMessages} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="todo-description">
          Description <span className="font-normal text-muted-foreground">(facultative)</span>
        </Label>
        <Textarea
          id="todo-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="todo-status">Colonne</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as TodoStatus)}>
            <SelectTrigger id="todo-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_COLUMNS.map(({ status: value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="todo-status-error" messages={fieldErrors.status} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="todo-priority">Priorité</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger id="todo-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => (
                <SelectItem key={value} value={value}>
                  <PriorityDot priority={value} />
                  {PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError id="todo-priority-error" messages={fieldErrors.priority} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="todo-due-date">
          Échéance <span className="font-normal text-muted-foreground">(facultative)</span>
        </Label>
        <Input
          id="todo-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-invalid={Boolean(fieldErrors.due_date)}
        />
        <FieldError id="todo-due-date-error" messages={fieldErrors.due_date} />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Annuler
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement…" : todo ? "Enregistrer" : "Ajouter la tâche"}
        </Button>
      </DialogFooter>
    </form>
  );
}
