const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);

    throw new Error(
      erro?.message ?? "Erro ao comunicar com o servidor."
    );
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}