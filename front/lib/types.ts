// Types partagés : ils reflètent exactement le JSON renvoyé par l'API Django.

export type User = {
  id: number;
  email: string;
  username: string;
};

export type Priority = "low" | "normal" | "high";

// Colonne du tableau dans laquelle se trouve la tâche.
export type TodoStatus = "todo" | "in_progress" | "done";

export type Todo = {
  id: number;
  title: string;
  description: string;
  status: TodoStatus;
  priority: Priority;
  // Date au format "AAAA-MM-JJ", ou null si aucune échéance.
  due_date: string | null;
  created_at: string;
  updated_at: string;
  owner: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  username: string;
};

export type TodoInput = Pick<Todo, "title" | "description" | "status" | "priority" | "due_date">;

// Pour PATCH : on n'envoie que les champs modifiés.
export type TodoPatch = Partial<TodoInput>;

// code : les 6 chiffres affichés dans le terminal du serveur Django.
export type PasswordResetCodePayload = {
  email: string;
  code: string;
};
