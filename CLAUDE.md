# CLAUDE.md — GudangPro

Sistem Manajemen Inventaris Gudang — full-stack Indonesian warehouse inventory management system.

## Commands

```bash
# Dev servers
pnpm --filter @workspace/api-server run dev   # API server → port 8080 (proxied at /api)
pnpm --filter @workspace/gudangpro run dev    # Frontend → port 19550 (proxied at /)

# Typecheck & build
pnpm run typecheck                            # Full typecheck semua packages
pnpm run build                                # Typecheck + build semua packages

# Codegen & DB
pnpm --filter @workspace/api-spec run codegen # Regenerate API hooks + Zod schemas dari OpenAPI spec
pnpm --filter @workspace/db run push          # Push DB schema changes (dev only)
```

## Required Environment Variables

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session secret (ada tapi tidak aktif dipakai — auth via localStorage) |

## Stack

- **Runtime**: Node.js 24, pnpm workspaces
- **Language**: TypeScript 5.9
- **Frontend**: React 18 + Vite, TailwindCSS 4, wouter (routing), @tanstack/react-query
- **Backend**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API Codegen**: Orval (dari OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Struktur Direktori

```
lib/
  api-spec/openapi.yaml              # Source of truth semua API contracts
  db/src/schema/                     # Drizzle ORM schema tables
  api-client-react/src/generated/   # Generated API hooks + Zod schemas (JANGAN DIEDIT)

artifacts/
  api-server/src/routes/             # Express route handlers
  gudangpro/src/pages/               # React page components
  gudangpro/src/components/layout/   # Sidebar, Topbar, MainLayout

scripts/                             # Utility scripts
```

## Arsitektur

- **Auth**: localStorage-based JWT-like session (bukan server session). Password: SHA-256 + `gudangpro_salt`
- **API-first**: OpenAPI spec → codegen → types + hooks. Server pakai Zod schema yang sama
- **Primary keys**: UUID (text) untuk semua tabel utama. Integer auto-increment hanya untuk junction table
- **Stock mutations**: Semua dalam DB transaction untuk menghindari race condition
- **Theme**: Toggle dark/light hanya untuk main content area. Sidebar selalu dark navy

## Fitur

| Modul | Deskripsi |
|---|---|
| **Auth** | Login username/password, role: ADMIN, MANAGER, OPERATOR |
| **Dashboard** | KPI cards, transaksi terbaru, status gudang, ringkasan stok |
| **Inventaris** | Katalog item, konversi multi-unit, alert stok rendah |
| **Transaksi** | IN / OUT / TRANSFER / ADJUSTMENT dengan stock delta tracking |
| **Reject** | Manajemen batch reject per outlet |
| **Pengaturan** | Gudang, mitra, pengguna, konfigurasi sistem |
| **UI** | Dark/light toggle, jam real-time, global search (Ctrl+K), Bahasa Indonesia |

## Seed Data (Dev)

- Admin: `admin` / `admin123`
- Manager: `manager` / `manager123`
- 2 gudang, 3 item, 2 mitra, 1 transaksi sample

## Workflow Penting

### Ubah API contract
1. Edit `lib/api-spec/openapi.yaml`
2. Jalankan codegen: `pnpm --filter @workspace/api-spec run codegen`
3. Baru edit frontend/server

### Ubah DB schema
1. Edit file di `lib/db/src/schema/`
2. Jalankan: `pnpm --filter @workspace/db run push`

## Gotchas

- **JANGAN** edit `lib/api-client-react/src/generated/` — auto-generated, akan tertimpa
- Selalu jalankan codegen setelah ubah `openapi.yaml` sebelum menyentuh frontend
- `SESSION_SECRET` env ada tapi session server tidak dipakai (auth localStorage)
- Paksa pnpm: root `package.json` menolak npm/yarn via `preinstall` script

## UI Preferences

- Semua teks UI dalam **Bahasa Indonesia**
- **Dark mode** by default
- Sidebar selalu **dark navy** — tidak berubah saat theme toggle
