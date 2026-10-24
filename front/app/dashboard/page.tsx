import type { Metadata } from "next";

import { TodoDashboard } from "@/components/todos/todo-dashboard";

export const metadata: Metadata = {
  title: "Mes tâches",
};

export default function DashboardPage() {
  return <TodoDashboard />;
}
