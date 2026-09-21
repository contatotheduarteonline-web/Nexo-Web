/**
 * pdfReader.ts
 * Leitor client-side de PDF com extração paginada e cálculo nativo de hash SHA-256.
 * Preserva o mapeamento página -> texto sem mesclar tudo num bloco indistinto.
 */

import * as pdfjsLib from "pdfjs-dist";
import { PageText } from "./types";
import { normalizePdfText } from "./textNormalizer";

// Configura o worker do PDF.js para ambiente browser/Vite
if (typeof window !== "undefined") {
  try {
    // Utiliza worker compatível com a versão instalada do pdfjs-dist
    const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || "4.0.379"}/build/pdf.worker.min.mjs`;
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;
  } catch (e) {
    console.warn("[PDF READER] Aviso ao inicializar worker:", e);
  }
}

/**
 * Calcula o hash SHA-256 de um ArrayBuffer de arquivo usando a Web Crypto API nativa.
 */
export async function calculateSha256(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback rápido se subtle crypto não estiver disponível
  let hash = 0;
  const uint8 = new Uint8Array(buffer);
  for (let i = 0; i < uint8.length; i++) {
    hash = (hash << 5) - hash + uint8[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

export interface ReadPdfOptions {
  onProgress?: (current: number, total: number) => void;
  maxPages?: number;
}

export interface ReadPdfResult {
  pages: PageText[];
  sha256: string;
  totalPages: number;
}

/**
 * Lê o arquivo PDF página a página e extrai o texto estruturado com referências de página.
 */
export async function readPdfFile(
  file: File,
  options?: ReadPdfOptions
): Promise<ReadPdfResult> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. Calcula hash unívoco SHA-256 do arquivo original
  const sha256 = await calculateSha256(arrayBuffer);

  // 2. Carrega documento no PDF.js
  const loadingTask = (pdfjsLib as any).getDocument({
    data: arrayBuffer,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const pagesToRead = options?.maxPages
    ? Math.min(options.maxPages, totalPages)
    : totalPages;

  const pages: PageText[] = [];

  for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Junta itens preservando quebras de linha razoáveis
      let lastY: number | null = null;
      let pageStr = "";

      for (const item of textContent.items as any[]) {
        if (!item || !("str" in item)) continue;
        const str = item.str || "";
        const y = item.transform ? item.transform[5] : null;

        if (lastY !== null && y !== null && Math.abs(lastY - y) > 6) {
          pageStr += "\n" + str;
        } else {
          pageStr += (pageStr.endsWith(" ") || str.startsWith(" ") ? "" : " ") + str;
        }
        lastY = y;
      }

      pages.push({
        pageNumber: pageNum,
        text: normalizePdfText(pageStr),
      });

      if (options?.onProgress) {
        options.onProgress(pageNum, pagesToRead);
      }
    } catch (pageErr) {
      console.warn(`[PDF READER] Erro ao processar página ${pageNum}:`, pageErr);
      pages.push({
        pageNumber: pageNum,
        text: "",
      });
    }
  }

  return {
    pages,
    sha256,
    totalPages,
  };
}
