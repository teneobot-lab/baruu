# GudangPro

Sistem Manajemen Inventaris Gudang — a full-stack Indonesian warehouse inventory management system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/gudangpro run dev` — run the frontend (port 19550, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, TailwindCSS 4, wouter (routing), @tanstack/react-query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema tables
- `lib/api-client-react/src/generated/` — generated API hooks and Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/gudangpro/src/pages/` — React page components
- `artifacts/gudangpro/src/components/layout/` — Sidebar, Topbar, MainLayout

## Architecture decisions

- Auth is localStorage-based JWT-like session (no server sessions). Password hashing: SHA-256 + `gudangpro_salt`.
- The sidebar is always dark (navy) regardless of light/dark theme. Theme toggle only affects the main content area.
- All DB primary keys are UUIDs (text). Auto-increment integers only for junction table IDs.
- Stock mutations happen inside DB transactions to avoid race conditions.
- The API is contract-first: OpenAPI spec → codegen → types + hooks. Server uses the same Zod schemas.

## Product

- **Auth**: Username/password login with role-based access (ADMIN, MANAGER, OPERATOR)
- **Dashboard**: KPI cards, recent transactions, warehouse status, stock summary
- **Inventaris**: Item catalog with multi-unit conversion, low-stock alerts
- **Transaksi**: IN/OUT/TRANSFER/ADJUSTMENT with full stock delta tracking
- **Reject**: Batch reject management per outlet
- **Pengaturan**: Warehouses, partners, users, system config
- **UI**: Dark/light theme toggle, real-time clock widget, global search (Ctrl+K), Bahasa Indonesia

## Seed data

- Admin: `admin` / `admin123`
- Manager: `manager` / `manager123`
- 2 warehouses, 3 items, 2 partners, 1 sample transaction seeded

## User preferences

- All UI text in Bahasa Indonesia
- Dark mode by default
- Sidebar always dark navy regardless of theme

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml before editing frontend
- Run `pnpm --filter @workspace/db run push` after changing schema files
- Do NOT edit `lib/api-client-react/src/generated/` — it's auto-generated
- The `SESSION_SECRET` env var exists but session is localStorage-based (no server sessions)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
