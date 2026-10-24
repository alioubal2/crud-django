import { apiFetch } from "./api";
import type { Todo, TodoInput, TodoPatch } from "./types";

export function listTodos(): Promise<Todo[]> {
  return apiFetch<Todo[]>("/api/todos/");
}

export function createTodo(input: TodoInput): Promise<Todo> {
  return apiFetch<Todo>("/api/todos/", { method: "POST", body: input });
}

export function updateTodo(id: number, patch: TodoPatch): Promise<Todo> {
  return apiFetch<Todo>(`/api/todos/${id}/`, { method: "PATCH", body: patch });
}

export function deleteTodo(id: number): Promise<void> {
  return apiFetch<void>(`/api/todos/${id}/`, { method: "DELETE" });
}
