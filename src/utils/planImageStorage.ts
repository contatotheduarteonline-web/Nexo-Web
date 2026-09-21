/**
 * Plan Image Storage & Processing Utility for NEXO
 * Handles in-browser decoding, progressive compression (<180 KB, max 512x512, WebP/JPEG),
 * and Firestore subcollection persistence at: users/{uid}/planImages/{planId}
 */

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { StudyPlan } from "../types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessedImageResult {
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface SavePlanImageResult {
  success: boolean;
  dataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  error?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const CACHE_PREFIX = "nexo_plan_img_";

/**
 * Validates selected plan image format and size
 */
export function validatePlanImage(file: File | null | undefined): ValidationResult {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado." };
  }

  const mimeType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();
  const hasValidExt =
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".webp");

  if (!ALLOWED_MIME_TYPES.includes(mimeType) && !hasValidExt) {
    return {
      valid: false,
      error: "Formato não suportado. Selecione uma imagem JPG, PNG ou WebP.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Imagem muito grande. O limite máximo é de 5 MB.",
    };
  }

  return { valid: true };
}

/**
 * Decodes image using createImageBitmap with fallback to FileReader + HTMLImageElement
 */
async function decodeImage(
  file: File
): Promise<{ width: number; height: number; source: CanvasImageSource }> {
  // Method 1: createImageBitmap (fast, native, offscreen)
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      console.log("[PLAN IMAGE] decoded:", `${bitmap.width}x${bitmap.height} (via createImageBitmap)`);
      return { width: bitmap.width, height: bitmap.height, source: bitmap };
    } catch (bitmapErr) {
      console.warn(
        "[NEXO PLAN IMAGE] createImageBitmap falhou, acionando fallback FileReader + Image:",
        bitmapErr
      );
    }
  }

  // Method 2: FileReader + HTMLImageElement fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => {
      console.error("[NEXO PLAN IMAGE ERROR]: Falha ao ler arquivo via FileReader", err);
      reject(new Error("Não foi possível ler o arquivo de imagem."));
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = (err) => {
        console.error("[NEXO PLAN IMAGE ERROR]: Falha ao decodificar imagem via HTMLImageElement", err);
        reject(new Error("Não foi possível processar esta imagem. Tente novamente."));
      };
      img.onload = () => {
        console.log("[PLAN IMAGE] decoded:", `${img.width}x${img.height} (via Image element)`);
        resolve({ width: img.width, height: img.height, source: img });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Processes and compresses image file in browser:
 * - Resizes maintaining aspect ratio (max 512x512)
 * - Converts to WebP (with fallback to JPEG)
 * - Progressively optimizes to target < 180 KB
 */
export async function processAndCompressPlanImage(file: File): Promise<ProcessedImageResult> {
  const validation = validatePlanImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Arquivo de imagem inválido.");
  }

  console.log(
    "[PLAN IMAGE] selected:",
    file.name,
    `(${(file.size / 1024).toFixed(1)} KB, mime: ${file.type || "unknown"})`
  );

  const decoded = await decodeImage(file);
  const origWidth = decoded.width;
  const origHeight = decoded.height;

  // Max 512x512 maintaining aspect ratio
  const MAX_DIM = 512;
  let targetWidth = origWidth;
  let targetHeight = origHeight;

  if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
      targetWidth = MAX_DIM;
    } else {
      targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
      targetHeight = MAX_DIM;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) {
    throw new Error("Não foi possível inicializar o processador de imagem.");
  }

  // Draw smooth scaled image
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, 0, 0, targetWidth, targetHeight);

  // Close ImageBitmap if applicable to free memory
  if ("close" in decoded.source && typeof (decoded.source as any).close === "function") {
    try {
      (decoded.source as any).close();
    } catch {}
  }

  const exportCanvas = (mime: string, q: number): string | null => {
    try {
      return canvas.toDataURL(mime, q);
    } catch {
      return null;
    }
  };

  let chosenMime = "image/webp";
  let quality = 0.8;
  let dataUrl = exportCanvas("image/webp", quality);

  // Verify browser supported webp output
  if (!dataUrl || !dataUrl.startsWith("data:image/webp")) {
    chosenMime = "image/jpeg";
    dataUrl = exportCanvas("image/jpeg", quality);
  }

  if (!dataUrl) {
    throw new Error("Não foi possível processar esta imagem. Tente novamente.");
  }

  // Calculate size in bytes
  const getSizeBytes = (url: string) =>
    Math.round((url.length - url.indexOf(",") - 1) * 0.75);

  let sizeBytes = getSizeBytes(dataUrl);
  const TARGET_MAX_BYTES = 180 * 1024; // 180 KB target

  // Progressive compression steps
  const progressiveQualities = [0.75, 0.65, 0.55, 0.45];
  let qIdx = 0;
  while (sizeBytes > TARGET_MAX_BYTES && qIdx < progressiveQualities.length) {
    quality = progressiveQualities[qIdx];
    const candidate = exportCanvas(chosenMime, quality);
    if (candidate) {
      dataUrl = candidate;
      sizeBytes = getSizeBytes(dataUrl);
    }
    qIdx++;
  }

  // If still above 180 KB, scale down to 384x384
  if (sizeBytes > TARGET_MAX_BYTES) {
    const smallerMax = 384;
    let sW = targetWidth;
    let sH = targetHeight;
    if (sW > smallerMax || sH > smallerMax) {
      if (sW > sH) {
        sH = Math.round((sH * smallerMax) / sW);
        sW = smallerMax;
      } else {
        sW = Math.round((sW * smallerMax) / sH);
        sH = smallerMax;
      }
      const rescaleCanvas = document.createElement("canvas");
      rescaleCanvas.width = sW;
      rescaleCanvas.height = sH;
      const rescaleCtx = rescaleCanvas.getContext("2d");
      if (rescaleCtx) {
        rescaleCtx.imageSmoothingEnabled = true;
        rescaleCtx.imageSmoothingQuality = "high";
        rescaleCtx.drawImage(canvas, 0, 0, sW, sH);
        const candidate = rescaleCanvas.toDataURL(chosenMime, 0.7);
        if (candidate) {
          dataUrl = candidate;
          sizeBytes = getSizeBytes(dataUrl);
          targetWidth = sW;
          targetHeight = sH;
        }
      }
    }
  }

  console.log(
    "[PLAN IMAGE] compressed:",
    `${(sizeBytes / 1024).toFixed(1)} KB`,
    `(${chosenMime}, ${targetWidth}x${targetHeight}, q: ${quality.toFixed(2)})`
  );

  return {
    dataUrl,
    mimeType: chosenMime,
    sizeBytes,
    width: targetWidth,
    height: targetHeight,
  };
}

/**
 * Local Storage Cache Helpers for instant zero-latency rendering
 */
export function getCachedPlanImage(planId: string): string | null {
  if (typeof window === "undefined" || !planId) return null;
  try {
    return localStorage.getItem(CACHE_PREFIX + planId) || null;
  } catch {
    return null;
  }
}

export function setCachedPlanImage(planId: string, dataUrl: string | null): void {
  if (typeof window === "undefined" || !planId) return;
  try {
    if (dataUrl) {
      localStorage.setItem(CACHE_PREFIX + planId, dataUrl);
    } else {
      localStorage.removeItem(CACHE_PREFIX + planId);
    }
  } catch (err) {
    console.warn("[NEXO PLAN IMAGE] Falha ao atualizar cache local:", err);
  }
}

/**
 * Saves plan image directly into Firestore subcollection:
 * users/{uid}/planImages/{planId}
 */
export async function savePlanImageToFirestore(
  userId: string,
  planId: string,
  dataUrl: string,
  mimeType = "image/webp",
  sizeBytes?: number
): Promise<void> {
  if (!userId || !planId || !dataUrl) {
    throw new Error("Parâmetros inválidos para salvar a imagem do plano.");
  }

  const calculatedSize =
    sizeBytes ?? Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);

  try {
    const docRef = doc(db, "users", userId, "planImages", planId);
    await setDoc(
      docRef,
      {
        planId,
        dataUrl,
        mimeType,
        sizeBytes: calculatedSize,
        updatedAt: serverTimestamp(),
      },
      { merge: false } // Overwrite cleanly to avoid stale or duplicated entries
    );

    // Save in local storage cache for instant future loads
    setCachedPlanImage(planId, dataUrl);

    console.log("[PLAN IMAGE] saved:", planId, `(${(calculatedSize / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.error("[NEXO PLAN IMAGE ERROR]: Falha ao salvar no Firestore:", err?.message || err);
    throw new Error("Não foi possível salvar a imagem. Tente novamente.");
  }
}

/**
 * Deletes plan image document from Firestore subcollection:
 * users/{uid}/planImages/{planId}
 */
export async function deletePlanImageFromFirestore(
  userId: string,
  planId: string
): Promise<boolean> {
  if (!userId || !planId) return true;

  try {
    const docRef = doc(db, "users", userId, "planImages", planId);
    await deleteDoc(docRef);
    setCachedPlanImage(planId, null);
    console.log("[PLAN IMAGE] deleted:", planId);
    return true;
  } catch (err: any) {
    console.warn(
      "[NEXO PLAN IMAGE ERROR]: Falha ao excluir documento de imagem no Firestore:",
      err?.message || err
    );
    setCachedPlanImage(planId, null);
    return false;
  }
}

/**
 * Loads plan image from Firestore subcollection:
 * users/{uid}/planImages/{planId}
 */
export async function fetchPlanImageFromFirestore(
  userId: string,
  planId: string
): Promise<string | null> {
  if (!userId || !planId) return null;

  // Check local cache first for instant response
  const cached = getCachedPlanImage(planId);

  try {
    const docRef = doc(db, "users", userId, "planImages", planId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data?.dataUrl && typeof data.dataUrl === "string") {
        setCachedPlanImage(planId, data.dataUrl);
        const sizeKb = ((data.sizeBytes || data.dataUrl.length * 0.75) / 1024).toFixed(1);
        console.log("[PLAN IMAGE] loaded:", planId, `(${sizeKb} KB)`);
        return data.dataUrl;
      }
    }

    // Document does not exist in Firestore: clear cache if no custom image
    if (cached) {
      setCachedPlanImage(planId, null);
    }
    return null;
  } catch (err: any) {
    console.warn(
      "[NEXO PLAN IMAGE ERROR]: Falha ao carregar imagem do Firestore:",
      err?.message || err
    );
    // Return cached value if available on error/offline
    return cached;
  }
}

/**
 * Migrates legacy stored images (from old fields in plan object)
 * to the proper subcollection document at users/{uid}/planImages/{planId}.
 * Ignores ephemeral URLs like blob:, localhost, /api/storage/...
 */
export async function migrateLegacyPlanImage(
  userId: string,
  plan: StudyPlan
): Promise<string | null> {
  if (!userId || !plan?.id) return null;

  const candidates = [
    plan.imageUrl,
    (plan as any).imageData,
    (plan as any).imageBase64,
    (plan as any).image,
    (plan as any).planImage,
    (plan as any).imagePreview,
    plan.image_path,
  ];

  for (const val of candidates) {
    if (typeof val === "string" && val.startsWith("data:image/")) {
      console.log("[PLAN IMAGE] Imagem legada válida detectada, migrando para Firestore subcollection:", plan.id);
      try {
        const mime = val.substring(5, val.indexOf(";")) || "image/webp";
        await savePlanImageToFirestore(userId, plan.id, val, mime);
        return val;
      } catch (err) {
        console.warn("[NEXO PLAN IMAGE ERROR]: Falha ao migrar imagem legada:", err);
      }
    }
  }

  return null;
}

/**
 * Backward compatibility wrapper for upload
 */
export async function uploadPlanImage(
  file: File,
  planId: string,
  userId?: string
): Promise<{ success: boolean; image_path?: string; url?: string; error?: string }> {
  try {
    const processed = await processAndCompressPlanImage(file);
    if (userId) {
      await savePlanImageToFirestore(
        userId,
        planId,
        processed.dataUrl,
        processed.mimeType,
        processed.sizeBytes
      );
    }
    return {
      success: true,
      image_path: processed.dataUrl,
      url: processed.dataUrl,
    };
  } catch (err: any) {
    console.error("[NEXO PLAN IMAGE ERROR]:", err);
    return {
      success: false,
      error: err?.message || "Não foi possível processar a imagem. Tente novamente.",
    };
  }
}

/**
 * Backward compatibility wrapper for delete
 */
export async function deletePlanImage(
  imagePathOrPlanId: string,
  userId?: string
): Promise<boolean> {
  if (userId && imagePathOrPlanId) {
    return deletePlanImageFromFirestore(userId, imagePathOrPlanId);
  }
  return true;
}

/**
 * Resolves a stored image path or URL into a displayable browser src
 */
export function resolvePlanImageUrl(imagePathOrUrl?: string | null): string {
  if (!imagePathOrUrl) return "";
  if (
    imagePathOrUrl.startsWith("http://") ||
    imagePathOrUrl.startsWith("https://") ||
    imagePathOrUrl.startsWith("data:")
  ) {
    return imagePathOrUrl;
  }
  return "";
}
