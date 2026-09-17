import type { HistoryDTO, ProductDTO, ProductInput, Stats } from "@/lib/inventory";
import type { SettingsDTO } from "@/lib/settings";
import type { WriteOffReason } from "@/lib/domain";

export class UnauthorizedClientError extends Error {
  constructor() {
    super("unauthorized");
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });

  if (response.status === 401) throw new UnauthorizedClientError();
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export type AppState = { settings: SettingsDTO; products: ProductDTO[] };

export const api = {
  state: () => apiFetch<AppState>("/api/state"),
  archivedProducts: () => apiFetch<ProductDTO[]>("/api/products?archived=1"),
  history: () => apiFetch<HistoryDTO[]>("/api/history"),
  stats: () => apiFetch<Stats>("/api/stats"),

  createProduct: (input: ProductInput) =>
    apiFetch<ProductDTO>("/api/products", { method: "POST", body: JSON.stringify(input) }),
  updateProduct: (id: string, input: ProductInput) =>
    apiFetch<ProductDTO>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  adjust: (id: string, delta: number) =>
    apiFetch<ProductDTO>(`/api/products/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify({ delta }),
    }),
  writeOff: (id: string, amount: number, reason: WriteOffReason) =>
    apiFetch<ProductDTO>(`/api/products/${id}/write-off`, {
      method: "POST",
      body: JSON.stringify({ amount, reason }),
    }),
  archive: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/products/${id}/archive`, { method: "POST" }),
  restore: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/products/${id}/archive`, { method: "DELETE" }),
  remove: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),

  updateSettings: (patch: Partial<SettingsDTO>) =>
    apiFetch<SettingsDTO>("/api/settings", { method: "PUT", body: JSON.stringify(patch) }),

  login: (code: string) =>
    apiFetch<{ ok: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  logout: () => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};
