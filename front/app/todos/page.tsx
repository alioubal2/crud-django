import type { Metadata } from "next";

import { TodoDashboard } from "@/components/todos/TodoDashboard";

export const metadata: Metadata = {
  title: "Mes tâches",
};

export default function TodosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <TodoDashboard />
    </main>
  );
}
