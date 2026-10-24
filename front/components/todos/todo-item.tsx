"use client";

import { CalendarDays, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDueDate, isOverdue, PRIORITY_LABELS } from "@/lib/todo-utils";
import type { Todo } from "@/lib/types";

type TodoItemProps = {
  todo: Todo;
  onToggle: (todo: Todo) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const checkboxId = `todo-${todo.id}`;
  const overdue = isOverdue(todo);

  async function handleToggle() {
    setIsToggling(true);
    try {
      await onToggle(todo);
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <li className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <Checkbox
        id={checkboxId}
        checked={todo.completed}
        onCheckedChange={handleToggle}
        disabled={isToggling}
        className="mt-0.5 data-checked:border-success data-checked:bg-success data-checked:text-background dark:data-checked:bg-success"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={`cursor-pointer font-medium break-words ${todo.completed ? "text-muted-foreground line-through" : ""}`}
        >
          {todo.title}
        </label>
        {todo.description && (
          <p className="line-clamp-2 text-sm whitespace-pre-line break-words text-muted-foreground">
            {todo.description}
          </p>
        )}
        {(todo.due_date || todo.priority !== "normal") && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {todo.due_date && (
              <span className={`flex items-center gap-1 ${overdue ? "font-medium text-warning" : "text-muted-foreground"}`}>
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDueDate(todo.due_date)}
                {overdue && " · en retard"}
              </span>
            )}
            {/* Badge uniquement quand la priorité sort de l'ordinaire. */}
            {todo.priority === "high" && (
              <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                Priorité haute
              </Badge>
            )}
            {todo.priority === "low" && <Badge variant="secondary">Priorité {PRIORITY_LABELS.low.toLowerCase()}</Badge>}
          </div>
        )}
      </div>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions pour « ${todo.title} »`}>
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(todo)}>
            <Pencil aria-hidden="true" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(todo)}>
            <Trash2 aria-hidden="true" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
