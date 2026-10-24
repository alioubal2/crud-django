"use client";

import { useState } from "react";

import { ApiError, errorMessage } from "@/lib/api";
import type { TodoInput } from "@/lib/types";
import { Alert } from "../Alert";

type TodoFormProps = {
  onCreate: (input: TodoInput) => Promise<void>;
};

export function TodoForm({ onCreate }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({ title, description });
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const titleErrors = error instanceof ApiError ? error.fieldErrors.title : undefined;

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-4" noValidate>
      {error !== null && <Alert message={titleErrors?.join(" ") ?? errorMessage(error)} />}
      <label htmlFor="new-todo-title" className="sr-only">
        Titre de la tâche
      </label>
      <input
        id="new-todo-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nouvelle tâche…"
        maxLength={200}
        required
        className="input"
      />
      <label htmlFor="new-todo-description" className="sr-only">
        Description (facultative)
      </label>
      <textarea
        id="new-todo-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (facultative)"
        rows={2}
        className="input resize-y"
      />
      <button type="submit" className="btn-primary self-end" disabled={isSubmitting || title.trim() === ""}>
        {isSubmitting ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}
