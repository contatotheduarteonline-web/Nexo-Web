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
- `app` (node:22-slim) runs `tsx watch server.ts` with Vite middleware/HMR and a private runtime-data volume. The healthcheck verifies both API and live-source HTML.
- Dependency install, `prisma generate` and `prisma migrate deploy` run inline at `app` startup (npm ci only when `package-lock.json` is newer than `node_modules/.package-lock.json`). There is deliberately NO separate one-shot `prepare` service — a completed one-shot leaves an exited container that platform validation reports as a failure.
- `npm run dev` remains `tsx server.ts`; Compose adds the backend watcher.
- `CHOKIDAR_USEPOLLING=true` enables file-watch polling for bind-mount compatibility.

## External Secrets (all optional — app boots without them)
- `GEMINI_API_KEY` — Google Gemini AI for study plan analysis. Without it, AI features return a "not configured" error.
- `SUPABASE_URL` / `SUPABASE_SECRET_KEY` — avatar storage. Without them, local disk storage is used.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — email sending. Without them, email features are disabled.
- `RESEND_API_KEY` — alternative email provider.

## Data preservation
- Never seed personal accounts/vouchers or overwrite existing roles, status, passwords or counters during startup.
- `NEXO_DATA_DIR` holds private runtime JSON, daily backups, template fallback and local images. In production it must be an absolute path outside the checkout on a persistent private disk. In the sandbox it is `/var/lib/nexo` backed by the `private_data` volume.
- Preserve and verify a byte-identical private copy before removing legacy data from Git. Never print record contents or secrets; never run `down -v` or rewrite Git history.
- See `DATA_PROTECTION.md` for migration, recovery, verification results and deployment limitations.

## Verification
- Health check: `curl http://localhost:3000/api/health` → `{"status":"ok"}`
- Root page: `curl http://localhost:3000/` → Vite-served React app (look for `/@vite/client` in HTML).
- Prisma migrations: `npx prisma migrate deploy` runs on container startup.
- Type check: `npm run lint` (tsc --noEmit).
- Private-store checks: `node --import tsx --test src/lib/privateData.test.ts` (synthetic records only; never use real emails/passwords in tests).
- Existing Firestore reads can be verified with the user's replayed session. Successful signup/password recovery and new study writes need an isolated test account; rendering a login form does not verify Firebase login.
- Release blocker: Express administrative endpoints, including `/api/auth/state`, lack server-side authorization. Do not describe the branch as safe for public production solely because data is no longer tracked by Git.

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

## Color System (official palette)
- **Source of truth**: `src/index.css` `:root` — semantic tokens (surfaces, texts, brand blue, amber accent, states, data/chart colors).
- Identity: dark theme only (`html class="dark"`). Blue `#527DFF` = interactive actions/links/selected; amber `#F4B544` = brand accent, metas, attention; success `#2BBF8A`; error `#F16D75`; info `#58A6FF`.
- Tailwind utilities generated via `@theme inline` (bg-surface, bg-brand, text-muted, border-line, bg-success…). Prefer tokens or `dark:`-paired semantic classes; do NOT add new raw HEX to components.
- Soft/border pairs for states: `--*-soft` / `--*-border` (e.g. #15382F/#24634F).
- `src/lib/designSystem.ts` (NEXO_COLORS/DS) is legacy/unused — do not extend it.

## Typography (official scale)
- Global type scale normalized in `src/index.css` (overrides Tailwind utilities platform-wide): xs 12px, sm 13px, base 14px, lg 16px, xl 18px, 2xl 22px, 3xl 26px.
- Canonical classes for new components: `.nx-title` (15px bold, card titles), `.nx-subtitle` (13px), `.nx-body` (14px).
- Page hero (h1) keeps its explicit `text-[32px] sm:text-[36px]` in DashboardView; stat numbers use `num-condensed` sizes — both intentional.
