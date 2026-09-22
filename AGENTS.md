# NEXO — Plataforma de Estudos

## Architecture
- **Single-origin app**: Express server (`server.ts`) runs Vite in middleware mode, serving both `/api/*` routes and the React frontend on port 3000.
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4. Entry: `src/main.tsx` → `src/App.tsx`.
- **Backend**: Express API in `server.ts` (single ~5000-line file). Auth, plans, study sessions, backups, AI analysis, email, storage endpoints.
- **Database**: PostgreSQL via Prisma. Schema at `prisma/schema.prisma`, migrations in `prisma/migrations/`.
- **Resilient fallback**: If PostgreSQL is unavailable, the app falls back to in-memory + disk JSON storage (`data/users_db.json`, `data/vouchers_db.json`). It boots and works without a DB, but PostgreSQL is the primary store.
- **Firebase**: Client-side auth + Firestore. Config is hardcoded in `firebase-applet-config.json` — no env vars needed.
- **Supabase**: Server-side avatar storage. Optional — falls back to local disk storage without credentials.

## Dev Setup (docker-compose.base44.yml)
- `postgres:16-alpine` — PostgreSQL with generated credentials.
- `app` (node:22-slim) — bind-mounts source, runs `npm install && npx prisma generate && npx prisma migrate deploy && npm run dev`.
- `npm run dev` = `tsx server.ts` (Vite middleware mode with HMR).
- `CHOKIDAR_USEPOLLING=true` enables file-watch polling for bind-mount compatibility.

## External Secrets (all optional — app boots without them)
- `GEMINI_API_KEY` — Google Gemini AI for study plan analysis. Without it, AI features return a "not configured" error.
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — avatar storage. Without them, local disk storage is used.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — email sending. Without them, email features are disabled.
- `RESEND_API_KEY` — alternative email provider.

## Demo Accounts (seeded automatically)
- `contato.theduarteonline@gmail.com` / `Duarte@2026` — admin
- `joao.v.duarte@outlook.com` / `Duarte@2026` — aluno_vip
- `aluno.policial@projetofarda.com.br` / `123456` — aluno_vip (demo)

## Verification
- Health check: `curl http://localhost:3000/api/health` → `{"status":"ok"}`
- Root page: `curl http://localhost:3000/` → Vite-served React app (look for `/@vite/client` in HTML).
- Prisma migrations: `npx prisma migrate deploy` runs on container startup.
- Type check: `npm run lint` (tsc --noEmit).

## Official Edital Catalog (published editais)
- **Source of truth**: PostgreSQL table `PublishedEdital` (model in `prisma/schema.prisma`). Each row stores the full edital snapshot (cargos + disciplines + topics) in `dataJson`.
- Server API: `GET/POST /api/catalog/published-editais` in `server.ts`. POST upserts by id; GET returns only `status: "published"`.
- Frontend service: `src/lib/serverCatalogService.ts` (`fetchPublishedEditaisFromServer`, `publishEditalToServer`).
- `StudyContext` merges server list + legacy Firestore mirror (`catalogEditais`) and dedupes; the wizard (Step 3) reads embedded `cargos` from the snapshot instead of Firestore subcollections.
- Rule: when an admin publishes an edital in the plan wizard, it is written to PostgreSQL first (visible errors on failure); the Firestore mirror is best-effort. Published editais appear immediately for ALL users.

## Key Files
- `server.ts` — Express API + Vite middleware (the entire backend).
- `src/lib/prisma.ts` — Prisma client singleton with DB connection testing.
- `src/lib/firebase.ts` — Firebase client init (auth + Firestore).
- `src/lib/storage.ts` — Supabase storage with local fallback.
- `src/context/AuthContext.tsx` — client-side auth context.
- `src/context/StudyContext.tsx` — main study data context (large, ~3000 lines).
