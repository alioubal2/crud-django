"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Todo } from "@/lib/types";

type DeleteTodoDialogProps = {
  // La tâche à supprimer ; null quand la boîte de dialogue est fermée.
  todo: Todo | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (todo: Todo) => Promise<void>;
};

export function DeleteTodoDialog({ todo, onOpenChange, onConfirm }: DeleteTodoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    // Par défaut, AlertDialogAction ferme la boîte immédiatement :
    // on attend d'abord la réponse de l'API.
    event.preventDefault();
    if (!todo) return;
    setIsDeleting(true);
    try {
      await onConfirm(todo);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={todo !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
          <AlertDialogDescription>
            « {todo?.title} » sera supprimée. Cette action est définitive.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
