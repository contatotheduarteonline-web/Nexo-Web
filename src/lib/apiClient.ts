import { auth } from "./firebase";

/**
 * Headers com o token Firebase da sessão atual, usados pela autorização
 * server-side (Firebase Admin). Nenhum dado de identidade do cliente
 * (userId/email/role) é confiável para autorização — o servidor valida
 * o token no cabeçalho Authorization.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** fetch que anexa automaticamente o token Firebase quando há sessão ativa. */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...authHeaders,
    },
  });
}
