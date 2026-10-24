"use client";

import { useDraggable } from "@dnd-kit/core";
import { ArrowRightLeft, CalendarDays, Ellipsis, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDueDate, isOverdue, STATUS_COLUMNS } from "@/lib/todo-utils";
import type { Todo, TodoStatus } from "@/lib/types";

type TodoCardProps = {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMove: (todo: Todo, status: TodoStatus) => void;
};

// Carte déplaçable. Pendant le glisser, c'est une copie (TodoCardPreview, dans
// le DragOverlay du tableau) qui suit la souris ; l'original reste en place, estompé.
export function TodoCard({ todo, onEdit, onDelete, onMove }: TodoCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: todo.id, data: { todo } });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription="tâche déplaçable"
      aria-label={todo.title}
      onClick={() => onEdit(todo)}
      className={`group relative cursor-grab rounded-lg border bg-card p-3 shadow-xs transition-colors outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing ${isDragging ? "opacity-40" : ""}`}
    >
      <TodoCardBody todo={todo} />
      {/* On arrête la propagation : sans ça, cliquer ou appuyer sur Entrée dans
          le menu ouvrirait la carte ou démarrerait un glisser. */}
      <div
        className="absolute top-2 right-2"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions pour « ${todo.title} »`}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:aria-expanded:opacity-100"
            >
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(todo)}>
              <Pencil aria-hidden="true" />
              Modifier
            </DropdownMenuItem>
            {/* Alternative au glisser-déposer, utilisable au clavier et au toucher. */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRightLeft aria-hidden="true" />
                Déplacer vers
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STATUS_COLUMNS.filter(({ status }) => status !== todo.status).map(({ status, label }) => (
                  <DropdownMenuItem key={status} onSelect={() => onMove(todo, status)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(todo)}>
              <Trash2 aria-hidden="true" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

// Apparence de la carte qui suit la souris pendant le glisser.
export function TodoCardPreview({ todo }: { todo: Todo }) {
  return (
    <div className="w-72 rotate-2 cursor-grabbing rounded-lg border bg-card p-3 shadow-lg">
      <TodoCardBody todo={todo} />
    </div>
  );
}

function TodoCardBody({ todo }: { todo: Todo }) {
  const overdue = isOverdue(todo);
  const isDone = todo.status === "done";

  return (
    <div className="flex flex-col gap-1.5 pr-6">
      {/* Badge uniquement quand la priorité sort de l'ordinaire. */}
      {todo.priority === "high" && (
        <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
          Priorité haute
        </Badge>
      )}
      {todo.priority === "low" && <Badge variant="secondary">Priorité basse</Badge>}
      <p className={`text-sm font-medium break-words ${isDone ? "text-muted-foreground line-through" : ""}`}>
        {todo.title}
      </p>
      {todo.description && (
        <p className="line-clamp-2 text-xs whitespace-pre-line break-words text-muted-foreground">
          {todo.description}
        </p>
      )}
      {todo.due_date && (
        <p className={`flex items-center gap-1 text-xs ${overdue ? "font-medium text-warning" : "text-muted-foreground"}`}>
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {formatDueDate(todo.due_date)}
          {overdue && " · en retard"}
        </p>
      )}
    </div>
  );
}
