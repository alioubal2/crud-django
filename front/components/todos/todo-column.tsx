"use client";

import { useDroppable } from "@dnd-kit/core";
import { CheckCircle2, Circle, Clock3, Plus, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Todo, TodoStatus } from "@/lib/types";
import { TodoCard } from "./todo-card";

const COLUMN_ICONS: Record<TodoStatus, { icon: LucideIcon; className: string }> = {
  todo: { icon: Circle, className: "text-muted-foreground" },
  in_progress: { icon: Clock3, className: "text-primary" },
  done: { icon: CheckCircle2, className: "text-success" },
};

type TodoColumnProps = {
  status: TodoStatus;
  label: string;
  todos: Todo[];
  onCreate: (status: TodoStatus) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMove: (todo: Todo, status: TodoStatus) => void;
};

// Une colonne = une zone où l'on peut déposer une carte (son id est le statut).
export function TodoColumn({ status, label, todos, onCreate, onEdit, onDelete, onMove }: TodoColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { icon: Icon, className: iconClassName } = COLUMN_ICONS[status];
  const headingId = `column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[85%] shrink-0 snap-start flex-col gap-2 rounded-xl bg-muted/60 p-2 sm:w-80 md:w-auto"
    >
      <header className="flex items-center gap-2 px-1.5 pt-1">
        <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-semibold">
          {label}
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">{todos.length}</span>
      </header>

      <ul
        ref={setNodeRef}
        className={`flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1 transition-colors ${isOver ? "bg-primary/5 ring-2 ring-primary/30" : ""}`}
      >
        {todos.map((todo) => (
          <TodoCard key={todo.id} todo={todo} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
        ))}
        {todos.length === 0 && (
          <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Aucune tâche
          </li>
        )}
      </ul>

      <Button variant="ghost" className="justify-start text-muted-foreground" onClick={() => onCreate(status)}>
        <Plus aria-hidden="true" />
        Ajouter une tâche
      </Button>
    </section>
  );
}
