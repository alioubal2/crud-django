"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { errorMessage, isUnauthorized } from "@/lib/api";
import { getCurrentUser, logout } from "@/lib/auth";
import { createTodo, deleteTodo, listTodos, updateTodo } from "@/lib/todos";
import type { Todo, TodoInput, TodoPatch, User } from "@/lib/types";
import { Alert } from "../Alert";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

type LoadState = "loading" | "ready" | "error";

export function TodoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<unknown>(null);

  // Chargement initial. Si Django répond 401 (pas connecté ou session expirée),
  // on renvoie vers /login. La vraie protection reste côté Django : cette
  // redirection n'est qu'un confort d'affichage.
  useEffect(() => {
    let ignore = false;
    Promise.all([getCurrentUser(), listTodos()])
      .then(([currentUser, items]) => {
        if (ignore) return;
        setUser(currentUser);
        setTodos(items);
        setLoadState("ready");
      })
      .catch((err) => {
        if (ignore) return;
        if (isUnauthorized(err)) {
          router.replace("/login");
          return;
        }
        setLoadError(err);
        setLoadState("error");
      });
    // Évite de mettre à jour l'état si le composant a été démonté entre-temps.
    return () => {
      ignore = true;
    };
  }, [router]);

  // Enveloppe les mutations : redirige si la session a expiré, sinon relance
  // l'erreur pour que le composant appelant l'affiche.
  async function withSessionCheck<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (err) {
      if (isUnauthorized(err)) {
        router.replace("/login");
      }
      throw err;
    }
  }

  async function handleCreate(input: TodoInput) {
    const created = await withSessionCheck(() => createTodo(input));
    setTodos((current) => [created, ...current]);
  }

  async function handleUpdate(id: number, patch: TodoPatch) {
    const updated = await withSessionCheck(() => updateTodo(id, patch));
    // On affiche la version renvoyée par Django : c'est elle qui fait foi.
    setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function handleDelete(id: number) {
    await withSessionCheck(() => deleteTodo(id));
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (loadState === "loading") {
    return <p className="py-12 text-center text-muted" role="status">Chargement…</p>;
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Alert message={errorMessage(loadError)} />
        <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    );
  }

  const remaining = todos.filter((todo) => !todo.completed).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes tâches</h1>
          <p className="text-sm text-muted">
            Bonjour {user?.username} · {remaining} restante{remaining > 1 ? "s" : ""} sur {todos.length}
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={handleLogout}>
          Se déconnecter
        </button>
      </header>

      <TodoForm onCreate={handleCreate} />

      {todos.length === 0 ? (
        <p className="py-8 text-center text-muted">Aucune tâche pour l&apos;instant. Ajoutez-en une ci-dessus.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}
