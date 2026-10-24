import { ListTodo } from "lucide-react";

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ListTodo className="size-4.5" aria-hidden="true" />
      </span>
      <span className="font-semibold tracking-tight">Todo List</span>
    </div>
  );
}
