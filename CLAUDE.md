# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BizPlus is a multi-tenant SaaS for appointment booking / business management aimed at the Israeli market. The product UI and all user-facing API messages are in **Hebrew (RTL)**; default timezone is `Asia/Jerusalem` and currency `ILS`. Businesses book appointments via a dashboard, a public booking page, and an automated WhatsApp/SMS/Telegram chatbot.

## Monorepo layout

pnpm workspaces + Turborepo. Four packages:

- `apps/api` — NestJS 10 backend (Prisma 6 + PostgreSQL, Redis, Socket.io). The core of the system. Runs on port **3001**, global route prefix `api/v1`.
- `apps/web` — Business dashboard. React 18 + Vite, MUI 6 (RTL), TanStack Query, Zustand, react-router 7, i18next, FullCalendar. Port **3000**.
- `apps/admin` — Platform super-admin panel (manages tenants/subscriptions). Same stack as web, no i18n. Port **3002**.
- `packages/shared` (`@bizplus/shared`) — Zod schemas, inferred types, constants, utils. **Single source of truth for validation**, imported by both api and web.

## Commands

Run from the repo root unless noted. There is **no test runner and no ESLint** configured — `lint` is a TypeScript type-check (`tsc --noEmit`).

```bash
pnpm dev              # turbo: runs api + web + admin together
pnpm build            # turbo: builds all (respects ^build dependency order)
pnpm lint             # turbo: tsc --noEmit across all packages

# Database (proxied to apps/api via pnpm --filter)
pnpm db:migrate       # prisma migrate dev (create/apply migration locally)
pnpm db:generate      # regenerate Prisma client — run after editing schema.prisma
pnpm db:seed          # ts-node prisma/seed.ts (creates first AdminUser from env)
pnpm db:studio        # Prisma Studio

# Single package
pnpm --filter api run dev        # API only (ts-node, watch via nest)
pnpm --filter web run dev
pnpm --filter api run db:reset   # prisma migrate reset --force (DESTRUCTIVE)
```

Local infra: `docker-compose up -d` starts PostgreSQL 16 (port 5432) and Redis 7 (port 6379). Copy `.env.example` to `.env` at the repo root — `ConfigModule` loads `../../.env` (monorepo root) first, then a local `.env`.

The shared package compiles to `dist/`, but the frontends and the API tsconfig **alias `@bizplus/shared` directly to its `src/index.ts`**, so editing shared code is picked up live in dev without a rebuild. A production API build still needs `pnpm --filter @bizplus/shared build` first (Turbo's `^build` handles this).

## Architecture — the non-obvious parts

### Multi-tenancy is enforced manually, not by middleware
Every tenant-scoped service method takes `tenantId` as its first argument and includes `where: { tenantId }` (or `{ id, tenantId }`) in **every** Prisma query. The `tenantId` comes from the JWT via the `@CurrentTenant()` param decorator in controllers. `PrismaService.enableTenantFilter()` defines a query-extension that would auto-inject `tenantId`, but **it is currently unused** — do not rely on it. When adding queries to tenant data (`Location`, `User`, `Service`, `Provider`, `Customer`, `Appointment`, `Conversation`, `ChannelConfig`, `AuditLog`), you must add the `tenantId` filter yourself or you create a cross-tenant data leak.

### Two parallel identity systems share one JWT strategy
- **Business users** (`User` model, tenant-scoped, roles `OWNER/MANAGER/PROVIDER/RECEPTIONIST`).
- **Platform admins** (`AdminUser` model, roles `SUPER_ADMIN/SUPPORT/VIEWER`), flagged with `isAdmin: true` in the token.

A single `JwtStrategy` (RS256, public/private key pair from env) branches on `payload.isAdmin` to load the right record. Guards:
- `JwtAuthGuard` — base auth; respects the `@Public()` decorator to skip auth.
- `RolesGuard` + `@Roles(...)` — business RBAC.
- `SuperAdminGuard` — admin-only routes.

Guards are applied **per-controller** via `@UseGuards(...)`, not globally. Access tokens last 15m; refresh tokens are random hex stored in `RefreshToken` (7d), rotated on every refresh, delivered via httpOnly cookie. The web client (`apps/web/src/api/client.ts`) auto-refreshes on 401 with a single-flight queue.

### Validation: Zod, not class-validator
Controllers validate request bodies by calling `SomeSchema.parse(body)` using schemas exported from `@bizplus/shared`. The `*Dto` names are TypeScript types inferred from those Zod schemas. `class-validator` is installed and a global `ValidationPipe` runs, but the actual contract lives in `packages/shared/src/validation`. Add/modify request shapes there.

### Real-time via one Socket.io gateway
`AppointmentsGateway` (namespace `/ws`) is the only gateway. It authenticates the JWT on the handshake and joins clients to rooms: `tenant:{tenantId}` (business users), `admin:all` (admins, gets every tenant's events), and `public:{tenantSlug}` (public booking pages). Services push updates with `gateway.emitToTenant(...)` / `emitAvailabilityChange(...)`.

### Booking concurrency
`BookingService.createAppointment` prevents double-booking with a **PostgreSQL advisory lock** (`pg_advisory_xact_lock`) keyed on `provider + date`, taken at the start of a transaction, followed by a time-overlap check. Preserve this pattern when touching booking logic — a naive insert reintroduces race conditions.

### Event-driven side effects
`BookingService` emits domain events (`appointment.created`, `appointment.cancelled`) via `EventEmitter2`. `NotificationsService` listens with `@OnEvent(...)` and sends channel messages (WhatsApp/SMS confirmations). `RemindersService` runs a `@Cron('*/15 * * * *')` job that sends 24h/1h reminders (tracked by `reminder24hSentAt` / `reminder1hSentAt` on `Appointment`). Don't call notification code directly from booking flows; emit an event.

### Chatbot (WhatsApp/Telegram)
Inbound webhook → `ChatbotService.processMessage(tenantSlug, phone, text)`. It runs Hebrew intent detection (`chatbot/conversation/hebrew-nlp.ts`), then dispatches to a flow (`booking.flow`, `cancel.flow`, `my-appointments.flow`). Conversation state is a step machine (`ConversationStep`) persisted in **Redis** via `ConversationService`. New customers are asked for their name before the requested intent proceeds. All bot replies are Hebrew strings.

## Prisma conventions

- Schema: `apps/api/prisma/schema.prisma`. Fields are camelCase in code but mapped to snake_case columns/tables via `@map`/`@@map` — keep this when adding fields.
- After any schema edit: `pnpm db:generate`, then `pnpm db:migrate` to create a migration. Production deploy runs `prisma migrate deploy` (see Dockerfile).
- Appointment availability/calendar queries rely on the composite indexes defined on `Appointment` (e.g. `[providerId, startTime, endTime]`). Keep query `where` clauses aligned with these indexes.

## Conventions to follow

- Controller methods return `{ success: true, data }` (or spread paginated results) — keep this response envelope.
- User-facing error messages (`throw new XxxException('...')`) are written in **Hebrew**; match the surrounding code.
- API responses and DTO contracts should be added to `@bizplus/shared` so the frontend stays in sync.

## Deployment

Dockerized (`Dockerfile`, Node 20 alpine): installs the workspace, builds `@bizplus/shared`, runs `prisma generate`, compiles the API with `tsc -p tsconfig.build.json` to `dist/src/main.js`, and on start runs `prisma migrate deploy` before launching. Configured for Railway (`railway.toml`) and Vercel (frontends). Swagger is served at `/api/docs` in non-production only.
