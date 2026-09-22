import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { execSync } from "child_process";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as xlsx from "xlsx";
import mammoth from "mammoth";
// @ts-ignore
import * as pdfParseModule from "pdf-parse";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { prisma, testDatabaseConnection, isDatabaseConnected } from "./src/lib/prisma";
import { SEED_TEMPLATES } from "./src/data/seedTemplates";
import { processAvatarStorage, deleteAvatarFromStorage } from "./src/lib/storage";

dotenv.config({ override: true });

// Helper to safely extract text from a PDF Buffer with support for both pdf-parse class (v2+) and legacy function (v1)
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Check for PDFParse class in v2+
  const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
  if (typeof PDFParseClass === "function") {
    const parser = new PDFParseClass({ data: buffer });
    try {
      const result = await parser.getText();
      const text = typeof result === "string" ? result : result?.text || "";
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
      return text;
    } catch (parseErr: any) {
      console.warn("[PDFParse class failed, trying fallback]:", parseErr?.message);
    }
  }

  // Check for callable function (v1 or default export)
  const callableParse =
    typeof (pdfParseModule as any).default === "function"
      ? (pdfParseModule as any).default
      : typeof pdfParseModule === "function"
      ? pdfParseModule
      : null;

  if (typeof callableParse === "function") {
    const result = await callableParse(buffer);
    return typeof result === "string" ? result : result?.text || "";
  }

  // Fallback text stream extraction if PDF structure has plain text streams
  const rawString = buffer.toString("latin1");
  const streamMatches = rawString.match(/BT[\s\S]*?ET/g);
  if (streamMatches && streamMatches.length > 0) {
    const extractedWords: string[] = [];
    for (const stream of streamMatches) {
      const tjMatches = stream.match(/\((.*?)\)\s*Tj/g) || stream.match(/\[(.*?)\]\s*TJ/g);
      if (tjMatches) {
        for (const m of tjMatches) {
          const clean = m.replace(/[\(\)\[\]]|Tj|TJ/g, "").trim();
          if (clean) extractedWords.push(clean);
        }
      }
    }
    if (extractedWords.length > 0) {
      return extractedWords.join(" ");
    }
  }

  throw new Error("Não foi possível inicializar o leitor de PDF (biblioteca ou formato não compatível).");
}

const app = express();

// Bolt reserves port 9091 for its own MCP proxy infrastructure.
// If PORT is unset or points to 9091, fall back to 3000 so the dev server
// can start without conflicting with the Bolt preview environment.
const BOLT_RESERVED_PORT = 9091;
const requestedPort = Number(process.env.PORT) || 3000;
const PORT = requestedPort === BOLT_RESERVED_PORT ? 3000 : requestedPort;

let isServerReady = false;
let isShuttingDown = false;

app.use(express.json({ limit: "15mb" }));

// Pre-flight middleware for all API routes: Ensures JSON response even during initialization or shutdown
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.setHeader("Content-Type", "application/json");
    if (isShuttingDown) {
      return res.status(503).json({ error: "Service temporarily unavailable during shutdown", retryAfter: 2 });
    }
    if (!isServerReady) {
      return res.status(503).json({ error: "Service initializing, please retry", retryAfter: 1 });
    }
  }
  next();
});

// Storage directory setup for bucket: plan-images
const STORAGE_ROOT = path.join(process.cwd(), "data", "storage", "plan-images");
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

// Daily automated backups directory setup
const BACKUPS_ROOT = path.join(process.cwd(), "data", "backups", "daily");
if (!fs.existsSync(BACKUPS_ROOT)) {
  fs.mkdirSync(BACKUPS_ROOT, { recursive: true });
}

// In-Memory Rate Limiter Map (IP -> { count, resetAt })
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitEntry>();

function createRateLimiter(maxRequests: number, windowMs: number, errorMessage: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key as string);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key as string, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        error: errorMessage,
        retryAfter: retryAfterSec,
      });
    }

    entry.count += 1;
    next();
  };
}

// Security rate limiters:
// Auth endpoints: 20 requests per minute
const authRateLimiter = createRateLimiter(20, 60 * 1000, "Muitas tentativas de autenticação. Por favor, aguarde um minuto.");
// Password recovery: 5 requests per 5 minutes
const recoveryRateLimiter = createRateLimiter(5, 5 * 60 * 1000, "Muitas solicitações de recuperação de senha. Aguarde alguns minutos.");
// AI analysis endpoints: 30 requests per minute
const aiRateLimiter = createRateLimiter(30, 60 * 1000, "Limite de requisições de Inteligência Artificial atingido. Aguarde um momento.");

// Periodic sweep for expired rate limits & recovery codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  for (const [email, entry] of recoveryCodesStore.entries()) {
    if (now > entry.expiresAt) {
      recoveryCodesStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Storage API Endpoint: Serve Legacy or Cached Avatar Image
app.get("/api/storage/avatars/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const cleanFilename = path.basename(filename);
    const legacyPath = path.join(process.cwd(), "data", "storage", "avatars", cleanFilename);

    if (!fs.existsSync(legacyPath)) {
      return res.status(404).json({ error: "Foto de perfil não encontrada." });
    }

    const ext = path.extname(cleanFilename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };

    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const stream = fs.createReadStream(legacyPath);
    return stream.pipe(res);
  } catch (error: any) {
    console.error("Erro ao servir foto de perfil:", error);
    return res.status(500).json({ error: "Erro ao processar imagem." });
  }
});

// Storage API Endpoint: Upload Plan Image
app.post("/api/storage/plan-images/upload", async (req, res) => {
  try {
    const { userId = "user-default", planId, dataBase64, mimeType } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Identificador do plano é obrigatório." });
    }

    if (!dataBase64) {
      return res.status(400).json({ error: "Arquivo de imagem não fornecido." });
    }

    const allowedMimeTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const cleanMime = (mimeType || "").toLowerCase();
    const ext = allowedMimeTypes[cleanMime];
    if (!ext) {
      return res.status(400).json({
        error: "Formato inválido. Apenas imagens JPG, PNG ou WebP são permitidas.",
      });
    }

    // Extract base64 buffer
    const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Size limit: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        error: "A imagem excede o tamanho máximo de 5MB.",
      });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanPlanId = String(planId).replace(/[^a-zA-Z0-9_-]/g, "");
    const fileUuid = crypto.randomUUID();
    const fileName = `${fileUuid}.${ext}`;

    const userPlanDir = path.join(STORAGE_ROOT, cleanUserId, cleanPlanId);
    if (!fs.existsSync(userPlanDir)) {
      fs.mkdirSync(userPlanDir, { recursive: true });
    }

    const filePath = path.join(userPlanDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const image_path = `${cleanUserId}/${cleanPlanId}/${fileName}`;
    const url = `/api/storage/plan-images/${cleanUserId}/${cleanPlanId}/${fileName}`;

    return res.json({
      success: true,
      image_path,
      url,
    });
  } catch (error: any) {
    console.error("Erro no upload da imagem do plano:", error);
    return res.status(500).json({ error: "Não foi possível enviar a imagem. Tente novamente." });
  }
});

// Storage API Endpoint: Serve Plan Image
app.get("/api/storage/plan-images/:userId/:planId/:filename", (req, res) => {
  try {
    const { userId, planId, filename } = req.params;
    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanPlanId = String(planId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanFilename = path.basename(filename);

    const targetDir = path.resolve(STORAGE_ROOT, cleanUserId, cleanPlanId);
    const filePath = path.resolve(targetDir, cleanFilename);

    // Strict containment verification
    if (!filePath.startsWith(path.resolve(STORAGE_ROOT)) || !filePath.startsWith(targetDir)) {
      return res.status(403).json({ error: "Acesso inválido ao arquivo." });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    const ext = path.extname(cleanFilename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };

    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const stream = fs.createReadStream(filePath);
    return stream.pipe(res);
  } catch (error: any) {
    console.error("Erro ao carregar imagem:", error);
    return res.status(500).json({ error: "Erro ao processar imagem." });
  }
});

// Storage API Endpoint: Delete Plan Image
app.delete("/api/storage/plan-images", (req, res) => {
  try {
    const { image_path, userId } = req.body;
    if (!image_path || typeof image_path !== "string") {
      return res.status(400).json({ error: "Caminho da imagem é obrigatório." });
    }

    // Basic isolation: ensure path starts with userId if userId is specified
    if (userId && !image_path.startsWith(`${userId}/`)) {
      return res.status(403).json({ error: "Acesso não autorizado para excluir este arquivo." });
    }

    const normalizedPath = path.normalize(image_path).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.resolve(STORAGE_ROOT, normalizedPath);

    // Path traversal check: must stay within STORAGE_ROOT
    if (!fullPath.startsWith(path.resolve(STORAGE_ROOT))) {
      return res.status(403).json({ error: "Caminho de arquivo inválido." });
    }

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar imagem do storage:", error);
    return res.status(500).json({ error: "Erro ao remover imagem." });
  }
});

// Lazy initialization of Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to safely parse AI JSON responses even if formatted in markdown fences
function safeJsonParse<T = any>(rawText: string | null | undefined, fallback: T): T {
  if (!rawText || typeof rawText !== "string") return fallback;
  try {
    let clean = rawText.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    }
    return JSON.parse(clean);
  } catch (err) {
    console.warn("[JSON PARSE] Falha ao decodificar JSON da IA, usando fallback:", err);
    return fallback;
  }
}

// Health check endpoints
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ====================================================
// PRISMA ORM POSTGRESQL PERSISTENCE LAYER & SEEDING
// ====================================================
// PRISMA ORM POSTGRESQL & FILE PERSISTENCE LAYER
// ====================================================
const ADMIN_MASTER_EMAILS: string[] = [];

function isMasterAdminEmail(email?: string | null): boolean {
  return false;
}

// Helper function to hash password securely
async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText.trim(), salt);
}

// Helper function to compare plain text with stored hash or fallback plain password
async function verifyPassword(plainText: string, storedHashOrPlain?: string | null): Promise<boolean> {
  if (!storedHashOrPlain) return false;
  const cleanPass = plainText.trim();
  
  // If stored value is bcrypt hash ($2a$, $2b$, $2y$)
  if (storedHashOrPlain.startsWith("$2a$") || storedHashOrPlain.startsWith("$2b$") || storedHashOrPlain.startsWith("$2y$")) {
    return bcrypt.compare(cleanPass, storedHashOrPlain);
  }
  
  // Fallback for legacy plain text entries during transition
  return storedHashOrPlain.trim() === cleanPass;
}

// ==========================================
// RESILIENT PERSISTENT DATA STORE (DISK & MEMORY)
// ==========================================
interface MemoryUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
  accessExpiresAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  lastLoginAt?: Date | null;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: Date | null;
  onboardingStep?: number;
  onboardingData?: any;
}

interface MemoryVoucher {
  id: string;
  code: string;
  role: string;
  maxUses: number;
  usedCount: number;
  description?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

const USERS_DB_FILE = path.join(process.cwd(), "data", "users_db.json");
const VOUCHERS_DB_FILE = path.join(process.cwd(), "data", "vouchers_db.json");

const memoryUsers: Map<string, MemoryUser> = new Map();
const memoryVouchers: Map<string, MemoryVoucher> = new Map();

function saveUsersToDisk(): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const usersArray = Array.from(memoryUsers.values());
    fs.writeFileSync(USERS_DB_FILE, JSON.stringify(usersArray, null, 2), "utf-8");
  } catch (err) {
    console.error("[STORAGE] Erro ao salvar users_db.json:", err);
  }
}

function saveVouchersToDisk(): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const vouchersArray = Array.from(memoryVouchers.values());
    fs.writeFileSync(VOUCHERS_DB_FILE, JSON.stringify(vouchersArray, null, 2), "utf-8");
  } catch (err) {
    console.error("[STORAGE] Erro ao salvar vouchers_db.json:", err);
  }
}

async function initResilientDataStore(): Promise<void> {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Load users from disk if file exists
  if (fs.existsSync(USERS_DB_FILE)) {
    try {
      const raw = fs.readFileSync(USERS_DB_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u && u.email) {
            memoryUsers.set(u.email.toLowerCase().trim(), {
              ...u,
              createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
              lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
              accessExpiresAt: u.accessExpiresAt ? new Date(u.accessExpiresAt) : undefined,
              onboardingCompletedAt: u.onboardingCompletedAt ? new Date(u.onboardingCompletedAt) : undefined,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[STORAGE] Erro ao carregar users_db.json:", e);
    }
  }

  // 2. Load vouchers from disk if file exists
  if (fs.existsSync(VOUCHERS_DB_FILE)) {
    try {
      const raw = fs.readFileSync(VOUCHERS_DB_FILE, "utf-8");
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const v of list) {
          if (v && v.code) {
            memoryVouchers.set(v.code.toUpperCase().trim(), {
              ...v,
              createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
              expiresAt: v.expiresAt ? new Date(v.expiresAt) : undefined,
            });
          }
        }
      }
    } catch (e) {
      console.warn("[STORAGE] Erro ao carregar vouchers_db.json:", e);
    }
  }

  // 3. Ensure master admin accounts and default demo users exist
  const defaultAdminHash = await hashPassword("Duarte@2026");

  // Primary Master Email
  if (!memoryUsers.has("contato.theduarteonline@gmail.com")) {
    memoryUsers.set("contato.theduarteonline@gmail.com", {
      id: "master_" + crypto.randomUUID().replace(/-/g, ""),
      name: "João Vitor da Silva Duarte",
      email: "contato.theduarteonline@gmail.com",
      passwordHash: defaultAdminHash,
      role: "admin",
      status: "ativo",
      notes: "Conta mestre proprietária da plataforma",
      createdAt: new Date(),
    });
  } else {
    const admin1 = memoryUsers.get("contato.theduarteonline@gmail.com")!;
    admin1.role = "admin";
    admin1.status = "ativo";
  }

  // Student: joao.v.duarte@outlook.com
  if (!memoryUsers.has("joao.v.duarte@outlook.com")) {
    const studentPass = await hashPassword("Duarte@2026");
    memoryUsers.set("joao.v.duarte@outlook.com", {
      id: "user-aluno-joao",
      name: "João Duarte",
      email: "joao.v.duarte@outlook.com",
      passwordHash: studentPass,
      role: "aluno_vip",
      status: "ativo",
      notes: "Conta de Aluno (João Duarte)",
      createdAt: new Date(),
    });
  } else {
    const studentUser = memoryUsers.get("joao.v.duarte@outlook.com")!;
    studentUser.role = "aluno_vip";
    studentUser.status = "ativo";
    studentUser.name = "João Duarte";
    studentUser.notes = "Conta de Aluno (João Duarte)";
  }

  // Demo student
  if (!memoryUsers.has("aluno.policial@projetofarda.com.br")) {
    const studentHash = await hashPassword("123456");
    memoryUsers.set("aluno.policial@projetofarda.com.br", {
      id: "user-aluno-1",
      name: "Aluno Policial (Demonstração)",
      email: "aluno.policial@projetofarda.com.br",
      passwordHash: studentHash,
      role: "aluno_vip",
      status: "ativo",
      notes: "Aluno liberado - Turma Especial",
      createdAt: new Date(),
    });
  }

  // Default Vouchers
  if (!memoryVouchers.has("FARDA2026")) {
    memoryVouchers.set("FARDA2026", {
      id: "voucher-default-1",
      code: "FARDA2026",
      role: "aluno_vip",
      maxUses: 100,
      usedCount: 0,
      description: "Voucher de Liberação Direta - Turma 2026",
      createdAt: new Date(),
    });
  }

  if (!memoryVouchers.has("ELITE-POLICIAL")) {
    memoryVouchers.set("ELITE-POLICIAL", {
      id: "voucher-default-2",
      code: "ELITE-POLICIAL",
      role: "aluno_vip",
      maxUses: 50,
      usedCount: 0,
      description: "Voucher Alunos VIP Elite",
      createdAt: new Date(),
    });
  }

  // Save state to disk immediately
  saveUsersToDisk();
  saveVouchersToDisk();
}
initResilientDataStore();

// Seed initial essential data if PostgreSQL DB is newly created (strictly idempotent, never overwrites user changes)
async function seedPrismaDefaults(): Promise<void> {
  if (!isDatabaseConnected()) return;
  try {
    for (const masterEmail of ADMIN_MASTER_EMAILS) {
      const adminExists = await prisma.user.findUnique({
        where: { email: masterEmail.toLowerCase() },
      });

      if (!adminExists) {
        const hashedAdminPass = await hashPassword("Duarte@2026");
        await prisma.user.create({
          data: {
            id: "master_" + crypto.randomUUID().replace(/-/g, ""),
            name: "João Vitor da Silva Duarte",
            email: masterEmail.toLowerCase(),
            passwordHash: hashedAdminPass,
            role: "admin",
            status: "ativo",
            notes: "Conta mestre proprietária da plataforma",
          },
        });
        console.log(`[POSTGRES DB] Administrador Master inicializado com sucesso: ${masterEmail}`);
      } else if (adminExists.role !== "admin" || adminExists.status !== "ativo") {
        await prisma.user.update({
          where: { email: masterEmail.toLowerCase() },
          data: {
            role: "admin",
            status: "ativo",
          },
        });
      }
    }

    // Ensure joao.v.duarte@outlook.com is updated to student (aluno_vip) in PostgreSQL DB
    const joaoStudent = await prisma.user.findUnique({
      where: { email: "joao.v.duarte@outlook.com" },
    });
    if (joaoStudent && joaoStudent.role === "admin") {
      await prisma.user.update({
        where: { email: "joao.v.duarte@outlook.com" },
        data: {
          role: "aluno_vip",
          notes: "Conta de Aluno (João Duarte)",
        },
      });
    }

    // Check if demo student exists
    const demoStudent = await prisma.user.findUnique({
      where: { email: "aluno.policial@projetofarda.com.br" },
    });

    if (!demoStudent) {
      const hashedStudentPass = await hashPassword("123456");
      await prisma.user.create({
        data: {
          id: "user-aluno-1",
          name: "Aluno Policial (Demonstração)",
          email: "aluno.policial@projetofarda.com.br",
          passwordHash: hashedStudentPass,
          role: "aluno_vip",
          status: "ativo",
          notes: "Aluno liberado - Turma Especial",
        },
      });
    }

    // Seed default vouchers if they do not exist
    const voucher1 = await prisma.voucher.findUnique({ where: { code: "FARDA2026" } });
    if (!voucher1) {
      await prisma.voucher.create({
        data: {
          code: "FARDA2026",
          role: "aluno_vip",
          maxUses: 100,
          usedCount: 0,
          description: "Voucher de Liberação Direta - Turma 2026",
        },
      });
    }

    const voucher2 = await prisma.voucher.findUnique({ where: { code: "ELITE-POLICIAL" } });
    if (!voucher2) {
      await prisma.voucher.create({
        data: {
          code: "ELITE-POLICIAL",
          role: "aluno_vip",
          maxUses: 50,
          usedCount: 0,
          description: "Voucher Alunos VIP Elite",
        },
      });
    }

    // Ensure PMRR template exists in database if connected
    const pmrrTemplate = await prisma.editalTemplate.findFirst({
      where: {
        OR: [
          { slug: "pmrr-soldado-da-policia-militar-uerr-2026" },
          { sigla: "PMRR" },
        ],
      },
    });
    if (!pmrrTemplate) {
      await prisma.editalTemplate.create({
        data: {
          slug: "pmrr-soldado-da-policia-militar-uerr-2026",
          orgao: "Polícia Militar de Roraima",
          sigla: "PMRR",
          cargo: "Soldado da Polícia Militar (QPPM)",
          esfera: "Estadual",
          banca: "UERR / Cebraspe",
          ano: 2026,
          editalNumero: "Edital nº 01/PMRR/2026",
          verified: true,
          verifiedAt: new Date(),
          sourceVersion: "Edital Oficial Consolidado",
          description: "Edital Oficial PMRR: Língua Portuguesa, Raciocínio Lógico-Matemático, História e Geografia de Roraima, Noções de Direito Constitucional, Penal, Penal Militar, Administrativo e Legislação Institucional (LC 081/04).",
          category: "seguranca_publica",
          active: true,
          disciplines: {
            create: [
              {
                name: "Língua Portuguesa & Interpretação de Textos",
                order: 1,
                weight: 4,
                topics: {
                  create: [
                    { title: "Compreensão e interpretação de textos de gêneros variados", order: 1 },
                    { title: "Ortografia oficial, acentuação gráfica e pontuação", order: 2 },
                    { title: "Concordância e regência verbal e nominal, crase", order: 3 },
                  ],
                },
              },
              {
                name: "Raciocínio Lógico-Matemático",
                order: 2,
                weight: 3,
                topics: {
                  create: [
                    { title: "Estruturas lógicas, proposições e diagramas lógicos", order: 1 },
                    { title: "Porcentagem, proporções e conjuntos numéricos", order: 2 },
                  ],
                },
              },
              {
                name: "História e Geografia de Roraima",
                order: 3,
                weight: 3,
                topics: {
                  create: [
                    { title: "História de Roraima: Forte São Joaquim, Território do Rio Branco e Criação do Estado", order: 1 },
                    { title: "Geografia de Roraima: Bacia do Rio Branco, Relevo, Lavrado, Clima e Fronteiras", order: 2 },
                  ],
                },
              },
              {
                name: "Noções de Direito Constitucional & Direitos Humanos",
                order: 4,
                weight: 3,
                topics: {
                  create: [
                    { title: "Direitos e Garantias Fundamentais (Art. 5º da CF/88)", order: 1 },
                    { title: "Segurança Pública (Art. 144 da CF/88) e Direitos Humanos", order: 2 },
                  ],
                },
              },
              {
                name: "Noções de Direito Penal Comum & Legislação Especial",
                order: 5,
                weight: 3,
                topics: {
                  create: [
                    { title: "Teoria do Crime, Crimes contra a Pessoa e o Patrimônio", order: 1 },
                    { title: "Legislação Especial: Lei de Drogas, Desarmamento e Maria da Penha", order: 2 },
                  ],
                },
              },
              {
                name: "Direito Penal Militar e Processual Penal Militar",
                order: 6,
                weight: 4,
                topics: {
                  create: [
                    { title: "Código Penal Militar: Crime Militar, Motim, Deserção e Insubordinação", order: 1 },
                    { title: "Inquérito Policial Militar (IPM) e Auto de Prisão em Flagrante", order: 2 },
                  ],
                },
              },
              {
                name: "Direito Administrativo & Estatuto da PMRR (LC 081/04)",
                order: 7,
                weight: 3,
                topics: {
                  create: [
                    { title: "Princípios da Administração Pública e Atos Administrativos", order: 1 },
                    { title: "Lei Complementar Estadual nº 081/2004 (Estatuto dos Militares de Roraima)", order: 2 },
                  ],
                },
              },
              {
                name: "Noções de Informática",
                order: 8,
                weight: 2,
                topics: {
                  create: [
                    { title: "Sistemas Operacionais, Pacote de Escritório e Segurança da Informação", order: 1 },
                  ],
                },
              },
            ],
          },
        },
      });
    }

    console.log("[POSTGRES DB] Estado do banco de dados PostgreSQL validado com sucesso.");
  } catch (seedErr: any) {
    console.error("[POSTGRES DB] Erro durante verificação de seed padrão:", seedErr?.message || seedErr);
  }
}

// Initialize PostgreSQL database connection strictly without SQLite fallback
async function initPrismaDatabase(): Promise<void> {
  const isConnected = await testDatabaseConnection();
  if (isConnected) {
    await seedPrismaDefaults();
  }
}

// Initialize database on startup
initPrismaDatabase();

// Email Provider & SMTP Configuration
export interface EmailConfig {
  provider: "smtp" | "resend" | "auto";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  resendApiKey?: string;
  senderEmail?: string;
  senderName?: string;
}

const EMAIL_CONFIG_PATH = path.join(process.cwd(), "data", "email_config.json");

function getEmailConfig(): EmailConfig {
  let fileConfig: Partial<EmailConfig> = {};
  try {
    if (fs.existsSync(EMAIL_CONFIG_PATH)) {
      const raw = fs.readFileSync(EMAIL_CONFIG_PATH, "utf-8");
      fileConfig = JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn("[EMAIL CONFIG] Aviso ao ler email_config.json:", e);
  }

  // Mandatory Fallback: Read process.env if field is not configured in the admin file
  const smtpHost = (fileConfig.smtpHost?.trim() || process.env.SMTP_HOST?.trim() || "");
  const smtpPort = fileConfig.smtpPort || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const smtpUser = (fileConfig.smtpUser?.trim() || process.env.SMTP_USER?.trim() || "");
  const smtpPass = (fileConfig.smtpPass?.trim() || process.env.SMTP_PASS?.trim() || "");
  const smtpSecure = fileConfig.smtpSecure ?? (process.env.SMTP_SECURE === "true" || smtpPort === 465);
  const resendApiKey = (fileConfig.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim() || "");
  const senderEmail = (fileConfig.senderEmail?.trim() || process.env.EMAIL_FROM?.trim() || "contato@projetofarda.com.br");
  const senderName = (fileConfig.senderName?.trim() || process.env.EMAIL_SENDER_NAME?.trim() || "Projeto Farda");

  const effectiveProvider =
    fileConfig.provider && fileConfig.provider !== "auto"
      ? fileConfig.provider
      : (smtpHost && smtpUser && smtpPass ? "smtp" : (resendApiKey ? "resend" : "auto"));

  return {
    provider: effectiveProvider,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpSecure,
    resendApiKey,
    senderEmail,
    senderName,
  };
}

function logEmailConfigStatus() {
  const cfg = getEmailConfig();
  console.log("=================================================");
  console.log("[EMAIL SERVICE] Status de Inicialização e Fallback:");
  console.log("  - SMTP_HOST (ENV):", process.env.SMTP_HOST ? `Configurado (${process.env.SMTP_HOST})` : "Não definido");
  console.log("  - SMTP_PORT (ENV):", process.env.SMTP_PORT || "587 (padrão)");
  console.log("  - SMTP_USER (ENV):", process.env.SMTP_USER ? `Configurado (${process.env.SMTP_USER})` : "Não definido");
  console.log("  - SMTP_PASS (ENV):", !!process.env.SMTP_PASS ? "Configurado (***)" : "Não definido");
  console.log("  - RESEND_API_KEY (ENV):", !!process.env.RESEND_API_KEY ? "Configurado (***)" : "Não definido");
  console.log("  - Provedor Efetivo:", cfg.provider);
  console.log("  - Host SMTP Ativo:", cfg.smtpHost ? `${cfg.smtpHost}:${cfg.smtpPort}` : "Nenhum");
  console.log("  - Usuário SMTP Ativo:", cfg.smtpUser || "Nenhum");
  console.log("  - Senha SMTP Ativa:", !!cfg.smtpPass ? "Presente" : "Ausente");
  console.log("  - Chave Resend Ativa:", !!cfg.resendApiKey ? "Presente" : "Ausente");
  console.log("  - Remetente Ativo:", `"${cfg.senderName}" <${cfg.senderEmail}>`);
  console.log("=================================================");
}

function saveEmailConfig(cfg: EmailConfig) {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(EMAIL_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
    logEmailConfigStatus();
  } catch (e) {
    console.error("Erro ao salvar email_config.json:", e);
  }
}

// Unified System Email Sender with robust try/catch & fallback logging
async function sendSystemEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; provider?: string; error?: string }> {
  try {
    const config = getEmailConfig();
    const rawResendKey = (config.resendApiKey || "").trim();
    const smtpHost = (config.smtpHost || "").trim();
    const smtpUser = (config.smtpUser || "").trim();
    const smtpPass = (config.smtpPass || "").trim();
    const smtpPort = config.smtpPort || 587;
    const smtpSecure = !!config.smtpSecure;
    const senderEmail = (config.senderEmail || "contato@projetofarda.com.br").trim();
    const senderName = (config.senderName || "Projeto Farda").trim();
    const fromFormatted = `"${senderName}" <${senderEmail.replace(/.*<([^>]+)>.*/, "$1")}>`;

    // Check if Resend API key has a plausible format before attempting network calls
    const isPlausibleResendKey =
      rawResendKey.startsWith("re_") &&
      rawResendKey.length >= 24 &&
      !rawResendKey.includes("...") &&
      !rawResendKey.toUpperCase().includes("YOUR_") &&
      !rawResendKey.toUpperCase().includes("MY_");

    // 1. Try SMTP if credentials are provided
    if (smtpHost && smtpUser && smtpPass) {
      try {
        // Automatically normalize app passwords with spaces (e.g. Google's 16-character app passwords "xxxx xxxx xxxx xxxx")
        const normalizedPass =
          smtpHost.toLowerCase().includes("gmail") || smtpPass.replace(/\s+/g, "").length === 16
            ? smtpPass.replace(/\s+/g, "")
            : smtpPass;

        console.log(`[EMAIL DISPATCHER] Enviando e-mail via SMTP (${smtpHost}:${smtpPort}) para ${to}...`);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure || smtpPort === 465,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: smtpUser,
            pass: normalizedPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const info = await transporter.sendMail({
          from: fromFormatted,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>?/gm, ""),
        });

        console.log(`[EMAIL DISPATCHER] E-mail SMTP enviado com sucesso! MessageId: ${info.messageId}`);
        return { success: true, provider: "smtp" };
      } catch (smtpErr: any) {
        console.warn("[EMAIL DISPATCHER] Erro no envio via SMTP:", smtpErr?.message || smtpErr);
        // If SMTP fails, fallback to Resend if available
      }
    }

    // 2. Try Resend API if configured and key is properly formatted
    if (isPlausibleResendKey) {
      try {
        console.log(`[EMAIL DISPATCHER] Enviando e-mail via Resend API para ${to}...`);
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${rawResendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: senderEmail.includes("<") ? senderEmail : `${senderName} <${senderEmail}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ""),
          }),
        });

        if (resendRes.ok) {
          const resData = await resendRes.json().catch(() => ({}));
          console.log(`[EMAIL DISPATCHER] E-mail Resend enviado com sucesso! ID:`, resData);
          return { success: true, provider: "resend" };
        } else {
          let errMessage = `HTTP ${resendRes.status}`;
          try {
            const errBody = await resendRes.json();
            if (errBody?.message) errMessage = errBody.message;
          } catch {
            // Ignore JSON parse error
          }
          console.warn(`[EMAIL DISPATCHER] Resend API retorno (${resendRes.status}): ${errMessage}`);
          return {
            success: false,
            provider: "resend",
            error: `Resend (${resendRes.status}): ${errMessage}. Configure um servidor SMTP ou renove a chave no Painel do Administrador.`,
          };
        }
      } catch (resendErr: any) {
        console.warn("[EMAIL DISPATCHER] Falha na requisição Resend:", resendErr?.message || resendErr);
        return { success: false, provider: "resend", error: resendErr?.message || "Erro na conexão Resend" };
      }
    }

    console.info(
      `[EMAIL DISPATCHER] Nenhum provedor de e-mail ativo (SMTP ou Resend válido). Configure as credenciais no Painel do Administrador > Servidor de E-mail & SMTP ou no arquivo .env.`
    );
    return {
      success: false,
      error: "Nenhum servidor de e-mail ativo. Configure o SMTP ou Resend no Painel do Administrador ou via variáveis de ambiente.",
    };
  } catch (outerErr: any) {
    console.error("[EMAIL DISPATCHER] Exceção inesperada no envio de e-mail:", outerErr?.message || outerErr);
    return {
      success: false,
      error: outerErr?.message || "Erro interno no serviço de e-mail.",
    };
  }
}

// Helper to format consistent user responses with onboarding metadata
function formatUserResponse(u: any, loginMethod: "email" | "google" = "email") {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl || undefined,
    role: u.role || "aluno",
    status: u.status || "ativo",
    loginMethod,
    accessExpiresAt: u.accessExpiresAt
      ? typeof u.accessExpiresAt === "string"
        ? u.accessExpiresAt
        : u.accessExpiresAt.toISOString()
      : undefined,
    notes: u.notes || undefined,
    createdAt: typeof u.createdAt === "string" ? u.createdAt : u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt
      ? typeof u.lastLoginAt === "string"
        ? u.lastLoginAt
        : u.lastLoginAt.toISOString()
      : undefined,
    onboardingCompleted: !!u.onboardingCompleted,
    onboardingCompletedAt: u.onboardingCompletedAt
      ? typeof u.onboardingCompletedAt === "string"
        ? u.onboardingCompletedAt
        : u.onboardingCompletedAt.toISOString()
      : undefined,
    onboardingStep: typeof u.onboardingStep === "number" ? u.onboardingStep : 0,
    onboardingData: u.onboardingData || undefined,
  };
}

// In-memory store for active password recovery codes (email -> { code, expiresAt })
interface RecoveryCodeEntry {
  code: string;
  expiresAt: number;
}
const recoveryCodesStore = new Map<string, RecoveryCodeEntry>();

// ==========================================
// CENTRALIZED AUTH API ENDPOINTS (PRISMA POSTGRESQL)
// ==========================================

// GET /api/auth/state - Get users list and vouchers with no-cache headers directly from PostgreSQL & Memory Store
app.get("/api/auth/state", async (_req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    let dbUsers: any[] = [];
    let dbVouchers: any[] = [];

    if (isDatabaseConnected()) {
      try {
        dbUsers = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
        });
        dbVouchers = await prisma.voucher.findMany({
          orderBy: { createdAt: "desc" },
        });
      } catch (dbErr: any) {
        console.warn("[POSTGRES DB] Erro na consulta em /api/auth/state:", dbErr?.message || dbErr);
      }
    }

    // Merge in-memory users with database users to avoid stale overwrites
    const mergedUsersMap = new Map<string, any>();
    for (const [email, u] of memoryUsers.entries()) {
      mergedUsersMap.set(email.toLowerCase().trim(), u);
    }
    for (const u of dbUsers) {
      const emailKey = u.email.toLowerCase().trim();
      const existing = mergedUsersMap.get(emailKey) || {};
      mergedUsersMap.set(emailKey, { ...existing, ...u });
    }

    const finalUsers = Array.from(mergedUsersMap.values());

    // Merge vouchers
    const mergedVouchersMap = new Map<string, any>();
    for (const [code, v] of memoryVouchers.entries()) {
      mergedVouchersMap.set(code.toUpperCase().trim(), v);
    }
    for (const v of dbVouchers) {
      const codeKey = v.code.toUpperCase().trim();
      const existing = mergedVouchersMap.get(codeKey) || {};
      mergedVouchersMap.set(codeKey, { ...existing, ...v });
    }

    const finalVouchers = Array.from(mergedVouchersMap.values());

    return res.json({
      success: true,
      users: finalUsers.map((u: any) => formatUserResponse(u, "email")),
      vouchers: finalVouchers.map((v: any) => ({
        id: v.id,
        code: v.code,
        role: v.role,
        maxUses: v.maxUses,
        usedCount: v.usedCount,
        expiresAt: v.expiresAt ? (typeof v.expiresAt === "string" ? v.expiresAt : v.expiresAt.toISOString()) : undefined,
        description: v.description || "",
        createdAt: typeof v.createdAt === "string" ? v.createdAt : v.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Erro ao buscar /api/auth/state:", error);
    return res.status(500).json({ error: "Erro ao consultar usuários." });
  }
});

// POST /api/auth/profile - Permanently update user profile (name, avatarUrl) directly in PostgreSQL & Disk
app.post("/api/auth/profile", async (req, res) => {
  try {
    const { userId, email, name, avatarUrl } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: "Identificador ou e-mail do usuário é obrigatório." });
    }

    let user: any = null;
    const cleanEmail = email ? String(email).toLowerCase().trim() : "";

    if (isDatabaseConnected()) {
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: String(userId) } });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
    } else {
      user = (cleanEmail && memoryUsers.get(cleanEmail)) ||
        Array.from(memoryUsers.values()).find((u) => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const oldAvatarUrl = user.avatarUrl;
    const dataToUpdate: any = {};
    if (name && typeof name === "string" && name.trim()) {
      dataToUpdate.name = name.trim();
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl === "" || avatarUrl === null) {
        dataToUpdate.avatarUrl = null;
      } else {
        const storageResult = await processAvatarStorage(user.id, avatarUrl);
        if (!storageResult.success) {
          return res.status(400).json({ error: storageResult.error || "Erro ao processar imagem de avatar." });
        }
        dataToUpdate.avatarUrl = storageResult.url || null;
      }
    }

    let updatedUser: any = user;
    if (isDatabaseConnected()) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
      });
    }
    
    // Always sync in-memory & disk representation
    const currentMemory = memoryUsers.get(user.email.toLowerCase()) || user;
    const merged = { ...currentMemory, ...dataToUpdate };
    memoryUsers.set(merged.email.toLowerCase(), merged);
    saveUsersToDisk();

    if (
      oldAvatarUrl &&
      dataToUpdate.avatarUrl &&
      oldAvatarUrl !== dataToUpdate.avatarUrl
    ) {
      deleteAvatarFromStorage(oldAvatarUrl).catch(() => {});
    }

    return res.json({
      success: true,
      user: formatUserResponse(updatedUser, "email"),
    });
  } catch (error: any) {
    console.error("Erro ao salvar perfil:", error);
    return res.status(500).json({ error: error?.message || "Erro ao salvar perfil do usuário." });
  }
});

// POST /api/auth/login - Email + Password Login with bcrypt verification
app.post("/api/auth/login", authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPass = String(password).trim();

    let user: any = null;
    if (isDatabaseConnected()) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    }
    
    if (!user) {
      user = memoryUsers.get(cleanEmail);
    }

    // Special master admin check / auto-creation if missing
    if (isMasterAdminEmail(cleanEmail)) {
      if (!user) {
        const adminHash = await hashPassword(cleanPass || "Duarte@2026");
        const adminName = "João Vitor da Silva Duarte";
        const adminId = "master_" + crypto.randomUUID().replace(/-/g, "");

        if (isDatabaseConnected()) {
          try {
            const createdAdmin = await prisma.user.create({
              data: {
                id: adminId,
                name: adminName,
                email: cleanEmail,
                passwordHash: adminHash,
                role: "admin",
                status: "ativo",
                notes: "Conta mestre proprietária da plataforma",
                lastLoginAt: new Date(),
              },
            });
            user = createdAdmin;
          } catch (createErr) {
            console.warn("[POSTGRES] Erro ao criar master no DB, usando fallback:", createErr);
          }
        }
        
        if (!user) {
          user = {
            id: adminId,
            name: adminName,
            email: cleanEmail,
            passwordHash: adminHash,
            role: "admin",
            status: "ativo",
            notes: "Conta mestre proprietária da plataforma",
            createdAt: new Date(),
            lastLoginAt: new Date(),
          };
        }
        memoryUsers.set(cleanEmail, user);
        saveUsersToDisk();

        return res.json({
          success: true,
          user: formatUserResponse(user, "email"),
        });
      }

      // Validate master password
      const isMasterPassValid = await verifyPassword(cleanPass, user.passwordHash);

      if (!isMasterPassValid) {
        return res.status(401).json({ error: "Senha de administrador incorreta." });
      }

      user.role = "admin";
      user.status = "ativo";
      user.lastLoginAt = new Date();

      if (isDatabaseConnected()) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin", status: "ativo", lastLoginAt: new Date() },
          });
        } catch {}
      }
      
      memoryUsers.set(cleanEmail, user);
      saveUsersToDisk();

      return res.json({
        success: true,
        user: formatUserResponse(user, "email"),
      });
    }

    if (!user) {
      return res.status(401).json({
        error:
          "Acesso negado: Este e-mail não possui liberação ativa nesta plataforma. Solicite seu cadastro na tela inicial.",
      });
    }

    if (user.status === "bloqueado") {
      return res.status(403).json({
        error: "Acesso bloqueado: Sua conta foi suspensa pelo administrador. Entre em contato com o suporte.",
      });
    }

    if (user.status === "pendente") {
      return res.status(403).json({
        error:
          "Acesso pendente: Sua solicitação de cadastro foi recebida e está aguardando aprovação do administrador.",
      });
    }

    // Password verification via bcrypt
    const isPasswordCorrect = await verifyPassword(cleanPass, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "Usuário ou senha incorretos. Verifique suas credenciais de acesso.",
      });
    }

    // Check expiration date
    if (user.accessExpiresAt && new Date() > new Date(user.accessExpiresAt)) {
      return res.status(403).json({
        error: `Seu período de acesso expirou em ${new Date(user.accessExpiresAt).toLocaleDateString("pt-BR")}. Renove seu acesso com o administrador.`,
      });
    }

    if (isDatabaseConnected()) {
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch {}
    }
    
    user.lastLoginAt = new Date();
    memoryUsers.set(cleanEmail, user);
    saveUsersToDisk();

    return res.json({
      success: true,
      user: formatUserResponse(user, "email"),
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor ao autenticar." });
  }
});

// POST /api/user-plans/sync - Sync study plans
app.post("/api/user-plans/sync", async (req, res) => {
  try {
    const { userId, plan } = req.body;
    if (!userId || !plan || !plan.id) {
      return res.status(400).json({ error: "userId e plan são obrigatórios." });
    }

    if (isDatabaseConnected()) {
      let dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@projetofarda.internal`,
            name: "Aluno Farda",
            role: "aluno",
            status: "ativo",
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
          },
        });
      } else if (!dbUser.onboardingCompleted) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
          },
        });
      }

      const upserted = await prisma.plan.upsert({
        where: { id: plan.id },
        update: {
          title: plan.name || plan.title || "Plano de Estudos",
          description: plan.description || null,
          targetExam: plan.examDate || null,
          targetHours: plan.weeklyGoalHours ? Number(plan.weeklyGoalHours) : 20,
          planningMode: plan.planningMode === "WEEKLY" || plan.organizationType === "semanal" ? "WEEKLY" : "CYCLE",
          cycleDataJson: JSON.stringify({
            cycle: plan.cycle || [],
            weeklySchedule: plan.weeklySchedule || [],
            editalId: plan.editalId || "",
            organizationType: plan.organizationType || "ciclo",
            planningMode: plan.planningMode || "CYCLE",
            currentCycleIndex: plan.currentCycleIndex || 0,
            completedCycles: plan.completedCycles || 0,
            currentStepElapsedMinutes: plan.currentStepElapsedMinutes || 0,
            weeklyGoalHours: plan.weeklyGoalHours || 20,
            active: plan.active !== false,
          }),
          status: "ativo",
        },
        create: {
          id: plan.id,
          userId: dbUser.id,
          title: plan.name || plan.title || "Plano de Estudos",
          description: plan.description || null,
          targetExam: plan.examDate || null,
          targetHours: plan.weeklyGoalHours ? Number(plan.weeklyGoalHours) : 20,
          planningMode: plan.planningMode === "WEEKLY" || plan.organizationType === "semanal" ? "WEEKLY" : "CYCLE",
          cycleDataJson: JSON.stringify({
            cycle: plan.cycle || [],
            weeklySchedule: plan.weeklySchedule || [],
            editalId: plan.editalId || "",
            organizationType: plan.organizationType || "ciclo",
            planningMode: plan.planningMode || "CYCLE",
            currentCycleIndex: plan.currentCycleIndex || 0,
            completedCycles: plan.completedCycles || 0,
            currentStepElapsedMinutes: plan.currentStepElapsedMinutes || 0,
            weeklyGoalHours: plan.weeklyGoalHours || 20,
            active: plan.active !== false,
          }),
          status: "ativo",
        },
      });

      return res.json({ success: true, planId: upserted.id });
    }

    return res.json({ success: true, planId: plan.id });
  } catch (syncErr: any) {
    console.error("[PLAN SYNC] Erro ao sincronizar plano:", syncErr?.message || syncErr);
    return res.status(500).json({ error: "Erro ao salvar plano no banco de dados." });
  }
});

// ==========================================
// AUTOMATED DAILY STUDY BACKUP API ENDPOINTS
// ==========================================

interface DailyBackupSummary {
  editaisCount: number;
  studyPlansCount: number;
  studySessionsCount: number;
  totalHours: number;
  totalQuestions: number;
  simuladosCount: number;
  activeEditalName?: string;
}

function computeBackupSummary(data: any): DailyBackupSummary {
  const editais = Array.isArray(data?.editais) ? data.editais : [];
  const studyPlans = Array.isArray(data?.studyPlans) ? data.studyPlans : [];
  const studySessions = Array.isArray(data?.studySessions) ? data.studySessions : [];
  const simulados = Array.isArray(data?.simulados) ? data.simulados : [];

  let totalMinutes = 0;
  let totalQuestions = 0;
  studySessions.forEach((s: any) => {
    totalMinutes += Number(s.durationMinutes || s.duration || 0);
    totalQuestions += Number(s.questionsCount || s.questions || 0);
  });

  const activeEditalId = data?.activeEditalId;
  const activeEdital = editais.find((e: any) => e.id === activeEditalId) || editais[0];

  return {
    editaisCount: editais.length,
    studyPlansCount: studyPlans.length,
    studySessionsCount: studySessions.length,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    totalQuestions,
    simuladosCount: simulados.length,
    activeEditalName: activeEdital?.name || activeEdital?.title || "Plano Geral",
  };
}

function pruneOldBackups(userDir: string, maxDays = 30) {
  try {
    if (!fs.existsSync(userDir)) return;
    const files = fs.readdirSync(userDir);
    const now = Date.now();
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      if (!file.endsWith(".json")) return;
      const filePath = path.join(userDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    });
  } catch (err) {
    console.warn("[BACKUP PRUNE] Erro ao limpar backups antigos:", err);
  }
}

// POST /api/backups/daily/sync - Create or update daily backup snapshot
app.post("/api/backups/daily/sync", async (req, res) => {
  try {
    const { userId, data, isAuto = true } = req.body;
    if (!userId || !data) {
      return res.status(400).json({ error: "userId e data são obrigatórios." });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanUserId) {
      return res.status(400).json({ error: "ID de usuário inválido." });
    }

    const userBackupDir = path.resolve(BACKUPS_ROOT, cleanUserId);
    if (!fs.existsSync(userBackupDir)) {
      fs.mkdirSync(userBackupDir, { recursive: true });
    }

    // Date key for today: YYYY-MM-DD
    const now = new Date();
    const dateKey = now.toISOString().split("T")[0];
    const timestamp = now.getTime();
    const summary = computeBackupSummary(data);

    const backupPayload = {
      id: `backup_${cleanUserId}_${dateKey}_${isAuto ? "auto" : "manual"}_${timestamp}`,
      userId: cleanUserId,
      dateKey,
      createdAt: now.toISOString(),
      auto: Boolean(isAuto),
      summary,
      data,
    };

    const fileName = `${dateKey}_${isAuto ? "auto" : "manual"}_${timestamp}.json`;
    const targetFile = path.resolve(userBackupDir, fileName);

    // Strict containment
    if (!targetFile.startsWith(userBackupDir)) {
      return res.status(403).json({ error: "Caminho de backup não autorizado." });
    }

    const jsonString = JSON.stringify(backupPayload, null, 2);
    fs.writeFileSync(targetFile, jsonString, "utf-8");

    // Also update a stable "latest_today.json" pointer
    const latestTodayFile = path.resolve(userBackupDir, `latest_${dateKey}.json`);
    fs.writeFileSync(latestTodayFile, jsonString, "utf-8");

    // Clean up backups older than 30 days for this user
    pruneOldBackups(userBackupDir, 30);

    const stats = fs.statSync(targetFile);
    const fileSizeKb = Math.round((stats.size / 1024) * 10) / 10;

    return res.json({
      success: true,
      backup: {
        id: backupPayload.id,
        userId: cleanUserId,
        dateKey,
        createdAt: backupPayload.createdAt,
        auto: backupPayload.auto,
        fileSizeKb,
        summary,
      },
    });
  } catch (error: any) {
    console.error("[BACKUP SYNC ERRO]:", error);
    return res.status(500).json({ error: "Erro interno ao processar backup diário." });
  }
});

// GET /api/backups/daily/list - List available daily backups for user
app.get("/api/backups/daily/list", (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId é obrigatório." });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const userBackupDir = path.resolve(BACKUPS_ROOT, cleanUserId);

    if (!fs.existsSync(userBackupDir)) {
      return res.json({ success: true, backups: [] });
    }

    const files = fs.readdirSync(userBackupDir);
    const backups: any[] = [];

    files.forEach((file) => {
      if (!file.endsWith(".json") || file.startsWith("latest_")) return;
      try {
        const filePath = path.resolve(userBackupDir, file);
        if (!filePath.startsWith(userBackupDir)) return;

        const stat = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);

        backups.push({
          id: parsed.id || file.replace(".json", ""),
          userId: cleanUserId,
          dateKey: parsed.dateKey || file.split("_")[0],
          createdAt: parsed.createdAt || stat.mtime.toISOString(),
          auto: parsed.auto !== false,
          fileSizeKb: Math.round((stat.size / 1024) * 10) / 10,
          summary: parsed.summary || computeBackupSummary(parsed.data || parsed),
        });
      } catch (e) {
        console.warn(`[BACKUP LIST] Erro ao ler backup ${file}:`, e);
      }
    });

    // Sort descending by createdAt
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      backups,
      total: backups.length,
      latest: backups[0] || null,
    });
  } catch (error: any) {
    console.error("[BACKUP LIST ERRO]:", error);
    return res.status(500).json({ error: "Erro ao listar backups diários." });
  }
});

// GET /api/backups/daily/get/:backupId - Get single backup data for inspection or restore
app.get("/api/backups/daily/get/:backupId", (req, res) => {
  try {
    const { backupId } = req.params;
    const { userId } = req.query;

    if (!backupId || !userId) {
      return res.status(400).json({ error: "backupId e userId são obrigatórios." });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanBackupId = String(backupId).replace(/[^a-zA-Z0-9_-]/g, "");
    const userBackupDir = path.resolve(BACKUPS_ROOT, cleanUserId);

    if (!fs.existsSync(userBackupDir)) {
      return res.status(404).json({ error: "Nenhum backup encontrado para este usuário." });
    }

    const files = fs.readdirSync(userBackupDir);
    const matchedFile = files.find((f) => f.includes(cleanBackupId) || f === `${cleanBackupId}.json`);

    if (!matchedFile) {
      return res.status(404).json({ error: "Ponto de backup não encontrado." });
    }

    const filePath = path.resolve(userBackupDir, matchedFile);
    if (!filePath.startsWith(userBackupDir)) {
      return res.status(403).json({ error: "Acesso inválido ao arquivo." });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);

    return res.json({
      success: true,
      backup: parsed,
    });
  } catch (error: any) {
    console.error("[BACKUP GET ERRO]:", error);
    return res.status(500).json({ error: "Erro ao recuperar dados do backup." });
  }
});

// GET /api/backups/daily/download/:backupId - Download specific backup file
app.get("/api/backups/daily/download/:backupId", (req, res) => {
  try {
    const { backupId } = req.params;
    const { userId } = req.query;

    if (!backupId || !userId) {
      return res.status(400).json({ error: "backupId e userId são obrigatórios." });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanBackupId = String(backupId).replace(/[^a-zA-Z0-9_-]/g, "");
    const userBackupDir = path.resolve(BACKUPS_ROOT, cleanUserId);

    if (!fs.existsSync(userBackupDir)) {
      return res.status(404).json({ error: "Arquivo de backup não encontrado." });
    }

    const files = fs.readdirSync(userBackupDir);
    const matchedFile = files.find((f) => f.includes(cleanBackupId) || f === `${cleanBackupId}.json`);

    if (!matchedFile) {
      return res.status(404).json({ error: "Arquivo de backup não encontrado." });
    }

    const filePath = path.resolve(userBackupDir, matchedFile);
    if (!filePath.startsWith(userBackupDir)) {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const downloadName = `nexo_backup_${cleanBackupId}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.setHeader("Content-Type", "application/json");

    return res.sendFile(filePath);
  } catch (error: any) {
    console.error("[BACKUP DOWNLOAD ERRO]:", error);
    return res.status(500).json({ error: "Erro ao baixar arquivo de backup." });
  }
});

// DELETE /api/backups/daily/:backupId - Delete a specific backup
app.delete("/api/backups/daily/:backupId", (req, res) => {
  try {
    const { backupId } = req.params;
    const { userId } = req.query;

    if (!backupId || !userId) {
      return res.status(400).json({ error: "backupId e userId são obrigatórios." });
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const cleanBackupId = String(backupId).replace(/[^a-zA-Z0-9_-]/g, "");
    const userBackupDir = path.resolve(BACKUPS_ROOT, cleanUserId);

    if (!fs.existsSync(userBackupDir)) {
      return res.status(404).json({ error: "Diretório de backup não encontrado." });
    }

    const files = fs.readdirSync(userBackupDir);
    const matchedFile = files.find((f) => f.includes(cleanBackupId) || f === `${cleanBackupId}.json`);

    if (!matchedFile) {
      return res.status(404).json({ error: "Arquivo de backup não encontrado." });
    }

    const filePath = path.resolve(userBackupDir, matchedFile);
    if (!filePath.startsWith(userBackupDir)) {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    fs.unlinkSync(filePath);
    return res.json({ success: true, message: "Backup excluído com sucesso." });
  } catch (error: any) {
    console.error("[BACKUP DELETE ERRO]:", error);
    return res.status(500).json({ error: "Erro ao excluir arquivo de backup." });
  }
});

// ==========================================
// ONBOARDING FIRST-ACCESS API ENDPOINTS
// ==========================================

// GET /api/onboarding/state - Get user's onboarding status and progress
app.get("/api/onboarding/state", async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ error: "userId ou email é obrigatório." });
    }

    let user: any = null;
    let hasPlans = false;

    if (isDatabaseConnected()) {
      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: String(userId) },
          include: { plans: true },
        });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase().trim() },
          include: { plans: true },
        });
      }

      if (user) {
        hasPlans = Array.isArray(user.plans) && user.plans.length > 0;
        // If user already has plans in DB, ensure onboardingCompleted is marked true
        if (hasPlans && !user.onboardingCompleted) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              onboardingCompleted: true,
              onboardingCompletedAt: user.onboardingCompletedAt || new Date(),
            },
          });
        }
      }
    } else {
      const cleanEmail = email ? String(email).toLowerCase().trim() : "";
      user = (cleanEmail && memoryUsers.get(cleanEmail)) ||
        Array.from(memoryUsers.values()).find((u) => u.id === userId);
      hasPlans = user?.onboardingCompleted || false;
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const onboardingCompleted = !!user.onboardingCompleted || hasPlans;

    return res.json({
      success: true,
      onboardingCompleted,
      onboardingCompletedAt: user.onboardingCompletedAt ? (typeof user.onboardingCompletedAt === "string" ? user.onboardingCompletedAt : user.onboardingCompletedAt.toISOString()) : undefined,
      onboardingStep: typeof user.onboardingStep === "number" ? user.onboardingStep : 0,
      onboardingData: user.onboardingData || null,
      hasPlans,
    });
  } catch (error: any) {
    console.error("[ONBOARDING STATE] Erro:", error);
    return res.status(500).json({ error: "Erro ao consultar estado de onboarding." });
  }
});

// POST /api/onboarding/progress - Save partial progress
app.post("/api/onboarding/progress", async (req, res) => {
  try {
    const { userId, email, step, onboardingData } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: "userId ou email é obrigatório." });
    }

    let user: any = null;
    const cleanEmail = email ? String(email).toLowerCase().trim() : "";

    if (isDatabaseConnected()) {
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: String(userId) } });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: typeof step === "number" ? step : user.onboardingStep,
          onboardingData: onboardingData !== undefined ? onboardingData : user.onboardingData,
        },
      });

      return res.json({
        success: true,
        onboardingStep: updated.onboardingStep,
        onboardingData: updated.onboardingData,
      });
    } else {
      user = (cleanEmail && memoryUsers.get(cleanEmail)) ||
        Array.from(memoryUsers.values()).find((u) => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (typeof step === "number") user.onboardingStep = step;
      if (onboardingData !== undefined) user.onboardingData = onboardingData;
      memoryUsers.set(user.email.toLowerCase(), user);

      return res.json({
        success: true,
        onboardingStep: user.onboardingStep,
        onboardingData: user.onboardingData,
      });
    }
  } catch (error: any) {
    console.error("[ONBOARDING PROGRESS] Erro ao salvar progresso:", error);
    return res.status(500).json({ error: "Erro ao salvar progresso do onboarding." });
  }
});

// POST /api/onboarding/complete - Create first study plan and mark onboarding completed
app.post("/api/onboarding/complete", async (req, res) => {
  try {
    const { userId, email, onboardingData } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: "userId ou email é obrigatório." });
    }

    if (!onboardingData) {
      return res.status(400).json({ error: "Dados de onboarding são obrigatórios para finalizar." });
    }

    let user: any = null;
    const cleanEmail = email ? String(email).toLowerCase().trim() : "";

    if (isDatabaseConnected()) {
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: String(userId) } });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }
    } else {
      user = (cleanEmail && memoryUsers.get(cleanEmail)) ||
        Array.from(memoryUsers.values()).find((u) => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Build the Plan and Edital data structures
    const planId = `plan-onboarding-${Date.now()}`;
    const editalId = `edital-onboarding-${Date.now()}`;
    const planTitle = onboardingData.concursoName && onboardingData.cargoName
      ? `${onboardingData.concursoName} - ${onboardingData.cargoName}`
      : onboardingData.concursoName || "Meu Primeiro Plano de Estudos";

    const disciplinesList = Array.isArray(onboardingData.disciplines) && onboardingData.disciplines.length > 0
      ? onboardingData.disciplines
      : [
          { id: `disc-1`, name: "Língua Portuguesa", weight: 3, priority: "alta", color: "#249D84" },
          { id: `disc-2`, name: "Raciocínio Lógico-Matemático", weight: 2, priority: "media", color: "#3B82F6" },
          { id: `disc-3`, name: "Direito Constitucional", weight: 3, priority: "alta", color: "#F59E0B" },
          { id: `disc-4`, name: "Direito Administrativo", weight: 3, priority: "alta", color: "#EF4444" },
          { id: `disc-5`, name: "Direito Penal e Processual Penal", weight: 3, priority: "alta", color: "#8B5CF6" },
          { id: `disc-6`, name: "Legislação Extravagante & Específica", weight: 2, priority: "media", color: "#10B981" },
        ];

    const builtDisciplines = disciplinesList.map((d: any, idx: number) => ({
      id: d.id || `disc-${editalId}-${idx + 1}`,
      editalId,
      name: d.name,
      color: d.color || "#249D84",
      iconName: d.iconName || "BookOpen",
      priority: d.priority || (d.weight >= 3 ? "alta" : "media"),
      difficulty: d.difficulty || "medio",
      weight: d.weight || 2,
      targetHours: d.targetHours || 30,
      studiedHours: 0,
    }));

    const builtTopics: any[] = [];
    disciplinesList.forEach((d: any, dIdx: number) => {
      const discId = builtDisciplines[dIdx]?.id || `disc-${editalId}-${dIdx + 1}`;
      const defaultTopics = Array.isArray(d.topics) && d.topics.length > 0
        ? d.topics
        : ["Aspectos Fundamentais e Teoria Inicial", "Tópicos Intermediários e Resolução de Questões", "Revisão Geral e Jurisprudência"];

      defaultTopics.forEach((topName: string, tIdx: number) => {
        builtTopics.push({
          id: `top-${discId}-${tIdx + 1}`,
          disciplineId: discId,
          name: typeof topName === "string" ? topName : `Tópico ${tIdx + 1}`,
          subtopics: [],
          isStudied: false,
          isReviewed: false,
          reviewCount: 0,
          questionsDone: 0,
          questionsCorrect: 0,
          accuracyRate: 0,
          masteryRate: 0,
          notes: "",
          priority: d.priority || "media",
          difficulty: "medio",
        });
      });
    });

    const isWeekly = onboardingData.organizationType === "semanal";
    const weeklyGoalHours = Number(onboardingData.weeklyGoalHours) || 20;

    const cycleSteps = builtDisciplines.map((d: any, index: number) => ({
      id: `step-${index + 1}`,
      disciplineId: d.id,
      targetMinutes: d.weight === 3 ? 90 : d.weight === 1 ? 45 : 60,
      order: index + 1,
    }));

    // Weekly distribution generator
    const weeklyScheduleBlocks: any[] = [];
    const days = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
    const dailyAvail = onboardingData.dailyAvailability || { seg: 3, ter: 3, qua: 3, qui: 3, sex: 3, sab: 4, dom: 1 };
    let discPointer = 0;

    days.forEach((day) => {
      const hours = dailyAvail[day] || 0;
      if (hours > 0) {
        const slotsCount = Math.max(1, Math.round(hours));
        for (let s = 0; s < slotsCount; s++) {
          const disc = builtDisciplines[discPointer % builtDisciplines.length];
          weeklyScheduleBlocks.push({
            id: `block-${day}-${s + 1}`,
            dayOfWeek: day,
            disciplineId: disc.id,
            startHour: 8 + s * 2,
            durationMinutes: 60,
          });
          discPointer++;
        }
      }
    });

    const fullPlanObject = {
      id: planId,
      name: planTitle,
      editalId,
      planningMode: isWeekly ? "WEEKLY" : "CYCLE",
      organizationType: isWeekly ? "semanal" : "ciclo",
      weeklyGoalHours,
      minSessionMinutes: 30,
      maxSessionMinutes: 90,
      completedCycles: 0,
      dailyAvailability: dailyAvail,
      cycle: cycleSteps,
      weeklySchedule: weeklyScheduleBlocks,
      currentCycleIndex: 0,
      currentStepElapsedMinutes: 0,
      active: true,
      createdAt: new Date().toISOString(),
      examDate: onboardingData.examDate || undefined,
    };

    const fullEditalObject = {
      id: editalId,
      title: planTitle,
      organ: onboardingData.organName || onboardingData.concursoName || "Órgão do Concurso",
      banca: onboardingData.bancaName || "Banca Examinadora",
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
      isCustom: true,
      disciplines: builtDisciplines,
      topics: builtTopics,
    };

    let updatedUser: any = user;

    if (isDatabaseConnected()) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.plan.create({
            data: {
              id: planId,
              userId: user.id,
              title: planTitle,
              targetExam: onboardingData.examDate || null,
              targetHours: weeklyGoalHours,
              planningMode: isWeekly ? "WEEKLY" : "CYCLE",
              cycleDataJson: JSON.stringify(fullPlanObject),
              status: "ativo",
            },
          });

          updatedUser = await tx.user.update({
            where: { id: user.id },
            data: {
              onboardingCompleted: true,
              onboardingCompletedAt: new Date(),
              onboardingStep: 8,
              onboardingData,
            },
          });
        });
      } catch (txErr) {
        // If plan already created concurrently, update user safely
        await prisma.plan.upsert({
          where: { id: planId },
          update: {
            title: planTitle,
            targetExam: onboardingData.examDate || null,
            targetHours: weeklyGoalHours,
            cycleDataJson: JSON.stringify(fullPlanObject),
          },
          create: {
            id: planId,
            userId: user.id,
            title: planTitle,
            targetExam: onboardingData.examDate || null,
            targetHours: weeklyGoalHours,
            planningMode: isWeekly ? "WEEKLY" : "CYCLE",
            cycleDataJson: JSON.stringify(fullPlanObject),
            status: "ativo",
          },
        });

        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            onboardingStep: 8,
            onboardingData,
          },
        });
      }
    }

    // Always update memory and save to disk
    const currentMemory = memoryUsers.get(user.email.toLowerCase()) || user;
    currentMemory.onboardingCompleted = true;
    currentMemory.onboardingCompletedAt = new Date();
    currentMemory.onboardingStep = 8;
    currentMemory.onboardingData = onboardingData;
    memoryUsers.set(currentMemory.email.toLowerCase(), currentMemory);
    saveUsersToDisk();

    return res.json({
      success: true,
      message: "Primeiro plano de estudos criado com sucesso e persistido no sistema!",
      plan: fullPlanObject,
      edital: fullEditalObject,
      user: formatUserResponse(updatedUser || currentMemory),
    });
  } catch (error: any) {
    console.error("[ONBOARDING COMPLETE] Erro ao finalizar onboarding:", error);
    return res.status(500).json({ error: error?.message || "Erro ao salvar e criar primeiro plano de estudos." });
  }
});

// POST /api/onboarding/reset - Reset onboarding for user
app.post("/api/onboarding/reset", async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: "userId ou email é obrigatório." });
    }

    let user: any = null;
    const cleanEmail = email ? String(email).toLowerCase().trim() : "";

    if (isDatabaseConnected()) {
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: String(userId) } });
      }
      if (!user && cleanEmail) {
        user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      }

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompleted: false,
          onboardingCompletedAt: null,
          onboardingStep: 0,
          onboardingData: null,
        },
      });

      const currentMemory = memoryUsers.get(user.email.toLowerCase()) || user;
      currentMemory.onboardingCompleted = false;
      currentMemory.onboardingCompletedAt = undefined;
      currentMemory.onboardingStep = 0;
      currentMemory.onboardingData = null;
      memoryUsers.set(currentMemory.email.toLowerCase(), currentMemory);
      saveUsersToDisk();

      return res.json({
        success: true,
        user: formatUserResponse(updated),
      });
    } else {
      user = (cleanEmail && memoryUsers.get(cleanEmail)) ||
        Array.from(memoryUsers.values()).find((u) => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      user.onboardingCompleted = false;
      user.onboardingCompletedAt = undefined;
      user.onboardingStep = 0;
      user.onboardingData = null;
      memoryUsers.set(user.email.toLowerCase(), user);
      saveUsersToDisk();

      return res.json({
        success: true,
        user: formatUserResponse(user),
      });
    }
  } catch (error: any) {
    console.error("[ONBOARDING RESET] Erro:", error);
    return res.status(500).json({ error: "Erro ao resetar onboarding." });
  }
});

// POST /api/auth/register - Sign up with email, bcrypt password & optional voucher
app.post("/api/auth/register", authRateLimiter, async (req, res) => {
  try {
    const { name, email, password, voucherCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPass = String(password).trim();
    const cleanVoucher = voucherCode ? String(voucherCode).toUpperCase().trim() : "";

    if (cleanPass.length < 6) {
      return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });
    }

    const passwordHash = await hashPassword(cleanPass);

    let matchedVoucher: any = null;
    if (cleanVoucher) {
      if (isDatabaseConnected()) {
        matchedVoucher = await prisma.voucher.findFirst({
          where: { code: cleanVoucher },
        });
      }
      if (!matchedVoucher) {
        matchedVoucher = memoryVouchers.get(cleanVoucher);
      }

      if (!matchedVoucher || matchedVoucher.usedCount >= matchedVoucher.maxUses) {
        return res.status(400).json({
          error: "Código de voucher/chave de liberação inválido ou esgotado.",
        });
      }
    }

    let existingUser: any = null;
    if (isDatabaseConnected()) {
      existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    }
    if (!existingUser) {
      existingUser = memoryUsers.get(cleanEmail);
    }

    if (existingUser) {
      if (existingUser.status === "ativo") {
        let updated: any = existingUser;
        if (isDatabaseConnected()) {
          try {
            updated = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: cleanName,
                passwordHash,
              },
            });
          } catch {}
        }
        
        updated = { ...existingUser, name: cleanName, passwordHash };
        memoryUsers.set(cleanEmail, updated);
        saveUsersToDisk();

        return res.json({
          success: true,
          pendingApproval: false,
          user: formatUserResponse(updated, "email"),
          message: "Conta existente atualizada com sucesso! Acesso já liberado.",
        });
      }

      if (matchedVoucher) {
        if (isDatabaseConnected()) {
          try {
            await prisma.voucher.update({
              where: { id: matchedVoucher.id },
              data: { usedCount: { increment: 1 } },
            });

            const updated = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: cleanName,
                passwordHash,
                status: "ativo",
                role: matchedVoucher.role || "aluno_vip",
                notes: `Ativado via Voucher [${matchedVoucher.code}]`,
              },
            });

            matchedVoucher.usedCount += 1;
            memoryVouchers.set(matchedVoucher.code.toUpperCase(), matchedVoucher);
            saveVouchersToDisk();

            const memUpdated = {
              ...existingUser,
              name: cleanName,
              passwordHash,
              status: "ativo",
              role: matchedVoucher.role || "aluno_vip",
              notes: `Ativado via Voucher [${matchedVoucher.code}]`,
            };
            memoryUsers.set(cleanEmail, memUpdated);
            saveUsersToDisk();

            return res.json({
              success: true,
              pendingApproval: false,
              user: formatUserResponse(updated, "email"),
              message: "Conta liberada com sucesso pelo Voucher!",
            });
          } catch {}
        }
        
        matchedVoucher.usedCount += 1;
        memoryVouchers.set(matchedVoucher.code.toUpperCase(), matchedVoucher);
        saveVouchersToDisk();

        const updated = {
          ...existingUser,
          name: cleanName,
          passwordHash,
          status: "ativo",
          role: matchedVoucher.role || "aluno_vip",
          notes: `Ativado via Voucher [${matchedVoucher.code}]`,
        };
        memoryUsers.set(cleanEmail, updated);
        saveUsersToDisk();

        return res.json({
          success: true,
          pendingApproval: false,
          user: formatUserResponse(updated, "email"),
          message: "Conta liberada com sucesso pelo Voucher!",
        });
      }

      if (isDatabaseConnected()) {
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: cleanName,
              passwordHash,
            },
          });
        } catch {}
      }
      
      existingUser.name = cleanName;
      existingUser.passwordHash = passwordHash;
      memoryUsers.set(cleanEmail, existingUser);
      saveUsersToDisk();

      return res.json({
        success: true,
        pendingApproval: true,
        message: "Sua solicitação de cadastro já foi enviada e está aguardando aprovação do administrador.",
      });
    }

    const isApproved = !!matchedVoucher;
    let newUser: any = null;

    if (isDatabaseConnected()) {
      try {
        if (matchedVoucher) {
          await prisma.voucher.update({
            where: { id: matchedVoucher.id },
            data: { usedCount: { increment: 1 } },
          });
        }

        newUser = await prisma.user.create({
          data: {
            name: cleanName,
            email: cleanEmail,
            passwordHash,
            role: matchedVoucher ? matchedVoucher.role : "aluno",
            status: isApproved ? "ativo" : "pendente",
            notes: matchedVoucher
              ? `Liberado automaticamente via Voucher [${matchedVoucher.code}]`
              : "Solicitação via formulário de cadastro web",
          },
        });
      } catch (dbCreateErr) {
        console.warn("[POSTGRES] Erro ao criar usuário no DB:", dbCreateErr);
      }
    }
    
    if (matchedVoucher) {
      matchedVoucher.usedCount += 1;
      memoryVouchers.set(matchedVoucher.code.toUpperCase(), matchedVoucher);
      saveVouchersToDisk();
    }
    
    if (!newUser) {
      newUser = {
        id: `user-${Date.now().toString(36)}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: matchedVoucher ? matchedVoucher.role : "aluno",
        status: isApproved ? "ativo" : "pendente",
        notes: matchedVoucher
          ? `Liberado automaticamente via Voucher [${matchedVoucher.code}]`
          : "Solicitação via formulário de cadastro web",
        createdAt: new Date(),
      };
    }
    
    memoryUsers.set(cleanEmail, newUser);
    saveUsersToDisk();

    const userProfile = formatUserResponse(newUser, "email");

    return res.json({
      success: true,
      pendingApproval: !isApproved,
      user: isApproved ? userProfile : undefined,
      message: isApproved
        ? "Conta criada e ativada com sucesso! Seja bem-vindo ao Projeto Farda."
        : "Cadastro realizado com sucesso! Sua solicitação foi enviada para o painel do administrador e está aguardando liberação.",
    });
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return res.status(500).json({ error: "Erro ao registrar usuário no servidor." });
  }
});

// POST /api/auth/google-auth - Google Login and Whitelist verification
app.post("/api/auth/google-auth", authRateLimiter, async (req, res) => {
  try {
    const { email, name, voucherCode, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail da conta Google é obrigatório." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = name ? String(name).trim() : cleanEmail.split("@")[0];
    const cleanVoucher = voucherCode ? String(voucherCode).toUpperCase().trim() : "";
    const cleanPass = password ? String(password).trim() : "";

    let user: any = null;
    if (isDatabaseConnected()) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    }
    if (!user) {
      user = memoryUsers.get(cleanEmail);
    }

    // Check Master Admin (support both master admin emails)
    if (isMasterAdminEmail(cleanEmail)) {
      if (user) {
        const isMasterPassValid = await verifyPassword(cleanPass, user.passwordHash);

        if (!cleanPass || !isMasterPassValid) {
          return res.json({
            success: false,
            requirePassword: true,
            error: "Esta conta possui privilégios de Administrador Master. Digite sua senha mestre para prosseguir.",
          });
        }

        let updated: any = user;
        if (isDatabaseConnected()) {
          try {
            updated = await prisma.user.update({
              where: { id: user.id },
              data: { role: "admin", status: "ativo", lastLoginAt: new Date() },
            });
          } catch {}
        }
        
        updated.role = "admin";
        updated.status = "ativo";
        updated.lastLoginAt = new Date();
        memoryUsers.set(cleanEmail, updated);
        saveUsersToDisk();

        return res.json({
          success: true,
          user: formatUserResponse(updated, "google"),
        });
      }
    }

    if (user) {
      if (user.status === "bloqueado") {
        return res.status(403).json({
          error: "Acesso bloqueado: Sua conta Google foi suspensa pelo administrador.",
        });
      }

      if (user.status === "pendente") {
        return res.status(403).json({
          error: "Acesso pendente: Sua conta Google está aguardando aprovação do administrador.",
        });
      }

      if (user.accessExpiresAt && new Date() > new Date(user.accessExpiresAt)) {
        return res.status(403).json({
          error: `Seu período de acesso expirou em ${new Date(user.accessExpiresAt).toLocaleDateString("pt-BR")}. Renove seu acesso com o administrador.`,
        });
      }

      let updated: any = user;
      if (isDatabaseConnected()) {
        try {
          updated = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: cleanName || user.name,
              lastLoginAt: new Date(),
            },
          });
        } catch {}
      }
      
      updated.name = cleanName || user.name;
      updated.lastLoginAt = new Date();
      memoryUsers.set(cleanEmail, updated);
      saveUsersToDisk();

      return res.json({
        success: true,
        user: formatUserResponse(updated, "google"),
      });
    }

    if (cleanVoucher) {
      let matchedVoucher: any = null;
      if (isDatabaseConnected()) {
        matchedVoucher = await prisma.voucher.findFirst({
          where: { code: cleanVoucher },
        });
      }
      if (!matchedVoucher) {
        matchedVoucher = memoryVouchers.get(cleanVoucher);
      }

      if (!matchedVoucher || matchedVoucher.usedCount >= matchedVoucher.maxUses) {
        return res.status(400).json({
          error: "Código de voucher/chave de ativação inválido ou esgotado.",
        });
      }

      let newUser: any = null;
      if (isDatabaseConnected()) {
        try {
          await prisma.voucher.update({
            where: { id: matchedVoucher.id },
            data: { usedCount: { increment: 1 } },
          });

          newUser = await prisma.user.create({
            data: {
              name: cleanName,
              email: cleanEmail,
              role: matchedVoucher.role || "aluno_vip",
              status: "ativo",
              notes: `Liberado automaticamente via Voucher Google [${matchedVoucher.code}]`,
              lastLoginAt: new Date(),
            },
          });
        } catch {}
      }
      
      matchedVoucher.usedCount += 1;
      memoryVouchers.set(matchedVoucher.code.toUpperCase(), matchedVoucher);
      saveVouchersToDisk();

      if (!newUser) {
        newUser = {
          id: `user-${Date.now().toString(36)}`,
          name: cleanName,
          email: cleanEmail,
          passwordHash: "",
          role: matchedVoucher.role || "aluno_vip",
          status: "ativo",
          notes: `Liberado automaticamente via Voucher Google [${matchedVoucher.code}]`,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
      
      memoryUsers.set(cleanEmail, newUser);
      saveUsersToDisk();

      return res.json({
        success: true,
        user: formatUserResponse(newUser, "google"),
      });
    }

    return res.status(403).json({
      error:
        "Acesso restrito: A conta Google informada ainda não possui liberação ativa no Projeto Farda. Solicite seu cadastro para que o administrador libere o seu acesso.",
    });
  } catch (error: any) {
    console.error("Erro no login Google:", error);
    return res.status(500).json({ error: "Erro no processamento do login Google." });
  }
});

// Admin Management Endpoints
app.post("/api/auth/admin/users", async (req, res) => {
  try {
    const { name, email, role, status, password, notes, accessExpiresAt, avatarUrl } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios." });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    let existing: any = null;
    if (isDatabaseConnected()) {
      try {
        existing = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
      } catch {}
    }
    if (!existing) {
      existing = memoryUsers.get(cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ error: "Já existe um usuário cadastrado com este e-mail." });
    }

    const passwordHash = await hashPassword(password ? String(password).trim() : "123456");
    const generatedId = `user-${Date.now().toString(36)}`;

    let newUser: any = null;
    if (isDatabaseConnected()) {
      try {
        newUser = await prisma.user.create({
          data: {
            id: generatedId,
            name: String(name).trim(),
            email: cleanEmail,
            avatarUrl: avatarUrl ? String(avatarUrl) : null,
            role: role || "aluno_vip",
            status: status || "ativo",
            passwordHash,
            notes: notes ? String(notes).trim() : "Adicionado pelo Administrador",
            accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
          },
        });
      } catch (dbErr: any) {
        console.warn("[POSTGRES] Erro ao criar usuário admin no DB:", dbErr?.message || dbErr);
      }
    }
    
    if (!newUser) {
      newUser = {
        id: generatedId,
        name: String(name).trim(),
        email: cleanEmail,
        avatarUrl: avatarUrl ? String(avatarUrl) : null,
        role: role || "aluno_vip",
        status: status || "ativo",
        passwordHash,
        notes: notes ? String(notes).trim() : "Adicionado pelo Administrador",
        accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt) : null,
        createdAt: new Date(),
      };
    }
    
    memoryUsers.set(cleanEmail, newUser);
    saveUsersToDisk();

    console.log(`[ACCESS CONTROL] Novo aluno criado com sucesso: ${cleanEmail} (Status=${newUser.status}, Role=${newUser.role})`);

    return res.json({
      success: true,
      user: formatUserResponse(newUser, "email"),
    });
  } catch (error: any) {
    console.error("Erro ao adicionar usuário:", error);
    return res.status(500).json({ error: "Erro ao adicionar usuário no banco de dados." });
  }
});

app.patch("/api/auth/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let user: any = null;
    const cleanEmailUpdate = updates.email ? String(updates.email).toLowerCase().trim() : null;

    if (isDatabaseConnected()) {
      try {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { id },
              ...(cleanEmailUpdate ? [{ email: cleanEmailUpdate }] : [])
            ]
          }
        });
      } catch {}
    }
    if (!user) {
      user = Array.from(memoryUsers.values()).find(
        (u) => u.id === id || (cleanEmailUpdate && u.email.toLowerCase() === cleanEmailUpdate)
      );
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const dataToUpdate: any = {};

    if (updates.email !== undefined) {
      const cleanEmail = String(updates.email).toLowerCase().trim();
      if (!cleanEmail) {
        return res.status(400).json({ error: "O e-mail não pode ser vazio." });
      }
      let emailCollision: any = null;
      if (isDatabaseConnected()) {
        try {
          emailCollision = await prisma.user.findFirst({
            where: { email: cleanEmail, id: { not: user.id } },
          });
        } catch {}
      }
      if (!emailCollision) {
        emailCollision = Array.from(memoryUsers.values()).find(
          (u) => u.email.toLowerCase() === cleanEmail && u.id !== user.id && u.id !== id
        );
      }
      if (emailCollision) {
        return res.status(400).json({ error: "Já existe outro usuário com este e-mail." });
      }
      if (isMasterAdminEmail(user.email) && !isMasterAdminEmail(cleanEmail)) {
        return res.status(400).json({ error: "O e-mail do Administrador Master não pode ser alterado." });
      }
      dataToUpdate.email = cleanEmail;
    }

    if (updates.name !== undefined && String(updates.name).trim()) {
      dataToUpdate.name = String(updates.name).trim();
    }
    if (updates.avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = updates.avatarUrl ? String(updates.avatarUrl) : null;
    }
    if (updates.role !== undefined) {
      dataToUpdate.role = updates.role;
    }
    if (updates.status !== undefined) {
      dataToUpdate.status = updates.status;
    }
    if (updates.password !== undefined && String(updates.password).trim()) {
      dataToUpdate.passwordHash = await hashPassword(String(updates.password).trim());
    }
    if (updates.notes !== undefined) {
      dataToUpdate.notes = String(updates.notes);
    }
    if (updates.accessExpiresAt !== undefined) {
      dataToUpdate.accessExpiresAt = updates.accessExpiresAt ? new Date(updates.accessExpiresAt) : null;
    }

    let updated: any = { ...user, ...dataToUpdate };

    if (isDatabaseConnected()) {
      try {
        // Resilient upsert: updates existing or creates if was only in memory
        updated = await prisma.user.upsert({
          where: { id: user.id },
          update: dataToUpdate,
          create: {
            id: user.id || id,
            name: user.name || "Aluno",
            email: dataToUpdate.email || user.email,
            avatarUrl: dataToUpdate.avatarUrl !== undefined ? dataToUpdate.avatarUrl : user.avatarUrl,
            role: dataToUpdate.role || user.role || "aluno_vip",
            status: dataToUpdate.status || user.status || "ativo",
            passwordHash: dataToUpdate.passwordHash || user.passwordHash || (await hashPassword("123456")),
            notes: dataToUpdate.notes !== undefined ? dataToUpdate.notes : (user.notes || "Atualizado pelo Administrador"),
            accessExpiresAt: dataToUpdate.accessExpiresAt !== undefined ? dataToUpdate.accessExpiresAt : user.accessExpiresAt,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          },
        });
      } catch (dbErr: any) {
        console.warn("[POSTGRES] Aviso no upsert do usuário no DB:", dbErr?.message || dbErr);
      }
    }
    
    if (dataToUpdate.email && dataToUpdate.email !== user.email) {
      memoryUsers.delete(user.email.toLowerCase());
    }
    const finalUser = { ...user, ...dataToUpdate, ...updated };
    memoryUsers.set(finalUser.email.toLowerCase(), finalUser);
    saveUsersToDisk();

    console.log(`[ACCESS CONTROL] Usuário ${finalUser.email} atualizado: Status=${finalUser.status}, Role=${finalUser.role}`);

    return res.json({
      success: true,
      user: formatUserResponse(finalUser, "email"),
    });
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: error.message || "Erro ao atualizar usuário no servidor." });
  }
});

// Cascade user deletion handler
async function handleUserDelete(req: any, res: any) {
  try {
    const { id } = req.params;
    let user: any = null;
    if (isDatabaseConnected()) {
      try {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { id },
              { email: id.toLowerCase().trim() }
            ]
          }
        });
      } catch {}
    }
    if (!user) {
      user = Array.from(memoryUsers.values()).find(
        (u) => u.id === id || u.email.toLowerCase() === id.toLowerCase()
      );
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (isMasterAdminEmail(user.email)) {
      return res.status(400).json({ error: "Não é permitido excluir a conta do Administrador Master." });
    }

    const removedEmail = user.email.toLowerCase().trim();

    if (isDatabaseConnected()) {
      try {
        await prisma.user.deleteMany({
          where: {
            OR: [
              { id: user.id },
              { email: removedEmail }
            ]
          }
        });
      } catch (dbErr: any) {
        console.warn("[POSTGRES] Erro ao deletar no DB:", dbErr?.message || dbErr);
      }
    }
    
    memoryUsers.delete(removedEmail);
    saveUsersToDisk();

    console.log(`[ACCESS CONTROL] Usuário ${removedEmail} excluído com sucesso.`);

    return res.json({ success: true, message: `Usuário ${removedEmail} excluído com sucesso.` });
  } catch (error: any) {
    console.error("Erro ao excluir usuário:", error);
    return res.status(500).json({ error: error.message || "Erro ao excluir usuário no banco de dados." });
  }
}

app.delete("/api/auth/admin/users/:id", handleUserDelete);
app.delete("/api/auth/users/:id", handleUserDelete);

app.post("/api/auth/admin/vouchers", async (req, res) => {
  try {
    const { code, role, maxUses, description, expiresAt } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Código do voucher é obrigatório." });
    }

    const cleanCode = String(code).toUpperCase().trim();
    let existing: any = null;
    if (isDatabaseConnected()) {
      existing = await prisma.voucher.findUnique({
        where: { code: cleanCode },
      });
    }
    if (!existing) {
      existing = memoryVouchers.get(cleanCode);
    }

    if (existing) {
      return res.status(400).json({ error: "Já existe um voucher com este código." });
    }

    let newVoucher: any = null;
    if (isDatabaseConnected()) {
      try {
        newVoucher = await prisma.voucher.create({
          data: {
            code: cleanCode,
            role: role || "aluno_vip",
            maxUses: Number(maxUses) || 10,
            usedCount: 0,
            description: description || "Chave criada pelo administrador",
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });
      } catch {}
    }
    
    if (!newVoucher) {
      newVoucher = {
        id: `voucher-${Date.now().toString(36)}`,
        code: cleanCode,
        role: role || "aluno_vip",
        maxUses: Number(maxUses) || 10,
        usedCount: 0,
        description: description || "Chave criada pelo administrador",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
      };
    }
    
    memoryVouchers.set(cleanCode, newVoucher);
    saveVouchersToDisk();

    return res.json({
      success: true,
      voucher: {
        id: newVoucher.id,
        code: newVoucher.code,
        role: newVoucher.role,
        maxUses: newVoucher.maxUses,
        usedCount: newVoucher.usedCount,
        description: newVoucher.description,
        expiresAt: newVoucher.expiresAt ? (typeof newVoucher.expiresAt === "string" ? newVoucher.expiresAt : newVoucher.expiresAt.toISOString()) : undefined,
        createdAt: typeof newVoucher.createdAt === "string" ? newVoucher.createdAt : newVoucher.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar voucher:", error);
    return res.status(500).json({ error: "Erro ao criar voucher." });
  }
});

app.delete("/api/auth/admin/vouchers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (isDatabaseConnected()) {
      try {
        await prisma.voucher.delete({
          where: { id },
        });
      } catch {}
    }
    
    for (const [code, v] of memoryVouchers.entries()) {
      if (v.id === id) {
        memoryVouchers.delete(code);
        break;
      }
    }
    saveVouchersToDisk();

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir voucher:", error);
    return res.status(500).json({ error: "Erro ao excluir voucher." });
  }
});

// Admin Email Configuration Endpoints
app.get("/api/auth/admin/email-config", (_req, res) => {
  try {
    const config = getEmailConfig();
    // Return sanitized config (do not leak password in plaintext)
    return res.json({
      success: true,
      config: {
        provider: config.provider,
        smtpHost: config.smtpHost || "",
        smtpPort: config.smtpPort || 587,
        smtpUser: config.smtpUser || "",
        smtpHasPass: !!config.smtpPass,
        smtpSecure: !!config.smtpSecure,
        resendHasKey: !!config.resendApiKey,
        senderEmail: config.senderEmail || "contato@projetofarda.com.br",
        senderName: config.senderName || "Projeto Farda",
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao consultar configurações de e-mail." });
  }
});

app.post("/api/auth/admin/email-config", (req, res) => {
  try {
    const {
      provider,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      resendApiKey,
      senderEmail,
      senderName,
    } = req.body;

    const current = getEmailConfig();
    const updated: EmailConfig = {
      provider: provider || current.provider || "auto",
      smtpHost: smtpHost !== undefined ? String(smtpHost).trim() : current.smtpHost,
      smtpPort: smtpPort ? Number(smtpPort) : current.smtpPort || 587,
      smtpUser: smtpUser !== undefined ? String(smtpUser).trim() : current.smtpUser,
      smtpPass: smtpPass ? String(smtpPass).trim() : current.smtpPass,
      smtpSecure: smtpSecure !== undefined ? !!smtpSecure : current.smtpSecure,
      resendApiKey: resendApiKey ? String(resendApiKey).trim() : current.resendApiKey,
      senderEmail: senderEmail !== undefined ? String(senderEmail).trim() : current.senderEmail,
      senderName: senderName !== undefined ? String(senderName).trim() : current.senderName,
    };

    saveEmailConfig(updated);
    console.log("[EMAIL ADMIN] Configuração de e-mail atualizada pelo administrador.");

    return res.json({
      success: true,
      message: "Configurações de e-mail salvas com sucesso!",
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao salvar configurações de e-mail." });
  }
});

app.post("/api/auth/admin/test-email", async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail || typeof targetEmail !== "string") {
      return res.status(400).json({ error: "E-mail de destino para o teste é obrigatório." });
    }

    const cleanTo = targetEmail.toLowerCase().trim();
    const testCode = crypto.randomInt(100000, 999999).toString();

    const emailResult = await sendSystemEmail({
      to: cleanTo,
      subject: "Teste de Envio de E-mail - Projeto Farda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="color: #c5a059; margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 800;">PROJETO FARDA</h2>
            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Teste de Configuração de E-mail</p>
          </div>
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Conexão e Disparo Bem-sucedidos!</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Este é um e-mail de verificação para confirmar que as configurações de disparo do <strong>Projeto Farda</strong> estão ativas e funcionando corretamente.
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Código de Simulação</span>
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${testCode}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 20px;">
            Horário do disparo: ${new Date().toLocaleString("pt-BR")}
          </p>
        </div>
      `,
    });

    if (emailResult.success) {
      return res.json({
        success: true,
        message: `E-mail de teste enviado com sucesso para ${cleanTo} via ${emailResult.provider?.toUpperCase()}!`,
        provider: emailResult.provider,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: emailResult.error || "Falha ao enviar e-mail de teste. Verifique suas credenciais.",
      });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erro no teste de e-mail." });
  }
});

// Password Recovery Endpoint: Request Code (SECURE: SENDS REAL EMAIL VIA DISPATCHER)
app.post("/api/auth/forgot-password", recoveryRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "E-mail válido é obrigatório." });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user: any = null;
    if (isDatabaseConnected()) {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
    } else {
      user = memoryUsers.get(cleanEmail);
    }

    const userExists = !!user;

    if (!userExists) {
      return res.status(404).json({
        error: "E-mail não localizado na base de usuários cadastrados no Projeto Farda.",
      });
    }

    // Generate secure 6-digit verification PIN
    const recoveryCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    recoveryCodesStore.set(cleanEmail, { code: recoveryCode, expiresAt });

    console.log(
      `[AUTH SEGURANÇA] Código de recuperação gerado para ${cleanEmail}: ${recoveryCode} (Válido por 15min)`
    );

    // Dispatch real email via system dispatcher (SMTP or Resend)
    const emailResult = await sendSystemEmail({
      to: cleanEmail,
      subject: "Código de Recuperação de Senha - Projeto Farda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
            <h2 style="color: #c5a059; margin: 0; font-size: 26px; letter-spacing: 2px; font-weight: 800;">PROJETO FARDA</h2>
            <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Sistema de Segurança e Autenticação</p>
          </div>
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Código de Verificação de Senha</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha de acesso à sua plataforma no <strong>Projeto Farda</strong>. Utilize o código de 6 dígitos abaixo para confirmar sua identidade e cadastrar sua nova senha:
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Seu Código de Segurança</span>
            <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${recoveryCode}</span>
          </div>
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
              ⏱ <strong>Validade:</strong> Este código expira em 15 minutos e é de uso único.
            </p>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            • Se você não solicitou a redefinição de senha, por favor ignore este e-mail. Sua conta permanecerá segura.<br />
            • Nunca compartilhe este código com terceiros.
          </p>
          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">Projeto Farda — Preparação de Alto Desempenho Militar</p>
          </div>
        </div>
      `,
    });

    // STRICT SECURITY: We DO NOT return recoveryCode in the client response
    return res.json({
      success: true,
      message: emailResult.success
        ? `Código de verificação enviado com sucesso para ${cleanEmail}.`
        : "Código gerado com sucesso no sistema.",
      emailDispatched: emailResult.success,
      provider: emailResult.provider,
      expiresInMinutes: 15,
    });
  } catch (error: any) {
    console.error("Erro na recuperação de senha:", error);
    return res.status(500).json({ error: "Erro no servidor ao processar recuperação de senha." });
  }
});

// Password Recovery Endpoint: Verify code
app.post("/api/auth/verify-reset-code", authRateLimiter, (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "E-mail e código de recuperação são obrigatórios." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();
    const entry = recoveryCodesStore.get(cleanEmail);

    if (!entry) {
      return res.status(400).json({ error: "Nenhum código de recuperação ativo para este e-mail. Solicite um novo." });
    }

    if (Date.now() > entry.expiresAt) {
      recoveryCodesStore.delete(cleanEmail);
      return res.status(400).json({ error: "O código de recuperação expirou (validade de 15 minutos). Solicite um novo." });
    }

    if (entry.code !== cleanCode) {
      return res.status(400).json({ error: "Código de segurança incorreto. Verifique os dígitos recebidos." });
    }

    return res.json({ success: true, message: "Código validado com sucesso." });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao validar código." });
  }
});

// Password Recovery Endpoint: Complete Reset
app.post("/api/auth/reset-password", authRateLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres." });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = String(code).trim();
    const cleanPass = String(newPassword).trim();
    const entry = recoveryCodesStore.get(cleanEmail);

    if (!entry) {
      return res.status(400).json({ error: "Sessão de recuperação expirada ou inválida. Solicite um novo código." });
    }

    if (Date.now() > entry.expiresAt) {
      recoveryCodesStore.delete(cleanEmail);
      return res.status(400).json({ error: "Código expirado. Solicite um novo código." });
    }

    if (entry.code !== cleanCode) {
      return res.status(400).json({ error: "Código de segurança inválido." });
    }

    // Hash new password
    const passwordHash = await hashPassword(cleanPass);

    // Update password in database or memory store
    if (isDatabaseConnected()) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
          });
        }
      } catch {}
    }
    
    const memUser = memoryUsers.get(cleanEmail);
    if (memUser) {
      memUser.passwordHash = passwordHash;
      memoryUsers.set(cleanEmail, memUser);
      saveUsersToDisk();
    }

    // Remove consumed code
    recoveryCodesStore.delete(cleanEmail);
    console.log(`[AUTH SEGURANÇA] Senha redefinida com sucesso no SQLite via bcrypt para: ${cleanEmail}`);

    return res.json({ success: true, message: "Senha redefinida com sucesso! Você já pode entrar com a nova senha." });
  } catch (error: any) {
    console.error("Erro ao redefinir senha Prisma:", error);
    return res.status(500).json({ error: "Erro ao redefinir senha no servidor." });
  }
});

// AI Endpoint: Verticalize raw syllabus/notice text into structured disciplines and topics
app.post("/api/ai/verticalize-edital", aiRateLimiter, async (req, res) => {
  try {
    const { rawText, contestName, organ } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Texto do edital é obrigatório." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback parser if API key is not yet set
      return res.json({
        success: true,
        isFallback: true,
        data: {
          disciplines: [
            {
              name: "Língua Portuguesa",
              priority: "alta",
              difficulty: "medio",
              weight: 2,
              topics: [
                { name: "Compreensão e interpretação de textos", subtopics: ["Tipologia textual", "Coesão e coerência"] },
                { name: "Ortografia oficial e Acentuação gráfica", subtopics: ["Novo acordo ortográfico", "Regras de acentuação"] },
                { name: "Emprego do sinal indicativo de crase", subtopics: ["Casos obrigatórios", "Casos facultativos", "Casos proibidos"] },
                { name: "Sintaxe da oração e do período", subtopics: ["Termos essenciais", "Termos integrantes", "Concordância verbal e nominal"] }
              ]
            },
            {
              name: "Direito Constitucional",
              priority: "alta",
              difficulty: "medio",
              weight: 3,
              topics: [
                { name: "Direitos e Deveres Fundamentais (Art. 5º)", subtopics: ["Direito à vida e liberdade", "Garantias processuais", "Remédios constitucionais"] },
                { name: "Da Administração Pública (Art. 37 a 41)", subtopics: ["Princípios constitucionais", "Servidores públicos", "Regime disciplinar"] },
                { name: "Da Segurança Pública (Art. 144)", subtopics: ["Órgãos de segurança", "Guardas municipais e competências"] }
              ]
            }
          ]
        }
      });
    }

    const prompt = `Você é um especialista em concursos públicos brasileiros e estruturação de Editais Verticalizados.
Analise o conteúdo programático do edital fornecido a seguir e estruture-o de forma verticalizada, separando por Disciplinas, Assuntos (tópicos principais) e Subassuntos (detalhamento).

Concurso: ${contestName || "Concurso Público"}
Órgão: ${organ || "Órgão Público"}

Texto bruto do edital:
"""
${rawText.slice(0, 15000)}
"""

Extraia todas as disciplinas com seus respectivos tópicos e subassuntos detalhados. Atribua também uma prioridade sugerida ('alta', 'media', 'baixa'), dificuldade ('facil', 'medio', 'dificil') e peso sugerido (1 a 3).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contestTitle: { type: Type.STRING, description: "Título do concurso e cargo" },
            disciplines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome da disciplina (ex: Direito Constitucional)" },
                  priority: { type: Type.STRING, description: "alta, media ou baixa" },
                  difficulty: { type: Type.STRING, description: "facil, medio ou dificil" },
                  weight: { type: Type.NUMBER, description: "Peso sugerido (1, 2 ou 3)" },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Título do assunto/tópico" },
                        subtopics: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Subtópicos detalhados"
                        }
                      },
                      required: ["name", "subtopics"]
                    }
                  }
                },
                required: ["name", "priority", "difficulty", "topics"]
              }
            }
          },
          required: ["disciplines"]
        }
      }
    });

    const parsed = safeJsonParse(response.text, {});
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Erro ao verticalizar edital:", error);
    return res.status(500).json({ error: error.message || "Falha ao processar edital com IA." });
  }
});

// ==========================================
// STUDY PLAN EDITAL FILE PARSER & AI GENERATOR
// ==========================================

// Global Plan Templates Database Setup (Separation of Templates vs UserPlans)
const TEMPLATES_DB_FILE = path.join(process.cwd(), "data", "planos_db.json");

interface GlobalPlanTemplate {
  id: string;
  title: string;
  organ: string;
  banca: string;
  cargo?: string;
  year: number;
  region?: string;
  category?: string;
  examDate?: string;
  vacanciesCount?: number;
  sourceFileName?: string;
  description?: string;
  disciplines: Array<{
    id: string;
    name: string;
    color: string;
    iconName: string;
    priority: "alta" | "media" | "baixa";
    difficulty: "facil" | "medio" | "dificil";
    weight: number;
    targetHours?: number;
  }>;
  topics: Array<{
    id: string;
    disciplineId: string;
    name: string;
    subtopics: string[];
    priority?: "alta" | "media" | "baixa";
    difficulty?: "facil" | "medio" | "dificil";
  }>;
  createdAt: string;
  clonesCount: number;
  isOfficial?: boolean;
  logoUrl?: string;
  officialSourceUrl?: string;
}

interface PlanosDbStructure {
  templates: GlobalPlanTemplate[];
  userPlansMetadata?: Record<string, any>;
}

function loadPlanosDb(): PlanosDbStructure {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(TEMPLATES_DB_FILE)) {
      // Seed default initial templates (50 real public & military exams)
      const initialDb: PlanosDbStructure = { templates: SEED_TEMPLATES as any[] };
      fs.writeFileSync(TEMPLATES_DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }

    const raw = fs.readFileSync(TEMPLATES_DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.templates || !Array.isArray(parsed.templates)) {
      parsed.templates = [];
    }

    // Ensure all seed templates exist in the database and keep programmatic content fresh
    let updated = false;
    for (const seed of SEED_TEMPLATES) {
      const idx = parsed.templates.findIndex(
        (t: any) =>
          t.id === seed.id ||
          (t.title?.toLowerCase().trim() === seed.title.toLowerCase().trim() &&
            t.organ?.toLowerCase().trim() === seed.organ.toLowerCase().trim())
      );
      if (idx === -1) {
        parsed.templates.push(seed);
        updated = true;
      } else {
        if (seed.isOfficial) {
          parsed.templates[idx].disciplines = seed.disciplines;
          parsed.templates[idx].topics = seed.topics;
          parsed.templates[idx].category = seed.category;
          parsed.templates[idx].banca = seed.banca;
          parsed.templates[idx].cargo = seed.cargo || parsed.templates[idx].cargo;
          parsed.templates[idx].description = seed.description || parsed.templates[idx].description;
          updated = true;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(TEMPLATES_DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }

    return parsed;
  } catch (err) {
    console.error("[PLANOS DB] Erro ao carregar planos_db.json:", err);
    return { templates: SEED_TEMPLATES as any[] };
  }
}

function savePlanosDb(data: PlanosDbStructure): void {
  try {
    fs.writeFileSync(TEMPLATES_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[PLANOS DB] Erro ao salvar planos_db.json:", err);
  }
}

// Helper to save a template into the global catalog
function saveTemplateToGlobalCatalog(templateData: Omit<GlobalPlanTemplate, "id" | "createdAt" | "clonesCount">): GlobalPlanTemplate {
  const db = loadPlanosDb();
  const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  // Check if a template with very similar title already exists to avoid exact duplicates
  const existingIdx = db.templates.findIndex(
    (t) => t.title.toLowerCase().trim() === templateData.title.toLowerCase().trim() &&
           t.organ.toLowerCase().trim() === templateData.organ.toLowerCase().trim()
  );

  if (existingIdx >= 0) {
    // Update existing template disciplines/topics while keeping id
    db.templates[existingIdx] = {
      ...db.templates[existingIdx],
      ...templateData,
      disciplines: templateData.disciplines,
      topics: templateData.topics,
    };
    savePlanosDb(db);
    return db.templates[existingIdx];
  }

  const newTemplate: GlobalPlanTemplate = {
    ...templateData,
    id: templateId,
    clonesCount: 1,
    createdAt: new Date().toISOString(),
  };

  db.templates.unshift(newTemplate);
  savePlanosDb(db);
  return newTemplate;
}

// ==========================================
// CATÁLOGO OFICIAL DE EDITAIS REAIS & VERIFICADOS (PostgreSQL / Prisma)
// ==========================================

// Helper to generate a unique clean slug
function generateCatalogSlug(orgao: string, cargo: string, banca: string, ano: number): string {
  const base = `${orgao}-${cargo}-${banca}-${ano}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${base}-${Date.now().toString(36).substr(-4)}`;
}

// ============================================================================
// CATÁLOGO OFICIAL DE EDITAIS PUBLICADOS (PostgreSQL — fonte da verdade)
// Qualquer edital publicado aqui aparece imediatamente como opção de plano
// para todos os usuários, sem depender de serviços externos.
// ============================================================================

// GET /api/catalog/published-editais - Lista editais com status "published"
app.get("/api/catalog/published-editais", async (_req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.json({ success: true, editais: [] });
    }

    const rows = await prisma.publishedEdital.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
    });

    const editais = rows
      .map((row) => safeJsonParse<any>(row.dataJson, null))
      .filter(Boolean);

    return res.json({ success: true, editais });
  } catch (error: any) {
    console.error("[CATALOG DB] Erro ao listar editais publicados:", error);
    return res.json({ success: true, editais: [] });
  }
});

// POST /api/catalog/published-editais - Publica (upsert) um edital completo no catálogo oficial
// Body: { edital: CatalogEdital, cargos: [{ ..., disciplines: [{ ..., topics: [...] }] }] }
app.post("/api/catalog/published-editais", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Banco de dados PostgreSQL não conectado." });
    }

    const { edital, cargos } = req.body || {};
    if (!edital || !edital.id || !edital.title || !edital.institution) {
      return res.status(400).json({ error: "Dados do edital incompletos: id, título e órgão são obrigatórios." });
    }

    const cargosList = Array.isArray(cargos) ? cargos : [];
    const snapshot = {
      ...edital,
      cargosCount: cargosList.length,
      cargos: cargosList,
    };

    const row = {
      id: String(edital.id),
      status: String(edital.status || "published"),
      title: String(edital.title),
      institution: String(edital.institution || ""),
      uf: edital.uf || edital.state || null,
      careerId: edital.careerId || null,
      year: Number(edital.year) || null,
      editalNumber: edital.editalNumber || null,
      board: edital.board || null,
      cargoPretendido: edital.cargoPretendido || null,
      logoUrl: edital.logoUrl || null,
      sourceHash: edital.sourceHash || null,
      dataJson: JSON.stringify(snapshot),
    };

    await prisma.publishedEdital.upsert({
      where: { id: row.id },
      create: row,
      update: { ...row, updatedAt: new Date() },
    });

    return res.json({ success: true, edital: snapshot });
  } catch (error: any) {
    console.error("[CATALOG DB] Erro ao publicar edital:", error);
    return res.status(500).json({ error: error.message || "Erro ao publicar edital no catálogo." });
  }
});

// GET /api/catalog/templates - List all official catalog templates with disciplines & topics
app.get("/api/catalog/templates", async (_req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.json({ success: true, templates: [] });
    }

    const dbTemplates = await prisma.editalTemplate.findMany({
      where: { active: true, verified: true },
      include: {
        disciplines: {
          include: {
            topics: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ verified: "desc" }, { orgao: "asc" }],
    });

    return res.json({ success: true, templates: dbTemplates || [] });
  } catch (error: any) {
    return res.json({ success: true, templates: [] });
  }
});

// GET /api/catalog/templates/:idOrSlug - Get single official template by ID or slug
app.get("/api/catalog/templates/:idOrSlug", async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    if (!isDatabaseConnected()) {
      return res.status(404).json({ error: "Modelo de edital não encontrado." });
    }

    const template = await prisma.editalTemplate.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        disciplines: {
          include: {
            topics: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (template) {
      return res.json({ success: true, template });
    }

    return res.status(404).json({ error: "Modelo de edital não encontrado." });
  } catch (error: any) {
    return res.status(500).json({ error: "Erro ao buscar detalhes do edital." });
  }
});

// POST /api/admin/catalog/templates - Create a new official verified template in PostgreSQL
app.post("/api/admin/catalog/templates", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Banco de dados PostgreSQL não conectado." });
    }

    const {
      orgao,
      sigla,
      cargo,
      esfera,
      banca,
      ano,
      editalNumero,
      logoUrl,
      logoSourceUrl,
      officialSourceUrl,
      sourceVersion,
      description,
      category,
      verified,
      disciplines,
    } = req.body;

    if (!orgao || !cargo || !banca) {
      return res.status(400).json({ error: "Órgão, cargo e banca examinadora são obrigatórios." });
    }

    const slug = generateCatalogSlug(orgao, cargo, banca, ano || new Date().getFullYear());

    // Create EditalTemplate along with its nested disciplines and topics
    const created = await prisma.editalTemplate.create({
      data: {
        slug,
        orgao: String(orgao).trim(),
        sigla: sigla ? String(sigla).trim() : null,
        cargo: String(cargo).trim(),
        esfera: esfera || "Federal",
        banca: String(banca).trim(),
        ano: Number(ano) || new Date().getFullYear(),
        editalNumero: editalNumero ? String(editalNumero).trim() : null,
        logoUrl: logoUrl ? String(logoUrl).trim() : null,
        logoSourceUrl: logoSourceUrl ? String(logoSourceUrl).trim() : null,
        officialSourceUrl: officialSourceUrl ? String(officialSourceUrl).trim() : null,
        verified: !!verified,
        verifiedAt: verified ? new Date() : null,
        sourceVersion: sourceVersion || "Edital de Abertura Consolidado",
        description: description || null,
        category: category || "seguranca_publica",
        active: true,
        disciplines: {
          create: (disciplines || []).map((d: any, dIdx: number) => ({
            name: String(d.name).trim(),
            order: Number(d.order) || dIdx + 1,
            weight: Number(d.weight) || 2,
            topics: {
              create: (d.topics || []).map((t: any, tIdx: number) => ({
                title: String(t.title || t.name).trim(),
                order: Number(t.order) || tIdx + 1,
                level: Number(t.level) || 1,
              })),
            },
          })),
        },
      },
      include: {
        disciplines: {
          include: {
            topics: true,
          },
        },
      },
    });

    return res.json({ success: true, template: created });
  } catch (error: any) {
    console.error("[ADMIN CATALOG] Erro ao criar template:", error);
    return res.status(500).json({ error: error.message || "Erro ao cadastrar modelo de edital." });
  }
});

// PUT /api/admin/catalog/templates/:id - Update an official template
app.put("/api/admin/catalog/templates/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Banco de dados PostgreSQL não conectado." });
    }

    const { id } = req.params;
    const {
      orgao,
      sigla,
      cargo,
      esfera,
      banca,
      ano,
      editalNumero,
      logoUrl,
      logoSourceUrl,
      officialSourceUrl,
      sourceVersion,
      description,
      category,
      verified,
      active,
      disciplines,
    } = req.body;

    const existing = await prisma.editalTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Modelo não encontrado para edição." });
    }

    // Delete existing disciplines to replace with updated structured content
    await prisma.editalDiscipline.deleteMany({ where: { templateId: id } });

    const updated = await prisma.editalTemplate.update({
      where: { id },
      data: {
        orgao: String(orgao).trim(),
        sigla: sigla ? String(sigla).trim() : null,
        cargo: String(cargo).trim(),
        esfera: esfera || existing.esfera,
        banca: String(banca).trim(),
        ano: Number(ano) || existing.ano,
        editalNumero: editalNumero ? String(editalNumero).trim() : null,
        logoUrl: logoUrl ? String(logoUrl).trim() : null,
        logoSourceUrl: logoSourceUrl ? String(logoSourceUrl).trim() : null,
        officialSourceUrl: officialSourceUrl ? String(officialSourceUrl).trim() : null,
        verified: !!verified,
        verifiedAt: verified ? existing.verifiedAt || new Date() : null,
        sourceVersion: sourceVersion || existing.sourceVersion,
        description: description ?? existing.description,
        category: category || existing.category,
        active: active !== undefined ? !!active : existing.active,
        disciplines: {
          create: (disciplines || []).map((d: any, dIdx: number) => ({
            name: String(d.name).trim(),
            order: Number(d.order) || dIdx + 1,
            weight: Number(d.weight) || 2,
            topics: {
              create: (d.topics || []).map((t: any, tIdx: number) => ({
                title: String(t.title || t.name).trim(),
                order: Number(t.order) || tIdx + 1,
                level: Number(t.level) || 1,
              })),
            },
          })),
        },
      },
      include: {
        disciplines: {
          include: {
            topics: true,
          },
        },
      },
    });

    return res.json({ success: true, template: updated });
  } catch (error: any) {
    console.error("[ADMIN CATALOG] Erro ao atualizar template:", error);
    return res.status(500).json({ error: error.message || "Erro ao salvar alterações no edital." });
  }
});

// DELETE /api/admin/catalog/templates/:id - Remove an official template
app.delete("/api/admin/catalog/templates/:id", async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: "Banco de dados PostgreSQL não conectado." });
    }

    const { id } = req.params;
    await prisma.editalTemplate.delete({ where: { id } });
    return res.json({ success: true, message: "Modelo removido com sucesso." });
  } catch (error: any) {
    console.error("[ADMIN CATALOG] Erro ao excluir template:", error);
    return res.status(500).json({ error: "Erro ao excluir modelo de edital." });
  }
});

// GET /api/planos/templates - List all global templates for catalog (backward compatible)
app.get("/api/planos/templates", (_req, res) => {
  try {
    const db = loadPlanosDb();
    return res.json({ success: true, templates: db.templates });
  } catch (error: any) {
    console.error("Erro ao buscar templates:", error);
    return res.status(500).json({ error: "Erro ao carregar catálogo de modelos." });
  }
});

// POST /api/planos/templates - Save/publish a template into the global catalog
app.post("/api/planos/templates", (req, res) => {
  try {
    const { title, organ, banca, cargo, year, region, category, examDate, vacanciesCount, sourceFileName, description, disciplines, topics, isOfficial } = req.body;

    if (!title || !disciplines || !Array.isArray(disciplines) || disciplines.length === 0) {
      return res.status(400).json({ error: "Título e disciplinas estruturadas são obrigatórios para salvar no catálogo." });
    }

    const saved = saveTemplateToGlobalCatalog({
      title: title.trim(),
      organ: organ?.trim() || "Órgão do Concurso",
      banca: banca?.trim() || "Banca Examinadora",
      cargo: cargo?.trim() || undefined,
      year: year || new Date().getFullYear(),
      region: region || "Federal",
      category: category || "Concurso Público",
      examDate: examDate || undefined,
      vacanciesCount: vacanciesCount ? Number(vacanciesCount) : undefined,
      sourceFileName: sourceFileName || undefined,
      description: description || undefined,
      isOfficial: isOfficial || false,
      disciplines: disciplines.map((d: any, idx: number) => ({
        id: d.id || `td-${idx + 1}`,
        name: d.name,
        color: d.color || "#48C3A7",
        iconName: d.iconName || "BookOpen",
        priority: d.priority || "alta",
        difficulty: d.difficulty || "medio",
        weight: Number(d.weight) || 2,
        targetHours: Number(d.targetHours) || 30,
      })),
      topics: (topics || []).map((t: any, idx: number) => ({
        id: t.id || `tt-${idx + 1}`,
        disciplineId: t.disciplineId || "",
        name: t.name,
        subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
        priority: t.priority || "alta",
        difficulty: t.difficulty || "medio",
      })),
    });

    return res.json({ success: true, template: saved });
  } catch (error: any) {
    console.error("Erro ao salvar template:", error);
    return res.status(500).json({ error: error.message || "Erro ao publicar modelo." });
  }
});

// POST /api/planos/templates/:id/clone - Register a clone action on a template (increment clone count)
app.post("/api/planos/templates/:id/clone", (req, res) => {
  try {
    const { id } = req.params;
    const db = loadPlanosDb();
    const template = db.templates.find((t) => t.id === id);
    if (template) {
      template.clonesCount = (template.clonesCount || 0) + 1;
      savePlanosDb(db);
      return res.json({ success: true, clonesCount: template.clonesCount });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/planos/parse-file - Multi-format extractor (PDF, DOCX/DOC, XLS/XLSX, CSV, TXT)
app.post("/api/planos/parse-file", async (req, res) => {
  try {
    const { fileName, dataBase64, mimeType } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: "Nenhum arquivo enviado para análise." });
    }

    const cleanFileName = fileName || "edital-conteudo";
    const ext = path.extname(cleanFileName).toLowerCase();

    // Strip base64 metadata if present
    const base64Clean = dataBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "O arquivo excede o limite de 25MB." });
    }

    let extractedText = "";
    let format = ext.replace(".", "").toUpperCase() || "TXT";

    if (ext === ".pdf" || mimeType?.includes("pdf") || mimeType === "application/pdf") {
      format = "PDF";
      extractedText = await extractTextFromPdf(buffer);
    } else if (
      ext === ".docx" ||
      ext === ".doc" ||
      mimeType?.includes("word") ||
      mimeType?.includes("officedocument") ||
      mimeType === "application/msword" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      format = ext === ".doc" ? "DOC" : "DOCX";
      try {
        if (typeof mammoth?.extractRawText === "function") {
          const mammothResult = await mammoth.extractRawText({ buffer });
          extractedText = mammothResult.value || "";
        } else {
          extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ");
        }
      } catch (docErr) {
        // Fallback for older .doc binary files or corrupt packages
        extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ");
      }
    } else if (
      ext === ".xlsx" ||
      ext === ".xls" ||
      mimeType?.includes("sheet") ||
      mimeType?.includes("excel") ||
      mimeType === "application/vnd.ms-excel" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      format = ext === ".xls" ? "XLS" : "XLSX";
      if (typeof xlsx?.read === "function") {
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetTexts: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (sheet && typeof xlsx.utils?.sheet_to_csv === "function") {
            const csv = xlsx.utils.sheet_to_csv(sheet);
            if (csv.trim()) {
              sheetTexts.push(`[PLANILHA: ${sheetName}]\n` + csv);
            }
          }
        }
        extractedText = sheetTexts.join("\n\n");
      } else {
        extractedText = buffer.toString("utf-8");
      }
    } else if (ext === ".csv" || mimeType?.includes("csv") || mimeType === "text/csv") {
      format = "CSV";
      extractedText = buffer.toString("utf-8");
      if (!extractedText.trim() || extractedText.includes("\ufffd")) {
        extractedText = buffer.toString("latin1");
      }
    } else {
      // Default TXT or plain text
      format = "TXT";
      extractedText = buffer.toString("utf-8");
      if (!extractedText.trim() || extractedText.includes("\ufffd")) {
        extractedText = buffer.toString("latin1");
      }
    }

    // Clean whitespace
    extractedText = extractedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

    if (!extractedText) {
      return res.status(400).json({
        error: "Não foi possível extrair texto do arquivo. Verifique se o documento não é uma imagem digitalizada sem camada de texto.",
      });
    }

    return res.json({
      success: true,
      fileName: cleanFileName,
      format,
      characterCount: extractedText.length,
      text: extractedText,
    });
  } catch (error: any) {
    console.error("[PARSER ERRO] Falha ao analisar arquivo:", error);
    return res.status(500).json({
      error: error.message || "Erro ao processar e extrair o texto do arquivo.",
    });
  }
});

// POST /api/planos/generate-from-edital - AI & Heuristic Parser for Automatic Study Plan Creation
app.post("/api/planos/generate-from-edital", async (req, res) => {
  let parseHeuristically = (): any => ({
    planName: "Plano de Estudos",
    organ: "Órgão do Concurso",
    cargo: "Cargo",
    banca: "Banca",
    category: "Concurso Público",
    disciplines: [],
  });

  try {
    const { text, fileName, categoryHint, organHint } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Texto extraído do edital é obrigatório." });
    }

    const ai = getGeminiClient();

    // Fallback heuristic parser function
    parseHeuristically = () => {
      const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
      const disciplinesMap = new Map<string, Array<{ name: string; subtopics: string[] }>>();
      let currentDisc = "Conhecimentos Gerais";

      const commonDisciplines = [
        "LÍNGUA PORTUGUESA", "PORTUGUÊS", "DIREITO CONSTITUCIONAL", "DIREITO ADMINISTRATIVO",
        "DIREITO PENAL", "DIREITO PROCESSUAL PENAL", "DIREITO CIVIL", "DIREITO PROCESSUAL CIVIL",
        "LEGISLAÇÃO ESPECIAL", "LEGISLAÇÃO INSTITUCIONAL", "LEGISLAÇÃO DE TRÂNSITO",
        "RACIOCÍNIO LÓGICO", "RACIOCÍNIO LÓGICO E MATEMÁTICO", "MATEMÁTICA", "INFORMÁTICA",
        "TECNOLOGIA DA INFORMAÇÃO", "CONTABILIDADE GERAL", "ATUALIDADES", "CONHECIMENTOS GERAIS",
        "CONHECIMENTOS ESPECÍFICOS", "DIREITOS HUMANOS", "CRIMINOLOGIA", "ADMINISTRAÇÃO PÚBLICA",
        "ÉTICA NO SERVIÇO PÚBLICO", "REDAÇÃO OFICIAL"
      ];

      for (const line of lines) {
        const upper = line.toUpperCase().trim();
        const matchedKnown = commonDisciplines.find(
          (cd) => upper === cd || upper.startsWith(cd + ":") || upper.startsWith(cd + " -") || upper.startsWith("DISCIPLINA: " + cd) || upper.startsWith("MATÉRIA: " + cd)
        );

        if (matchedKnown) {
          currentDisc = matchedKnown;
          if (!disciplinesMap.has(currentDisc)) {
            disciplinesMap.set(currentDisc, []);
          }
          continue;
        }

        if (upper.startsWith("#") || upper.startsWith("DISCIPLINA:") || upper.startsWith("MATÉRIA:")) {
          currentDisc = line.replace(/^[#\s]+/, "").replace(/^(disciplina|matéria)\s*[:\-–]?\s*/i, "").trim();
          if (!disciplinesMap.has(currentDisc)) {
            disciplinesMap.set(currentDisc, []);
          }
          continue;
        }

        // Check if CSV format (Discipline; Topic; Subtopics...)
        if (line.includes(";") || (line.includes(",") && line.split(",").length >= 2)) {
          const parts = line.split(/[;,]/).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const disc = parts[0] || currentDisc;
            const topic = parts[1];
            const subtopics = parts.slice(2);
            const list = disciplinesMap.get(disc) || [];
            list.push({ name: topic, subtopics });
            disciplinesMap.set(disc, list);
            continue;
          }
        }

        // Regular numbered or bullet topic
        const topicMatch = line.match(/^(\d+(?:\.\d+)*[\.\-–\)]\s*)(.+)/);
        if (topicMatch) {
          const topicName = topicMatch[2].trim();
          const list = disciplinesMap.get(currentDisc) || [];
          if (topicName.includes(":") || topicName.includes(";")) {
            const subParts = topicName.split(/[:;]/).map((s: string) => s.trim()).filter(Boolean);
            list.push({
              name: subParts[0],
              subtopics: subParts.slice(1),
            });
          } else {
            list.push({ name: topicName, subtopics: [] });
          }
          disciplinesMap.set(currentDisc, list);
          continue;
        }

        if (line.length > 5 && line.length < 160) {
          const list = disciplinesMap.get(currentDisc) || [];
          list.push({ name: line.replace(/^[\-\*•]\s*/, ""), subtopics: [] });
          disciplinesMap.set(currentDisc, list);
        }
      }

      const formattedDisciplines: any[] = [];
      const colors = ["#48C3A7", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981", "#06B6D4", "#EC4899"];
      let dIndex = 0;

      disciplinesMap.forEach((topics, name) => {
        if (topics.length > 0) {
          formattedDisciplines.push({
            name,
            color: colors[dIndex % colors.length],
            priority: "alta",
            difficulty: "medio",
            weight: dIndex < 2 ? 3 : 2,
            targetHours: 30,
            topics: topics.slice(0, 35),
          });
          dIndex++;
        }
      });

      if (formattedDisciplines.length === 0) {
        formattedDisciplines.push(
          {
            name: "Língua Portuguesa",
            color: "#3B82F6",
            priority: "alta",
            difficulty: "medio",
            weight: 2,
            targetHours: 35,
            topics: [
              { name: "Compreensão e Interpretação de Textos", subtopics: ["Tipologia e gêneros textuais", "Coesão e coerência"] },
              { name: "Ortografia e Acentuação Gráfica", subtopics: ["Regras de acentuação", "Emprego do hífen"] },
              { name: "Sintaxe da Oração e do Período", subtopics: ["Termos essenciais e integrantes", "Concordância verbal e nominal"] },
              { name: "Emprego do Sinal Indicativo de Crase", subtopics: ["Casos proibidos", "Casos facultativos e obrigatórios"] }
            ]
          },
          {
            name: "Direito Constitucional",
            color: "#48C3A7",
            priority: "alta",
            difficulty: "medio",
            weight: 3,
            targetHours: 40,
            topics: [
              { name: "Direitos e Deveres Individuais e Coletivos (Art. 5º)", subtopics: ["Direito à vida, liberdade e igualdade", "Remédios constitucionais"] },
              { name: "Da Organização do Estado", subtopics: ["União, Estados, DF e Municípios", "Competências privativas e concorrentes"] },
              { name: "Da Administração Pública (Arts. 37 a 41)", subtopics: ["Princípios da Administração", "Servidores públicos"] }
            ]
          },
          {
            name: "Direito Administrativo",
            color: "#F59E0B",
            priority: "alta",
            difficulty: "dificil",
            weight: 3,
            targetHours: 40,
            topics: [
              { name: "Regime Jurídico Administrativo", subtopics: ["Princípios expressos e implícitos", "Supremacia e indisponibilidade"] },
              { name: "Atos Administrativos", subtopics: ["Requisitos e atributos", "Extinção e revogação"] },
              { name: "Poderes da Administração", subtopics: ["Poder de polícia", "Poder disciplinar e hierárquico"] }
            ]
          }
        );
      }

      const cleanName = (fileName || "").replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      return {
        planName: `Plano de Estudos - ${cleanName || "Edital Importado"}`,
        organ: organHint || "Órgão do Concurso",
        cargo: "Cargo Conforme Edital",
        banca: "Banca Examinadora",
        category: categoryHint || "Concurso Público",
        disciplines: formattedDisciplines,
      };
    };

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        data: parseHeuristically(),
      });
    }

    const prompt = `Você é um mentor e especialista em concursos públicos brasileiros e estruturação de Editais Verticalizados.
Analise com precisão o conteúdo programático ou edital fornecido a seguir e gere um Plano de Estudos completo e verticalizado.

Metadados / Contexto:
- Nome do Arquivo: ${fileName || "edital"}
- Categoria Sugerida: ${categoryHint || "Concurso Público"}
- Órgão Sugerido: ${organHint || ""}

Texto do Edital / Conteúdo:
"""
${text.slice(0, 30000)}
"""

Extraia com fidelidade:
1. planName: Nome atrativo e claro do Plano (ex: "Plano de Estudos - Concurso Oficial", "Preparação Estruturada").
2. organ: Órgão ou Instituição detectada no texto.
3. cargo: Cargo identificado no texto.
4. banca: Banca organizadora (ex: "Cebraspe", "FGV", "Vunesp", "IBFC", "FCC").
5. category: Uma das opções exatas: "Concurso Público", "Concurso Militar", "OAB", "ENEM", "Vestibular", "Residência", "Plano personalizado", "Outro".
6. disciplines: Lista completa das disciplinas identificadas, cada uma com:
   - name: Nome da matéria (ex: "Língua Portuguesa", "Direito Constitucional", "Legislação Institucional").
   - priority: "alta", "media" ou "baixa".
   - difficulty: "facil", "medio" ou "dificil".
   - weight: 1, 2 ou 3.
   - targetHours: Horas sugeridas de estudo (número entre 20 e 60).
   - topics: Lista com os tópicos/assuntos verticais específicos daquela matéria. Para cada tópico, forneça "name" (título do tópico) e "subtopics" (array com detalhamentos/itens).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING, description: "Nome completo do plano de estudos" },
            organ: { type: Type.STRING, description: "Órgão ou instituição" },
            cargo: { type: Type.STRING, description: "Cargo ou especialidade" },
            banca: { type: Type.STRING, description: "Banca examinadora" },
            category: { type: Type.STRING, description: "Categoria do plano" },
            examDate: { type: Type.STRING, description: "Data da prova no formato YYYY-MM-DD se encontrada" },
            disciplines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome da disciplina" },
                  priority: { type: Type.STRING, description: "alta, media ou baixa" },
                  difficulty: { type: Type.STRING, description: "facil, medio ou dificil" },
                  weight: { type: Type.NUMBER, description: "Peso (1 a 3)" },
                  targetHours: { type: Type.NUMBER, description: "Meta de horas" },
                  topics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Título do tópico vertical" },
                        subtopics: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "Subtópicos detalhados"
                        }
                      },
                      required: ["name", "subtopics"]
                    }
                  }
                },
                required: ["name", "priority", "difficulty", "topics"]
              }
            }
          },
          required: ["planName", "disciplines"]
        }
      }
    });

    const parsed = safeJsonParse<any>(response.text, {});
    if (!parsed || !parsed.disciplines || !Array.isArray(parsed.disciplines) || parsed.disciplines.length === 0) {
      return res.json({ success: true, data: parseHeuristically() });
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("[AI EDITAL GENERATOR ERRO]:", error);
    return res.json({ success: true, isFallback: true, data: parseHeuristically(), error: error.message });
  }
});

// AI Endpoint: Strategic Study Coach & Diagnostic recommendations
app.post("/api/ai/diagnostics", aiRateLimiter, async (req, res) => {
  try {
    const { stats, weakTopics, totalHours, accuracyRate } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        data: {
          summary: "Com base no seu desempenho atual, recomendamos aumentar o ciclo de resolução de questões nas matérias com taxa de acerto inferior a 70%.",
          keyActions: [
            "Focar em revisões de 24h e 7d para fixar a legislação seca",
            "Resolver baterias de 20 questões por tópico antes de avançar na teoria",
            "Priorizar Direito Administrativo e Raciocínio Lógico nos blocos com maior energia mental"
          ],
          studyRecommendation: "Alocar 60% do tempo em questões comentadas e 40% em teoria sintetizada para os tópicos em alerta vermelho."
        }
      });
    }

    const prompt = `Você é um mentor especialista em aprovação em concursos públicos de alto nível (estratégia ciclo de estudos, curva de esquecimento, Ebbinghaus e resolução de questões).
Analise o diagnóstico do concurseiro:
- Horas totais estudadas: ${totalHours || 0}h
- Taxa global de acertos: ${accuracyRate || 0}%
- Matérias e Tópicos com baixo desempenho: ${JSON.stringify(weakTopics || [])}
- Estatísticas detalhadas: ${JSON.stringify(stats || [])}

Forneça um relatório diagnóstico objetivo e prático em português com:
1. Resumo do diagnóstico (análise de onde o aluno está perdendo pontos valiosos).
2. 3 a 5 Ações prioritárias imediatas para o ciclo de estudos.
3. Plano de ataque para os tópicos críticos (como destravar o percentual de acertos).
4. Dica de revisão espaçada personalizada.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumo executivo do diagnóstico" },
            keyActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Ações prioritárias imediatas"
            },
            studyRecommendation: { type: Type.STRING, description: "Plano tático para os tópicos fracos" },
            revisionTip: { type: Type.STRING, description: "Dica de método de revisão para a semana" }
          },
          required: ["summary", "keyActions", "studyRecommendation"]
        }
      }
    });

    const parsed = safeJsonParse(response.text, {
      summary: "Diagnóstico gerado com sucesso. Concentre-se nas matérias com taxa de acertos abaixo de 75%.",
      keyActions: [
        "Focar em revisões espaçadas de 24h e 7d",
        "Resolver baterias de questões por assunto antes de avançar na teoria",
        "Reforçar os pontos de maior incidência da banca"
      ],
      studyRecommendation: "Equilibre 50% de teoria com 50% de resolução de questões comentadas."
    });
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Erro no diagnóstico IA:", error);
    return res.json({
      success: true,
      isFallback: true,
      data: {
        summary: "Análise diagnóstica: Aumente a frequência de revisões nos tópicos de menor rendimento.",
        keyActions: [
          "Revisar os tópicos com taxa de acertos inferior a 70%",
          "Resolver 15 a 20 questões diárias por disciplina",
          "Priorizar a leitura da legislação e jurisprudência"
        ],
        studyRecommendation: "Direcionar maior carga horária para as disciplinas de maior peso no edital."
      }
    });
  }
});

// AI Endpoint: Generate practice questions with feedback
app.post("/api/ai/generate-questions", aiRateLimiter, async (req, res) => {
  const { discipline = "", topic = "", banca = "Cebraspe/FGV" } = req.body || {};
  try {
    const ai = getGeminiClient();

    const fallbackQuestions = [
      {
        id: 1,
        statement: `Em relação a ${topic || "Direito Constitucional"}, assinale a alternativa correta de acordo com a jurisprudência dominante e a legislação vigente:`,
        options: [
          "É permitida a cassação de direitos políticos em hipóteses extraordinárias de segurança pública.",
          "A criação de guardas municipais é facultativa aos municípios, destinando-se à proteção de seus bens, serviços e instalações.",
          "Os remédios constitucionais são sempre gratuitos para qualquer cidadão, independentemente de comprovação de renda.",
          "A casa é asilo inviolável do indivíduo, não podendo ninguém nela penetrar sem consentimento do morador sob nenhuma hipótese durante a noite."
        ],
        correctIndex: 1,
        explanation: "O art. 144, § 8º da CF/88 estabelece expressamente que os municípios poderão constituir guardas municipais destinadas à proteção de seus bens, serviços e instalações."
      }
    ];

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        data: fallbackQuestions
      });
    }

    const prompt = `Gere 3 questões inéditas no estilo de bancas tradicionais brasileiras (${banca}) para o seguinte conteúdo de concurso:
Disciplina: ${discipline}
Assunto: ${topic}

Cada questão deve conter:
- Enunciado claro e contextualizado (nível médio/difícil de concurso).
- 4 alternativas (A, B, C, D) com apenas 1 correta.
- O índice da alternativa correta (0, 1, 2 ou 3).
- Comentário pedagógico detalhado explicando por que o gabarito está correto e citando dispositivos legais/doutrina pertinentes.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              statement: { type: Type.STRING, description: "Enunciado da questão" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4 alternativas de resposta"
              },
              correctIndex: { type: Type.INTEGER, description: "Índice da alternativa correta (0 a 3)" },
              explanation: { type: Type.STRING, description: "Comentário e justificativa do gabarito" }
            },
            required: ["id", "statement", "options", "correctIndex", "explanation"]
          }
        }
      }
    });

    const parsed = safeJsonParse(response.text, fallbackQuestions);
    return res.json({ success: true, data: Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackQuestions });
  } catch (error: any) {
    console.error("Erro ao gerar questões:", error);
    return res.json({
      success: true,
      isFallback: true,
      data: [
        {
          id: 1,
          statement: `A respeito dos conceitos fundamentais de ${discipline || "conteúdo programático"} (${topic || "Geral"}), assinale a opção correta:`,
          options: [
            "A legalidade estrita vincula os atos da Administração Pública aos preceitos da lei.",
            "A discricionariedade confere liberdade irrestrita ao agente público sem observância da finalidade.",
            "Os atos administrativos não gozam de presunção de legitimidade até comprovação em juízo.",
            "A autotutela veda à Administração revogar seus próprios atos por motivo de conveniência."
          ],
          correctIndex: 0,
          explanation: "O princípio da legalidade (art. 37, caput, CF/88) determina que a Administração Pública só pode agir conforme determinado ou autorizado em lei."
        }
      ]
    });
  }
});

// Global error and unhandled rejection guards
process.on("unhandledRejection", (reason, promise) => {
  console.error("[SERVER] Unhandled Rejection capturado:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[SERVER] Uncaught Exception capturado:", error);
});

let httpServer: any = null;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[SERVER] Recebido sinal de encerramento (${signal}). Executando Graceful Shutdown...`);

  if (httpServer) {
    try {
      httpServer.close(() => {
        console.log("[SERVER] Conexões HTTP encerradas com sucesso.");
      });
    } catch (closeErr) {
      console.error("[SERVER] Erro ao fechar servidor HTTP:", closeErr);
    }
  }

  try {
    await prisma.$disconnect();
    console.log("[PRISMA DB] Conexão com o banco de dados PostgreSQL desconectada com segurança.");
  } catch (disconnectErr) {
    console.error("[PRISMA DB] Erro durante $disconnect no shutdown:", disconnectErr);
  }

  setTimeout(() => {
    process.exit(0);
  }, 250);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Vite & Static Asset Handling
async function startServer() {
  logEmailConfigStatus();

  // Strict API 404 Handler - Prevents API calls from falling through to Vite SPA index.html
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `Endpoint da API não encontrado: ${req.method} ${req.path}` });
  });

  // Create HTTP server instance so Vite can attach WebSocket HMR to the same port (3000)
  httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
        watch: {
          ignored: [
            "**/*.db",
            "**/*.db-journal",
            "**/*.db-wal",
            "**/*.db-shm",
            "**/prisma/**",
            "**/data/**",
            "**/dev.db*",
            "**/*.sqlite*",
            "**/*.json",
            "**/node_modules/**",
            "**/dist/**",
          ],
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const startListen = (port: number) => {
    httpServer.listen(port, "0.0.0.0", async () => {
      isServerReady = true;
      console.log(`Plataforma de Estudos Server running on http://localhost:${port}`);
      await testDatabaseConnection();
    });
    httpServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && port < 65535) {
        console.warn(`[SERVER] Porta ${port} em uso, tentando ${port + 1}...`);
        httpServer.close();
        startListen(port + 1);
      } else {
        console.error("[SERVER] Erro ao iniciar servidor:", err);
        process.exit(1);
      }
    });
  };

  startListen(PORT);
}

startServer();
