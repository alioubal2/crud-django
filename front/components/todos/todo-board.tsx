"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { useState } from "react";

import { STATUS_COLUMNS, STATUS_LABELS } from "@/lib/todo-utils";
import type { Todo, TodoStatus } from "@/lib/types";
import { TodoCardPreview } from "./todo-card";
import { TodoColumn } from "./todo-column";

type TodoBoardProps = {
  todos: Todo[];
  onCreate: (status: TodoStatus) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onMove: (todo: Todo, status: TodoStatus) => void;
};

// Tableau en colonnes avec glisser-déposer (@dnd-kit/core).
// DndContext suit le glisser ; chaque colonne est une zone de dépôt (useDroppable)
// et chaque carte un élément déplaçable (useDraggable).
export function TodoBoard({ todos, onCreate, onEdit, onDelete, onMove }: TodoBoardProps) {
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  const sensors = useSensors(
    // Souris : le glisser ne démarre qu'après 5 px, pour qu'un simple clic ouvre la carte.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Toucher : appui long, pour pouvoir encore faire défiler la page avec le doigt.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    // Clavier : Espace/Entrée pour saisir, flèches pour déplacer, Espace/Entrée pour déposer.
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveTodo(getTodo(event.active));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTodo(null);
    const todo = getTodo(event.active);
    const status = event.over?.id as TodoStatus | undefined;
    if (todo && status && status !== todo.status) {
      onMove(todo, status);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTodo(null)}
      accessibility={{ announcements, screenReaderInstructions }}
    >
      {/* Mobile : colonnes côte à côte avec défilement horizontal. Écran large : grille de 3. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {STATUS_COLUMNS.map(({ status, label }) => (
          <TodoColumn
            key={status}
            status={status}
            label={label}
            todos={todos.filter((todo) => todo.status === status)}
            onCreate={onCreate}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
      <DragOverlay>{activeTodo && <TodoCardPreview todo={activeTodo} />}</DragOverlay>
    </DndContext>
  );
}

function getTodo(item: Active | Over | null): Todo | null {
  return (item?.data.current?.todo as Todo | undefined) ?? null;
}

function cardTitle(active: Active): string {
  return getTodo(active)?.title ?? "";
}

function columnLabel(over: Over): string {
  return STATUS_LABELS[over.id as TodoStatus];
}

// Textes lus par les lecteurs d'écran (dnd-kit les fournit en anglais par défaut).
const screenReaderInstructions = {
  draggable:
    "Pour déplacer une tâche, appuyez sur Espace ou Entrée, utilisez les flèches pour changer de colonne, " +
    "puis Espace ou Entrée pour la déposer. Échap annule.",
};

const announcements: Announcements = {
  onDragStart: ({ active }) => `Tâche « ${cardTitle(active)} » saisie.`,
  onDragOver: ({ active, over }) =>
    over
      ? `Tâche « ${cardTitle(active)} » au-dessus de la colonne ${columnLabel(over)}.`
      : `Tâche « ${cardTitle(active)} » hors des colonnes.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `Tâche « ${cardTitle(active)} » déposée dans la colonne ${columnLabel(over)}.`
      : `Tâche « ${cardTitle(active)} » relâchée.`,
  onDragCancel: ({ active }) => `Déplacement de la tâche « ${cardTitle(active)} » annulé.`,
};
