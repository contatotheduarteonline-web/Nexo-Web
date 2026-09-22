import { CatalogEdital, CatalogCargo, CatalogDiscipline, CatalogTopic } from "../types";

/**
 * Serviço do catálogo oficial de editais publicado no banco de dados do
 * servidor (PostgreSQL). Fonte da verdade do catálogo: um edital publicado
 * aqui aparece imediatamente como opção de plano para TODOS os usuários.
 */

export interface PublishedEditalSnapshot extends CatalogEdital {
  /** Snapshot completa de cargos, disciplinas e tópicos enviada no ato da publicação. */
  cargos?: (CatalogCargo & {
    disciplines: (CatalogDiscipline & { topics: CatalogTopic[] })[];
  })[];
}

/** Busca todos os editais publicados no catálogo oficial (banco do servidor). */
export async function fetchPublishedEditaisFromServer(): Promise<PublishedEditalSnapshot[]> {
  try {
    const res = await fetch("/api/catalog/published-editais");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.editais) ? (data.editais as PublishedEditalSnapshot[]) : [];
  } catch (err) {
    console.warn("[CATALOG DB] Não foi possível carregar editais do servidor:", err);
    return [];
  }
}

/**
 * Publica (upsert) um edital completo no catálogo oficial do servidor.
 * Lança erro com mensagem legível se a publicação falhar.
 */
export async function publishEditalToServer(
  edital: CatalogEdital,
  cargos: PublishedEditalSnapshot["cargos"]
): Promise<void> {
  let data: any = null;
  try {
    const res = await fetch("/api/catalog/published-editais", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edital, cargos }),
    });
    data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || `Falha ao publicar no catálogo oficial (HTTP ${res.status}).`);
    }
  } catch (err: any) {
    throw new Error(err?.message || "Falha ao publicar no catálogo oficial do servidor.");
  }
}
