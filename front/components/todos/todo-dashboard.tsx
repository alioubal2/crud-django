"use client";

import { AlertCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, isUnauthorized } from "@/lib/api";
import { getCurrentUser, logout } from "@/lib/auth";
import { computeStats, filterTodos, type TodoFilter } from "@/lib/todo-utils";
import { createTodo, deleteTodo, listTodos, updateTodo } from "@/lib/todos";
import type { Todo, TodoInput, User } from "@/lib/types";
import { DeleteTodoDialog } from "./delete-todo-dialog";
import { TodoFilters } from "./todo-filters";
import { TodoFormDialog } from "./todo-form-dialog";
import { TodoList, TodoListSkeleton } from "./todo-list";
import { TodoStats } from "./todo-stats";

type LoadState = "loading" | "ready" | "error";

// Composant « chef d'orchestre » : il détient les données et appelle l'API.
// Les composants enfants ne font qu'afficher et remonter des événements.
export function TodoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedTodo, setEditedTodo] = useState<Todo | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);

  // Chargement initial (et nouvel essai quand reloadKey change). Si Django
  // répond 401, la session est absente ou expirée : retour à /login. La vraie
  // protection reste côté Django, cette redirection n'est qu'un confort.
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
    return () => {
      ignore = true;
    };
  }, [router, reloadKey]);

  function retry() {
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  }

  // Redirige vers /login si la session a expiré, puis relance l'erreur
  // pour que l'appelant puisse l'afficher.
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

  // La version renvoyée par Django fait foi : on remplace la tâche locale par elle.
  function replaceTodo(updated: Todo) {
    setTodos((current) => current.map((todo) => (todo.id === updated.id ? updated : todo)));
  }

  function openCreateForm() {
    setEditedTodo(null);
    setIsFormOpen(true);
  }

  function openEditForm(todo: Todo) {
    setEditedTodo(todo);
    setIsFormOpen(true);
  }

  async function handleSubmitForm(input: TodoInput) {
    if (editedTodo) {
      replaceTodo(await withSessionCheck(() => updateTodo(editedTodo.id, input)));
      toast.success("Tâche modifiée");
    } else {
      const created = await withSessionCheck(() => createTodo(input));
      setTodos((current) => [created, ...current]);
      toast.success("Tâche ajoutée");
    }
    setIsFormOpen(false);
  }

  async function handleToggle(todo: Todo) {
    try {
      replaceTodo(await withSessionCheck(() => updateTodo(todo.id, { completed: !todo.completed })));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleConfirmDelete(todo: Todo) {
    try {
      await withSessionCheck(() => deleteTodo(todo.id));
      setTodos((current) => current.filter((item) => item.id !== todo.id));
      toast.success("Tâche supprimée");
    } catch (err) {
      toast.error(errorMessage(err));
    }
    setTodoToDelete(null);
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  function resetFilters() {
    setSearch("");
    setFilter("all");
  }

  // Valeurs dérivées : recalculées à chaque rendu à partir des vraies données.
  const stats = computeStats(todos);
  const visibleTodos = filterTodos(todos, filter, search);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} onLogout={handleLogout} />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mes tâches</h1>
            <p className="mt-1 text-sm text-muted-foreground">Organisez votre journée, une tâche à la fois.</p>
          </div>
          <Button size="lg" onClick={openCreateForm} disabled={loadState !== "ready"}>
            <Plus aria-hidden="true" />
            Nouvelle tâche
          </Button>
        </div>

        {loadState === "loading" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-[74px] rounded-xl" />
              ))}
            </div>
            <TodoListSkeleton />
          </>
        )}

        {loadState === "error" && (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center">
            <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
            <div>
              <p className="font-medium">Impossible de charger vos tâches</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage(loadError)}</p>
            </div>
            <Button variant="outline" onClick={retry}>
              Réessayer
            </Button>
          </div>
        )}

        {loadState === "ready" && (
          <>
            <TodoStats {...stats} />
            <TodoFilters search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} />
            <TodoList
              todos={visibleTodos}
              hasTodos={todos.length > 0}
              onCreate={openCreateForm}
              onResetFilters={resetFilters}
              onToggle={handleToggle}
              onEdit={openEditForm}
              onDelete={setTodoToDelete}
            />
          </>
        )}
      </main>

      <TodoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} todo={editedTodo} onSubmit={handleSubmitForm} />
      <DeleteTodoDialog
        todo={todoToDelete}
        onOpenChange={(open) => !open && setTodoToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
