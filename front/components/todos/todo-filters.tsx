"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TodoFilter } from "@/lib/todo-utils";

type TodoFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TodoFilter;
  onFilterChange: (value: TodoFilter) => void;
};

export function TodoFilters({ search, onSearchChange, filter, onFilterChange }: TodoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher une tâche…"
          aria-label="Rechercher une tâche"
          className="pl-8"
        />
      </div>
      {/* Tabs sert ici de sélecteur de filtre : pas de TabsContent, la liste est filtrée en amont. */}
      <Tabs value={filter} onValueChange={(value) => onFilterChange(value as TodoFilter)}>
        <TabsList aria-label="Filtrer les tâches">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="active">À faire</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
