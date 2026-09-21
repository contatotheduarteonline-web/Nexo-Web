/**
 * Utility functions for parsing multiple file formats (PDF, DOC/DOCX, XLS/XLSX, CSV, TXT)
 * and extracting structured study plan disciplines and topics.
 * Designed with full client-side fallbacks for static SPA hosting.
 */

export interface ExtractedTopic {
  name: string;
  subtopics: string[];
}

export interface ExtractedDiscipline {
  name: string;
  color?: string;
  priority?: "alta" | "media" | "baixa";
  difficulty?: "facil" | "medio" | "dificil";
  weight?: number;
  targetHours?: number;
  topics: ExtractedTopic[];
}

export interface ExtractedPlanResult {
  planName: string;
  organ?: string;
  cargo?: string;
  banca?: string;
  category?: string;
  examDate?: string;
  disciplines: ExtractedDiscipline[];
}

/**
 * Converts a browser File object to a Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a text file directly in browser as fallback
 */
export function readTextFileClient(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve((reader.result as string) || "");
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Heuristic client-side extractor for edital text when backend AI is offline
 */
export function parseEditalTextHeuristic(text: string, fileName: string, organHint?: string): ExtractedPlanResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const disciplines: ExtractedDiscipline[] = [];
  let currentDisc: ExtractedDiscipline | null = null;

  const commonDisciplines = [
    "DIREITO CONSTITUCIONAL",
    "DIREITO ADMINISTRATIVO",
    "DIREITO PENAL",
    "DIREITO PROCESSUAL PENAL",
    "DIREITO CIVIL",
    "DIREITO PROCESSUAL CIVIL",
    "DIREITO TRIBUTÁRIO",
    "LÍNGUA PORTUGUESA",
    "PORTUGUÊS",
    "RACIOCÍNIO LÓGICO",
    "RACIOCÍNIO LÓGICO-MATEMÁTICO",
    "INFORMÁTICA",
    "LEGISLAÇÃO ESPECIAL",
    "DIREITOS HUMANOS",
    "CONTABILIDADE GERAL",
    "ADMINISTRAÇÃO PÚBLICA",
    "ÉTICA NO SERVIÇO PÚBLICO",
    "ATUALIDADES",
  ];

  for (const line of lines) {
    const upper = line.toUpperCase();
    const isKeyword = commonDisciplines.some((k) => upper.includes(k) && upper.length < 60);
    const isTitleLine =
      isKeyword ||
      /^(DISCIPLINA|MATÉRIA|CONHECIMENTOS\s+(BÁSICOS|ESPECÍFICOS))\s*[:\-]/i.test(line);

    if (isTitleLine || (line.length < 45 && line === line.toUpperCase() && !line.includes("."))) {
      currentDisc = {
        name: line.replace(/^(DISCIPLINA|MATÉRIA)\s*[:\-]\s*/i, "").trim(),
        priority: "alta",
        difficulty: "medio",
        topics: [],
      };
      disciplines.push(currentDisc);
    } else if (currentDisc) {
      // Split topics by punctuation or numbering
      const parts = line.split(/[;\n]/).map((p) => p.trim()).filter((p) => p.length > 2);
      for (const p of parts) {
        currentDisc.topics.push({
          name: p.replace(/^[\d\.\-\*•]+\s*/, "").trim(),
          subtopics: [],
        });
      }
    }
  }

  if (disciplines.length === 0) {
    disciplines.push({
      name: "Conhecimentos do Edital",
      priority: "alta",
      difficulty: "medio",
      topics: lines.slice(0, 20).map((l) => ({
        name: l.slice(0, 100).replace(/^[\d\.\-\*•]+\s*/, "").trim(),
        subtopics: [],
      })),
    });
  }

  return {
    planName: fileName.replace(/\.[^/.]+$/, "") || "Plano de Estudos",
    organ: organHint || "Concurso Público",
    disciplines,
  };
}

/**
 * Extracts raw text from a multi-format file via backend parsing API with client-side fallback
 */
export async function parseFileToText(file: File): Promise<{
  text: string;
  fileName: string;
  format: string;
  characterCount: number;
}> {
  if (!file) {
    throw new Error("Nenhum arquivo fornecido para análise.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isPlainDoc = ext === "txt" || ext === "csv" || file.type.startsWith("text/");

  try {
    const base64Data = await fileToBase64(file);

    const response = await fetch("/api/planos/parse-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataBase64: base64Data,
      }),
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data.success && data.text) {
        return {
          text: data.text,
          fileName: data.fileName,
          format: data.format,
          characterCount: data.characterCount,
        };
      }
    }

    // Client fallback for text/csv
    if (isPlainDoc) {
      const clientText = await readTextFileClient(file);
      if (clientText.trim()) {
        return {
          text: clientText,
          fileName: file.name,
          format: ext.toUpperCase() || "TXT",
          characterCount: clientText.length,
        };
      }
    }

    throw new Error(
      "O processamento automático de PDF/DOCX requer o serviço de backend. Recomendamos exportar o arquivo para TXT/CSV ou colar o texto diretamente no sistema."
    );
  } catch (err: any) {
    if (isPlainDoc) {
      try {
        const fallbackText = await readTextFileClient(file);
        if (fallbackText.trim()) {
          return {
            text: fallbackText,
            fileName: file.name,
            format: ext.toUpperCase() || "TXT",
            characterCount: fallbackText.length,
          };
        }
      } catch {
        // continue
      }
    }
    throw err;
  }
}

/**
 * Calls backend AI/Heuristic generator to extract structured disciplines & topics from raw edital text
 * with automatic client-side heuristic fallback when running in static mode
 */
export async function generatePlanFromEditalText(params: {
  text: string;
  fileName: string;
  categoryHint?: string;
  organHint?: string;
}): Promise<ExtractedPlanResult> {
  try {
    const response = await fetch("/api/planos/generate-from-edital", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch {
    // Proceed to client heuristic fallback
  }

  // Graceful client heuristic fallback
  return parseEditalTextHeuristic(params.text, params.fileName, params.organHint);
}
