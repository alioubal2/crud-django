import { ListTodo, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Todo } from "@/lib/types";
import { TodoItem } from "./todo-item";

type TodoListProps = {
  todos: Todo[];
  // Vrai si l'utilisateur a des tâches, même si les filtres les masquent toutes.
  hasTodos: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
  onToggle: (todo: Todo) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

export function TodoList({ todos, hasTodos, onCreate, onResetFilters, onToggle, onEdit, onDelete }: TodoListProps) {
  if (!hasTodos) {
    return (
      <EmptyState
        icon={<ListTodo aria-hidden="true" />}
        title="Aucune tâche pour l'instant"
        description="Ajoutez votre première tâche pour commencer à vous organiser."
        action={
          <Button onClick={onCreate}>
            <Plus aria-hidden="true" />
            Ajouter une tâche
          </Button>
        }
      />
    );
  }

  if (todos.length === 0) {
    return (
      <EmptyState
        icon={<Search aria-hidden="true" />}
        title="Aucun résultat"
        description="Aucune tâche ne correspond à votre recherche ou au filtre choisi."
        action={
          <Button variant="outline" onClick={onResetFilters}>
            Réinitialiser les filtres
          </Button>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
};

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        {icon}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TodoListSkeleton() {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Chargement des tâches">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <Skeleton className="size-4 rounded-[4px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
