// Types partagés : ils reflètent exactement le JSON renvoyé par l'API Django.

export type User = {
  id: number;
  email: string;
  username: string;
};

export type Todo = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
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

export type TodoInput = {
  title: string;
  description: string;
};

// Pour PATCH : on n'envoie que les champs modifiés.
export type TodoPatch = Partial<Pick<Todo, "title" | "description" | "completed">>;
