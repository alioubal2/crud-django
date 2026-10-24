// Fonctions pures autour des tâches : aucune dépendance à React ni à l'API,
// elles se testent et se réutilisent facilement.

import type { Priority, Todo } from "./types";

export type TodoFilter = "all" | "active" | "completed";

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

export function filterTodos(todos: Todo[], filter: TodoFilter, search: string): Todo[] {
  const query = search.trim().toLowerCase();
  return todos.filter((todo) => {
    if (filter === "active" && todo.completed) return false;
    if (filter === "completed" && !todo.completed) return false;
    if (!query) return true;
    return `${todo.title} ${todo.description}`.toLowerCase().includes(query);
  });
}

export function computeStats(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.completed).length;
  return { total: todos.length, completed, remaining: todos.length - completed };
}

// "2026-11-15" -> Date locale à minuit. new Date("2026-11-15") l'interpréterait
// en UTC, ce qui peut décaler d'un jour selon le fuseau horaire.
function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isOverdue(todo: Todo): boolean {
  if (!todo.due_date || todo.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(todo.due_date) < today;
}

const dueDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function formatDueDate(value: string): string {
  return dueDateFormatter.format(parseDate(value));
}
