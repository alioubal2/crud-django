// Couche d'accès à l'API Django : tous les appels HTTP passent par apiFetch.
// Elle centralise l'URL de base, les cookies, le jeton CSRF et les erreurs.

const UNSAFE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  // status vaut 0 quand le serveur n'a pas pu être joint (erreur réseau).
  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiFetch<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  // Django exige le jeton CSRF sur toute requête qui modifie des données.
  if (UNSAFE_METHODS.includes(method)) {
    headers["X-CSRFToken"] = await getCsrfToken();
  }

  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Envoie et reçoit les cookies (sessionid, csrftoken) malgré le changement de port.
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifiez que Django est démarré.");
  }

  // 204 No Content : succès sans corps, il n'y a rien à lire.
  if (response.status === 204) {
    return undefined as T;
  }

  // Le corps peut ne pas être du JSON (par exemple la page HTML d'erreur CSRF).
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(response.status, data);
  }
  return data as T;
}

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL n'est pas défini (voir front/.env.example).");
  }
  return url;
}

function readCookie(name: string): string | undefined {
  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.split("=")[1]) : undefined;
}

// Le cookie csrftoken est déposé par Django via GET /api/auth/csrf/.
// On le relit à chaque requête car Django le renouvelle à la connexion.
async function getCsrfToken(): Promise<string> {
  let token = readCookie("csrftoken");
  if (!token) {
    await apiFetch<void>("/api/auth/csrf/");
    token = readCookie("csrftoken");
  }
  return token ?? "";
}

// Traduit les formats d'erreur de DRF en un ApiError unique :
//   {"detail": "..."}                      -> erreur générale
//   {"title": ["..."], "email": ["..."]}   -> erreurs par champ
//   {"non_field_errors": ["..."]}          -> erreur de validation globale
function toApiError(status: number, data: unknown): ApiError {
  if (!data || typeof data !== "object") {
    return new ApiError(status, defaultMessage(status));
  }

  const body = data as Record<string, unknown>;
  if (typeof body.detail === "string") {
    return new ApiError(status, body.detail);
  }

  const fieldErrors: FieldErrors = {};
  for (const [field, messages] of Object.entries(body)) {
    if (Array.isArray(messages)) {
      fieldErrors[field] = messages.map(String);
    }
  }
  const message = fieldErrors.non_field_errors?.[0] ?? "Certains champs sont invalides.";
  return new ApiError(status, message, fieldErrors);
}

function defaultMessage(status: number): string {
  if (status === 401) return "Vous devez vous connecter.";
  if (status === 403) return "Action refusée. Rechargez la page puis réessayez.";
  if (status === 404) return "Élément introuvable.";
  if (status >= 500) return "Erreur du serveur. Réessayez plus tard.";
  return "La requête a échoué.";
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Une erreur inattendue est survenue.";
}
