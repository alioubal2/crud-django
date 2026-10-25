// Fonctions pures autour des tâches : aucune dépendance à React ni à l'API,
// elles se testent et se réutilisent facilement.

import type { Priority, Todo, TodoStatus } from "./types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
};

// Les colonnes du tableau, dans l'ordre d'affichage.
export const STATUS_COLUMNS: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "À faire" },
  { status: "in_progress", label: "En cours" },
  { status: "done", label: "Terminées" },
];

export const STATUS_LABELS = Object.fromEntries(
  STATUS_COLUMNS.map(({ status, label }) => [status, label]),
) as Record<TodoStatus, string>;

export function searchTodos(todos: Todo[], search: string): Todo[] {
  const query = search.trim().toLowerCase();
  if (!query) return todos;
  return todos.filter((todo) => `${todo.title} ${todo.description}`.toLowerCase().includes(query));
}

export function computeStats(todos: Todo[]) {
  const done = todos.filter((todo) => todo.status === "done").length;
  return { total: todos.length, done, remaining: todos.length - done };
}

// "2026-11-15" -> Date locale à minuit. new Date("2026-11-15") l'interpréterait
// en UTC, ce qui peut décaler d'un jour selon le fuseau horaire.
function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isOverdue(todo: Todo): boolean {
  if (!todo.due_date || todo.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(todo.due_date) < today;
}

const dueDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function formatDueDate(value: string): string {
  return dueDateFormatter.format(parseDate(value));
}
