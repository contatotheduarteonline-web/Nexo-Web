import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ override: true });

export interface StorageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Returns a singleton instance of the Supabase Admin client
 * Configured with SUPABASE_URL and SUPABASE_SECRET_KEY for server-side operations
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdminClient;
}

/**
 * Validates whether a given string is a supported image format and size
 */
export function validateAvatarInput(input: string): { valid: boolean; error?: string; isDataUri: boolean } {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Imagem não fornecida.", isDataUri: false };
  }

  const trimmed = input.trim();

  // If it's a web URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { valid: true, isDataUri: false };
  }

  // If it's a data URI
  if (trimmed.startsWith("data:image/")) {
    const match = trimmed.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      return { valid: false, error: "Formato de dados base64 inválido.", isDataUri: true };
    }

    const format = match[1].toLowerCase();
    const allowed = ["jpeg", "jpg", "png", "webp", "gif", "svg+xml"];
    if (!allowed.includes(format)) {
      return { valid: false, error: "Formato de imagem não suportado. Use JPG, PNG ou WebP.", isDataUri: true };
    }

    // Check size in bytes (approx base64 length * 0.75)
    const base64Content = match[2];
    const estimatedSizeBytes = Math.round((base64Content.length * 3) / 4);
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (estimatedSizeBytes > maxSizeBytes) {
      return { valid: false, error: "A imagem excede o tamanho máximo permitido de 5MB.", isDataUri: true };
    }

    return { valid: true, isDataUri: true };
  }

  return { valid: false, error: "Formato de imagem ou URL não reconhecido.", isDataUri: false };
}

/**
 * Upload an avatar to Supabase Storage (Bucket: avatars) using the official SDK
 */
export async function uploadAvatarToStorage(
  userId: string,
  base64DataUri: string
): Promise<StorageUploadResult> {
  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "avatars";

  if (!supabase) {
    console.error("[SUPABASE STORAGE] Cliente Supabase não pôde ser inicializado. Verifique SUPABASE_URL e SUPABASE_SECRET_KEY.");
    return {
      success: false,
      error: "Serviço de armazenamento não configurado no servidor.",
    };
  }

  try {
    const match = base64DataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      return { success: false, error: "Formato de base64 inválido." };
    }

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === "jpeg" || rawExt === "jpg" ? "jpg" : rawExt === "webp" ? "webp" : "png";
    const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    const buffer = Buffer.from(match[2], "base64");

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${cleanUserId}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error || !data) {
      console.error("[SUPABASE STORAGE] Falha no upload:", error?.message || "Erro desconhecido");
      return {
        success: false,
        error: error?.message || "Falha ao gravar arquivo no Supabase Storage.",
      };
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path || fileName);
    const publicUrl = publicUrlData.publicUrl;

    console.log(`[SUPABASE STORAGE] Foto de perfil enviada com sucesso para o bucket '${bucketName}': ${fileName}`);
    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("[SUPABASE STORAGE] Exceção durante upload:", err?.message || "Erro desconhecido");
    return { success: false, error: err?.message || "Erro inesperado ao processar upload." };
  }
}

/**
 * Safely delete an old avatar from Supabase Storage after a new one is persisted
 */
export async function deleteAvatarFromStorage(fileUrlOrPath: string): Promise<void> {
  if (!fileUrlOrPath) return;

  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "avatars";
  if (!supabase) return;

  try {
    // Check if the URL points to our supabase storage bucket
    const bucketMarker = `/storage/v1/object/public/${bucketName}/`;
    if (fileUrlOrPath.includes(bucketMarker)) {
      const fileName = fileUrlOrPath.split(bucketMarker)[1];
      if (fileName) {
        await supabase.storage.from(bucketName).remove([fileName]);
        console.log(`[SUPABASE STORAGE] Avatar anterior excluído com sucesso: ${fileName}`);
      }
    }
  } catch (err: any) {
    console.warn("[SUPABASE STORAGE] Aviso ao limpar avatar antigo:", err?.message || "Erro desconhecido");
  }
}

/**
 * Centralized Avatar Storage Processor for Supabase & PostgreSQL
 * Returns { success: true, url: string } ONLY if the storage upload or URL validation succeeded
 */
export async function processAvatarStorage(
  userId: string,
  rawInput: string
): Promise<{ success: boolean; url: string; error?: string }> {
  if (!rawInput || !rawInput.trim()) {
    return { success: true, url: "" };
  }

  const validation = validateAvatarInput(rawInput);
  if (!validation.valid) {
    return { success: false, url: "", error: validation.error || "Arquivo de imagem inválido." };
  }

  const trimmed = rawInput.trim();

  // If already an external HTTPS/HTTP URL (e.g. preset avatars)
  if (!validation.isDataUri) {
    return { success: true, url: trimmed };
  }

  // Upload Base64 image directly to Supabase Storage
  const uploadResult = await uploadAvatarToStorage(userId, trimmed);
  if (!uploadResult.success || !uploadResult.url) {
    return {
      success: false,
      url: "",
      error: uploadResult.error || "Não foi possível salvar a foto no Supabase Storage.",
    };
  }

  return { success: true, url: uploadResult.url };
}
