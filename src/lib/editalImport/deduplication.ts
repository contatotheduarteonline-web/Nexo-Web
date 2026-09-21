/**
 * deduplication.ts
 * Motor de checagem em 2 camadas contra duplicidade e controle de versões de editais.
 */

import { CatalogEdital, Edital } from "../../types";
import { generateNormalizedIdentity } from "./textNormalizer";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: "none" | "hash" | "identity";
  existingEdital?: CatalogEdital | Edital;
  message?: string;
  nextVersion?: number;
}

export interface CandidateEditalIdentity {
  institution?: string;
  acronym?: string;
  uf?: string;
  board?: string;
  year?: number | string;
  title?: string;
  sourceHash?: string;
}

/**
 * Realiza checagem em duas camadas:
 * 1. Hash SHA-256 do arquivo original (duplicidade exata)
 * 2. Identidade normalizada do certame (possível retificação / nova versão)
 */
export function checkEditalDuplication(
  candidate: CandidateEditalIdentity,
  existingCatalog: (CatalogEdital | Edital)[]
): DuplicateCheckResult {
  if (!existingCatalog || existingCatalog.length === 0) {
    return { isDuplicate: false, matchType: "none" };
  }

  // Camada 1: Hash SHA-256 idêntico
  if (candidate.sourceHash) {
    const hashMatch = existingCatalog.find((item) => {
      const existingHash = (item as CatalogEdital).sourceHash || (item as any).sourceHash;
      return existingHash && existingHash.toLowerCase() === candidate.sourceHash?.toLowerCase();
    });

    if (hashMatch) {
      return {
        isDuplicate: true,
        matchType: "hash",
        existingEdital: hashMatch,
        message: "Este documento já está cadastrado no sistema.",
      };
    }
  }

  // Camada 2: Identidade normalizada (Órgão + Sigla + UF + Banca + Ano)
  const candidateIdentity = generateNormalizedIdentity(candidate);
  if (!candidateIdentity) {
    return { isDuplicate: false, matchType: "none" };
  }

  const identityMatch = existingCatalog.find((item) => {
    const itemIdentity =
      (item as any).normalizedIdentity ||
      generateNormalizedIdentity({
        institution: (item as any).institution || (item as any).organ,
        acronym: (item as any).acronym,
        uf: (item as any).state || (item as any).uf,
        board: (item as any).board || (item as any).banca,
        year: item.year,
        title: item.title,
      });

    return itemIdentity && itemIdentity === candidateIdentity;
  });

  if (identityMatch) {
    const currentVersion = (identityMatch as any).version || 1;
    return {
      isDuplicate: true,
      matchType: "identity",
      existingEdital: identityMatch,
      nextVersion: currentVersion + 1,
      message: "Encontramos um possível edital já cadastrado para este certame.",
    };
  }

  return { isDuplicate: false, matchType: "none" };
}
