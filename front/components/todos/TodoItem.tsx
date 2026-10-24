"use client";

import { useState } from "react";

import { errorMessage } from "@/lib/api";
import type { Todo, TodoPatch } from "@/lib/types";
import { Alert } from "../Alert";

type TodoItemProps = {
  todo: Todo;
  onUpdate: (id: number, patch: TodoPatch) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Exécute une action vers l'API en gérant l'état « occupé » et l'erreur.
  async function run(action: () => Promise<void>): Promise<boolean> {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  function startEditing() {
    setTitle(todo.title);
    setDescription(todo.description);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await run(() => onUpdate(todo.id, { title, description }));
    if (saved) {
      setIsEditing(false);
    }
  }

  async function handleDelete() {
    if (window.confirm(`Supprimer « ${todo.title} » ?`)) {
      await run(() => onDelete(todo.id));
    }
  }

  if (isEditing) {
    return (
      <li className="card p-4">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {error !== null && <Alert message={errorMessage(error)} />}
          <label htmlFor={`todo-${todo.id}-title`} className="sr-only">
            Titre
          </label>
          <input
            id={`todo-${todo.id}-title`}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            required
            autoFocus
            className="input"
          />
          <label htmlFor={`todo-${todo.id}-description`} className="sr-only">
            Description
          </label>
          <textarea
            id={`todo-${todo.id}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            className="input resize-y"
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)} disabled={isBusy}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={isBusy || title.trim() === ""}>
              {isBusy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="card flex flex-col gap-2 p-4">
      {error !== null && <Alert message={errorMessage(error)} />}
      <div className="flex items-start gap-3">
        <input
          id={`todo-${todo.id}-completed`}
          type="checkbox"
          checked={todo.completed}
          onChange={() => run(() => onUpdate(todo.id, { completed: !todo.completed }))}
          disabled={isBusy}
          className="mt-1 size-5 shrink-0 cursor-pointer accent-foreground"
        />
        <label htmlFor={`todo-${todo.id}-completed`} className="min-w-0 flex-1 cursor-pointer">
          <span className={`block break-words font-medium ${todo.completed ? "text-muted line-through" : ""}`}>
            {todo.title}
          </span>
          {todo.description && (
            <span className="mt-0.5 block whitespace-pre-line break-words text-sm text-muted">
              {todo.description}
            </span>
          )}
        </label>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn-ghost" onClick={startEditing} disabled={isBusy}>
            Modifier
          </button>
          <button type="button" className="btn-ghost text-red-600 dark:text-red-400" onClick={handleDelete} disabled={isBusy}>
            Supprimer
          </button>
        </div>
      </div>
    </li>
  );
}
