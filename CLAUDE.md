# CLAUDE.md — BizPlus

This file orients Claude Code sessions to the BizPlus codebase. Read first before editing.

## 1. Project Overview

**BizPlus** is a multi-tenant SaaS for service-based businesses (salons, clinics, studios, etc.) to manage appointments, customers, providers, and multi-channel customer communication (WhatsApp / SMS / Telegram). The product is **Hebrew-first**: RTL UI, Hebrew validation/error messages, `Asia/Jerusalem` timezone, `ILS` currency. Each business is a `Tenant`; all business data is isolated by `tenantId`.

## 2. Monorepo Layout

```
C:\MyProjects\BizPlus\
├── apps/
│   ├── api/      # NestJS 10 backend — port 3001, /api/v1
│   ├── web/      # React 18 + Vite tenant dashboard — port 3000
│   └── admin/    # React 18 + Vite super-admin panel — port 3002
├── packages/
│   └── shared/   # @bizplus/shared — Zod schemas, TS types, enums, helpers
├── docker-compose.yml  # local Postgres 16 + Redis 7
├── Dockerfile          # API image (builds shared → generates Prisma → tsc)
├── railway.toml        # prod deploy (nixpacks)
├── turbo.json          # task orchestration
├── pnpm-workspace.yaml
└── .env.example
```

## 3. Tech Stack

| Layer | Tech |
|---|---|
| Package manager | pnpm 9.15.4, Turbo 2.3.3, TypeScript 5.7.2 |
| Backend | NestJS 10.4, Prisma 6.3, PostgreSQL 16, Redis (ioredis), Socket.IO, Passport-JWT (RS256), Zod, bcrypt, Helmet, Swagger |
| Frontend | React 18.3, Vite 6.1, React Router 7, MUI 6.4 + Emotion, Zustand 5, TanStack Query 5, Axios, i18next (Hebrew), FullCalendar, date-fns / date-fns-tz, stylis-plugin-rtl |
| Shared | Zod 3.24 schemas → DTOs via `z.infer` |
| Integrations | WhatsApp Business API (Meta), Twilio (SMS), Telegram Bot |
| Deploy | Docker Compose (local infra), Railway (API), Vercel (web/admin via `apps/*/vercel.json`) |

## 4. Common Commands

Run from repo root:

```
pnpm install            # install all workspace deps
pnpm dev                # turbo run dev — starts api + web + admin
pnpm build              # turbo run build
pnpm lint               # turbo run lint = tsc --noEmit everywhere
pnpm db:migrate         # prisma migrate dev (apps/api)
pnpm db:generate        # prisma generate
pnpm db:seed            # ts-node prisma/seed.ts — demo data + first admin
pnpm db:studio          # Prisma Studio (visual DB browser)
docker-compose up -d    # start local Postgres + Redis
```

Per-app dev ports: api `3001`, web `3000`, admin `3002`. Vite dev servers proxy `/api` → `http://localhost:3001`.

## 5. Architecture

### 5.1 API (`apps/api`)

- **Entry**: `apps/api/src/main.ts` — global prefix `/api/v1`, Helmet, cookie-parser, CORS for WEB_URL + ADMIN_URL, global `ValidationPipe`, Swagger at `/api/docs` (dev only).
- **Root module**: `apps/api/src/app.module.ts` — loads Config, Schedule (cron), EventEmitter, Throttler (100 req/min), Redis, Database, and 14 feature modules.
- **Feature modules** under `apps/api/src/modules/`:
  `auth`, `tenants`, `locations`, `services`, `providers`, `customers`, `appointments` (incl. `availability.service.ts`, `booking.service.ts`, `appointments.gateway.ts` WebSocket), `dashboard`, `public-booking`, `admin`, `chatbot` (with `flows/`, `conversation/`, `whatsapp/`), `reminders` (cron), `notifications`, `conversations`.
- **Auth**: RS256 JWT, 15min access token in `Authorization: Bearer …`, 7-day refresh token in `httpOnly` cookie. **Two separate keypairs**: `JWT_*` for business users, `ADMIN_JWT_*` for super-admin (admin login at `/auth/admin/login`). `RefreshToken` table tracks active refresh tokens.
- **Guards / decorators** in `apps/api/src/common/`:
  `JwtAuthGuard`, `RolesGuard`, `SuperAdminGuard`; decorators `@Public()`, `@Roles(UserRole.OWNER, …)`, `@CurrentUser()`, `@CurrentTenant()`.
- **Real-time**: Socket.IO via `appointments.gateway.ts` for live calendar updates.
- **Chatbot state**: Redis (per-conversation flow state); flow files in `modules/chatbot/flows/`.

### 5.2 Multi-tenancy

- Every business table has a `tenantId` FK. Always filter Prisma queries by it: `where: { tenantId, … }`.
- Get current tenant in controllers via `@CurrentTenant() tenantId: string` — derived from JWT payload.
- Admin endpoints (`/admin/*`) bypass tenant scope but require `SUPER_ADMIN` role.

### 5.3 Frontend (`apps/web`, `apps/admin`)

- **Entry**: `apps/web/src/main.tsx` — wraps app in RTL Emotion cache, MUI ThemeProvider (`direction: 'rtl'`), React Query, i18next.
- **Routing**: `apps/web/src/App.tsx` — React Router v7, `PrivateRoute` wrapper for `/dashboard`, `/appointments`, `/customers`, `/services`, `/conversations`. Public: `/login`, `/register`.
- **State**: Zustand store at `apps/web/src/stores/auth.store.ts` (persisted to localStorage as `bizplus-auth`); React Query for server state (30s staleTime, 1 retry).
- **API client**: `apps/web/src/api/client.ts` — Axios with `withCredentials: true`, request interceptor injects `Bearer` token, response interceptor auto-refreshes on 401 with a single-flight queue to dedupe concurrent refreshes.
- **Styling**: MUI components with the `sx` prop only. No CSS files, no Tailwind. Theme in `apps/web/src/theme/` — primary `#1976D2`, fonts Heebo/Rubik.
- **i18n**: `apps/web/src/i18n/` — single `locales/he/translation.json`. Admin has no i18n.

### 5.4 Shared package (`packages/shared`)

Imported as `@bizplus/shared` (path `../../packages/shared/src/index.ts`).

- `validation/index.ts` — Zod schemas (`RegisterSchema`, `LoginSchema`, `CreateAppointmentSchema`, etc.) with **Hebrew** error messages. DTOs exported as `z.infer<typeof X>`.
- `types/index.ts` — `BaseEntity` and domain interfaces (`Tenant`, `Appointment`, `Customer`, …).
- `constants/index.ts` — enums (`AppointmentStatus`, `UserRole`, `Channel`, `PlanType`), Hebrew `*_LABELS`, `*_COLORS`, plan tiers, Hebrew days-of-week (Sunday-first).
- `utils/index.ts` — `formatDateHebrew`, `generateSlug`, Israeli-phone normalize, `buildPaginatedResponse<T>`.

## 6. Database

- **Schema**: `apps/api/prisma/schema.prisma` (single file, ~500 lines).
- **Migrations**: `apps/api/prisma/migrations/` — run `pnpm db:migrate` (dev) or `prisma migrate deploy` (prod, baked into Dockerfile CMD).
- **Seed**: `apps/api/prisma/seed.ts` — creates first super-admin from `ADMIN_*` env vars + demo tenant.
- **Table groups**:
  - **Auth/Tenancy**: `Tenant`, `User` (roles: OWNER/MANAGER/PROVIDER/RECEPTIONIST), `RefreshToken`, `AdminUser` (roles: SUPER_ADMIN/SUPPORT/VIEWER).
  - **Business setup**: `Location`, `Service`, `Provider`, M2M tables `ProviderLocation`, `ProviderService`, `ServiceLocation`.
  - **Bookings**: `Customer` (denormalized stats: `totalAppointments`, `totalSpent`, `cancelRate`), `Appointment` (statuses, sources, deposits, recurrence, reminder timestamps), `Schedule` (weekly hours), `ScheduleBreak`.
  - **Messaging**: `Conversation` (per customer/channel, JSON `state` for chatbot), `Message` (INBOUND/OUTBOUND, externalId), `ChannelConfig` (encrypted credentials).
  - **Billing/Admin**: `Subscription`, `Invoice`, `UsageLog`, `AdminAuditLog`, `AuditLog` (tenant-level).
- **Critical indexes on `Appointment`** for availability/calendar perf:
  `[providerId, startTime, endTime]`, `[tenantId, startTime]`, `[tenantId, providerId, startTime]`, `[tenantId, customerId]`, `[tenantId, status]`.
- Money fields use `Decimal(10, 2)`.

### Row-Level Security (RLS) for tenant isolation

Tenant isolation is being moved from application discipline (every query filtered by `tenantId`) to Postgres RLS policies, enforced at the DB layer. Rollout is phased — see `C:\Users\Sergey Kogan\.claude\plans\sequential-hatching-graham.md` for the full plan.

- **Roles**: `bizplus_app` (NOBYPASSRLS, default app traffic), `bizplus_admin` (BYPASSRLS, super-admin/cron/auth), `bizplus` (owner, migrations only).
- **Setup**: roles are created manually per environment via `apps/api/prisma/scripts/setup-roles.sql` — they are NOT a Prisma migration (passwords must not live in schema history).
- **Helper**: `app_current_tenant()` SQL function reads the per-transaction GUC `app.current_tenant_id`.
- **Connections**:
  - `DATABASE_URL` → app traffic (will switch to `bizplus_app` in Phase 3)
  - `DATABASE_ADMIN_URL` → admin/cron/auth (BYPASSRLS)
  - `DATABASE_MIGRATE_URL` → owner, used only by `prisma migrate`

**Current phase**: 1 (RLS enabled in permissive mode — `USING (true)` — no behavior change yet). When extending the schema, new tenant-scoped tables must include their own RLS policy in the migration.

## 7. Conventions & Patterns

### Naming
- Directories and non-component files: **kebab-case** (`public-booking/`, `jwt-auth.guard.ts`).
- React components: **PascalCase** (`LoginPage.tsx`, `AppLayout.tsx`).
- Functions / variables: camelCase; event handlers prefixed `handle*`.

### NestJS feature module
Each module = `<feature>.controller.ts` + `<feature>.service.ts` + `<feature>.module.ts` (+ optional supporting services). Mirror this when adding a new feature.

### Controller pattern
```ts
@Controller('resource')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ResourceController {
  @Get()
  async findAll(@CurrentTenant() tenantId: string, @Query() q) {
    const data = await this.service.findAll(tenantId, q)
    return { success: true, ...data }
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  async create(@CurrentTenant() tenantId: string, @Body() body: unknown) {
    const dto = CreateResourceSchema.parse(body)       // Zod from @bizplus/shared
    return { success: true, data: await this.service.create(tenantId, dto) }
  }
}
```

- Always validate with `Schema.parse(body)` — do not rely on class-validator DTOs for new code (Zod is the project standard via shared schemas).
- Always return `{ success: true, data?, ...pagination? }`.
- Always filter queries by `tenantId`.
- Add Swagger annotations (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`).
- Throw specific NestJS exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`, `BadRequestException`) with **Hebrew** messages — never throw raw `Error`.
- Use `prisma.$transaction` for multi-step writes.

### React pattern
- Functional components + hooks only.
- Use `useAuthStore(s => s.field)` selectors (don't destructure the whole store).
- API calls: `try { await api.x() } catch (err: any) { setError(err?.response?.data?.message ?? 'fallback') }`.
- Wrap all user-facing strings in `useTranslation()` (`t('key')`) — keys live in `apps/web/src/i18n/locales/he/translation.json`.

### Imports order
1. React / framework
2. External libs (`@nestjs/*`, `@mui/*`, `axios`, `zod`)
3. `@bizplus/shared`
4. Relative imports (`../../stores/...`)

### Comments
- Section banners: `// ===== SECTION NAME =====`.
- Hebrew comments are fine and common for business-rule explanations.
- No JSDoc. Default to no comments unless the *why* is non-obvious.

## 7a. Linting & Testing

- **Lint = `tsc --noEmit` only.** No ESLint, Prettier, or Biome. Do **not** add a formatter/linter without asking — the absence is intentional/historical.
- **No test framework is configured.** No Jest/Vitest/Playwright, no `*.spec.ts` files. Do not fabricate test commands and do not claim "tests pass." To verify a change: run the app (`pnpm dev`), exercise the flow, or query the DB via `pnpm db:studio`.

## 8. i18n & RTL

- Default & only locale today: Hebrew (`he`). Constants in `@bizplus/shared` (`*_LABELS`) are Hebrew. Backend exception messages are hardcoded Hebrew.
- RTL handled by: Emotion cache with `stylis-plugin-rtl` (`apps/web/src/theme/rtl-cache.ts`) + MUI `direction: 'rtl'`.
- Adding English/Arabic later means: add `locales/<lang>/translation.json`, translate the `*_LABELS` constants, translate backend exception strings. Not yet done.

## 9. Environment & Deployment

- **Local infra**: `docker-compose up -d` brings up Postgres (`bizplus/bizplus123@localhost:5432/bizplus`) + Redis (`localhost:6379`).
- **Env template**: `.env.example`. Required groups:
  - `DATABASE_URL`, `REDIS_URL`
  - JWT × 2: `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` (+ `_EXPIRES_IN`) and `ADMIN_JWT_PRIVATE_KEY` / `ADMIN_JWT_PUBLIC_KEY` — generate RSA keypairs (snippet in `.env.example`)
  - URLs: `API_URL`, `WEB_URL`, `ADMIN_URL` (used for CORS)
  - Channel integrations: `WHATSAPP_*`, `TWILIO_*`, `TELEGRAM_BOT_TOKEN`
  - `ENCRYPTION_KEY` (32 chars, encrypts stored `ChannelConfig` credentials)
  - Seed admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`
- **Prod deploy**:
  - API → Railway via `railway.toml` (nixpacks; Dockerfile is fallback). Dockerfile CMD = `npx prisma migrate deploy && node dist/src/main.js`.
  - web / admin → Vercel via `apps/*/vercel.json`.

## 10. Working in This Repo (User Preferences)

- **Work directly on files in the main project directory.** Do **not** create git worktrees or temporary branches — the user wants edits to land in-place.
- Prefer editing existing files over creating new ones. Don't add abstractions/wrappers unless the task requires them.
- When adding user-facing strings (validation messages, UI labels, exception text), default to **Hebrew** to match existing code.
- Currency `ILS`, timezone `Asia/Jerusalem` — keep both consistent in any new business logic.
- Don't reach for ESLint/Prettier/Jest "to be helpful" — none are installed.
