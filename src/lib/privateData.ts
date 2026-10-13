import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Production must point to a private persistent disk, never the container layer.
const configuredDirectory = process.env.NEXO_DATA_DIR;
if (process.env.NODE_ENV === "production" && (!configuredDirectory || !path.isAbsolute(configuredDirectory))) {
  throw new Error("Defina NEXO_DATA_DIR como caminho absoluto de um volume privado persistente antes de iniciar em produção.");
}
export const PRIVATE_DATA_ROOT = path.resolve(configuredDirectory || path.join(process.cwd(), "data"));
if (process.env.NODE_ENV === "production" && (PRIVATE_DATA_ROOT === process.cwd() || PRIVATE_DATA_ROOT.startsWith(`${process.cwd()}${path.sep}`))) {
  throw new Error("NEXO_DATA_DIR deve ficar fora do diretório do código e dos arquivos públicos.");
}
fs.mkdirSync(PRIVATE_DATA_ROOT, { recursive: true, mode: 0o700 });

export function readPrivateJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    // Do not continue with an empty store and overwrite an unreadable database.
    throw new Error(`Não foi possível ler ${path.basename(file)}. Restaure a cópia privada antes de continuar.`);
  }
}

export function writePrivateJson(file: string, value: unknown): void {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600, flag: "wx" });
    fs.renameSync(temporary, file);
  } catch {
    throw new Error(`Não foi possível persistir ${path.basename(file)} no armazenamento privado.`);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function readPrivateRecords<T extends { id: string }>(file: string, key: keyof T): T[] {
  const records = readPrivateJson<T[]>(file, []);
  const keys = new Set<string>();
  const ids = new Set<string>();
  if (!Array.isArray(records)) throw new Error(`Formato inválido em ${path.basename(file)}.`);
  for (const record of records) {
    const value = record && record[key];
    const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!record?.id || !normalized || keys.has(normalized) || ids.has(record.id)) {
      throw new Error(`Registros inválidos ou duplicados em ${path.basename(file)}. Preserve o arquivo e revise a cópia privada.`);
    }
    keys.add(normalized);
    ids.add(record.id);
  }
  return records;
}
