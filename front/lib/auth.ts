import { apiFetch } from "./api";
import type { LoginPayload, RegisterPayload, User } from "./types";

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/api/auth/me/");
}

export function login(payload: LoginPayload): Promise<User> {
  return apiFetch<User>("/api/auth/login/", { method: "POST", body: payload });
}

export function register(payload: RegisterPayload): Promise<User> {
  return apiFetch<User>("/api/auth/register/", { method: "POST", body: payload });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout/", { method: "POST" });
}
