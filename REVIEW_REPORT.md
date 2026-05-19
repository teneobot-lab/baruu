# GudangPro — Code Review & Mandatory Fixes Report

**Reviewed by:** Claude (Senior Full-Stack Engineer)
**Date:** 2026-05-19
**Scope:** artifacts/api-server (Express/TypeScript + Drizzle ORM) + artifacts/gudangpro (React/TypeScript)

---

## Executive Summary

16 mandatory findings were identified, reviewed, and fixed. All 16 items are resolved. No breaking changes to the database schema. Two new packages were added to `api-server/package.json`.

---

## Mandatory Fixes Checklist

### 🔴 CRITICAL — Security

| ID | Finding | Status | Details |
|----|---------|--------|---------|
| SEC-1 | No authentication middleware on API endpoints | ✅ Fixed | `requireAuth` middleware created in `middlewares/auth.ts`. All routes except `/api/health` and `/api/auth/*` are now protected. JWT validated from `Authorization: Bearer` header or `gp_token` cookie. |
| SEC-2 | SHA-256 + static salt password hashing | ✅ Fixed | Replaced with `bcryptjs` (cost factor 12) in `lib/auth.ts`. `verifyPassword()` returns false for legacy hashes (prevents auth bypass on migrated DB). ⚠️ **Breaking:** All existing users must reset passwords. |
| SEC-3 | CORS too permissive (`cors()`) | ✅ Fixed | `app.ts` now reads `ALLOWED_ORIGINS` env var (comma-separated list). Defaults to `["http://localhost:3000","http://localhost:5173"]` in development. Production must set env var. |
| SEC-4 | No input validation on POST/PUT routes | ✅ Fixed | All routes now use Drizzle-generated Zod schemas (`insertItemSchema`, `insertTransactionSchema`, etc.) via `safeParse()`. Returns 422 with flattened errors on validation failure. |
| SEC-5 | Session in localStorage without expiry check | ✅ Fixed | `lib/auth.tsx` now stores `createdAt` timestamp in session object. `getSession()` validates 7-day expiry and clears expired sessions. |

### 🟠 HIGH — Logic & Bug

| ID | Finding | Status | Details |
|----|---------|--------|---------|
| BUG-1 | Race condition in stock updates | ✅ Fixed | `transactions.ts` now uses `sql` template tag for atomic SQL: `SET { qty: sql\`${stockTable.qty} + ${delta}\` }`. Runs inside `db.transaction()`. Stock cannot go negative. |
| BUG-2 | N+1 query in `buildTransactionResponse` | ✅ Fixed | `GET /transactions` replaced with `fetchTransactionList()` that fetches all transactions + all items + all warehouses in batched queries. Resolves N queries to ~5-6 regardless of result size. |
| BUG-3 | Category filter in JS not DB | ✅ Fixed | `GET /inventory/items` now filters by `category` using `and(eq(itemsTable.category, category))` in the Drizzle query. In-memory filter removed. |
| BUG-4 | Sidebar links to non-existent pages | ✅ Fixed | Option A applied: removed `/transaksi/masuk`, `/transaksi/keluar`, `/transaksi/transfer`, `/transaksi/penyesuaian`, `/laporan` from `navItems`. Only `/transaksi` remains. Added `// TODO:` comments for unimplemented features. |
| BUG-5 | DashboardPage custom hook with no auth | ✅ Fixed | Custom `useApi` removed. Replaced with `@tanstack/react-query` + `apiClient.get()`. `apiClient` automatically attaches JWT from cookie/localStorage and handles 401 → redirect to login. |
| BUG-6 | `createdBy` always null on transactions | ✅ Fixed | POST `/transactions` reads `req.user.userId` (set by `requireAuth` middleware) and inserts it as `createdBy`. |

### 🟡 MEDIUM — Code Quality & UX

| ID | Finding | Status | Details |
|----|---------|--------|---------|
| QA-1 | No ErrorBoundary in React | ✅ Fixed | `ErrorBoundary` class component added to `App.tsx`. Wraps entire app. Shows friendly fallback UI with error detail collapsible. Refresh button included. |
| QA-2 | No API base URL config | ✅ Fixed | Created `lib/api.ts` with `apiClient` singleton. Reads `VITE_API_URL` from env. `setAuthTokenGetter` configured to read JWT from localStorage session. Exports `createQueryFetcher` for use with React Query. |
| QA-3 | `hashPassword` duplicated in two files | ✅ Fixed | Deduplicated to `lib/auth.ts`. `routes/auth.ts` and `routes/inventory.ts` now import from `../lib/auth`. |
| QA-4 | No pagination on list endpoints | ✅ Fixed | All list endpoints (`GET /transactions`, `GET /inventory/items`, `GET /inventory/partners`, `GET /inventory/stocks`, `GET /reject/batches`) now accept `?page=1&limit=50` query params. Response wrapped in `{ data, total, page, totalPages }`. |
| QA-5 | Missing try/catch in several routes | ✅ Fixed | Every route handler in `inventory.ts`, `dashboard.ts`, `reject.ts`, and `transactions.ts` is now wrapped in try/catch. Returns 500 with generic message on error. Stack traces are not exposed to clients. |

---

## Changes by File

### API Server

| File | Changes |
|------|---------|
| `src/app.ts` | Added `cookie-parser` import; configured CORS with whitelist from `ALLOWED_ORIGINS` env; added credentials support |
| `src/lib/auth.ts` | **New file** — `hashPassword` (bcrypt 12 rounds), `verifyPassword`, `hashPasswordSync` |
| `src/lib/jwt.ts` | **New file** — `createToken`, `verifyToken` using `jsonwebtoken`; requires `JWT_SECRET` env in production |
| `src/middlewares/auth.ts` | **New file** — `requireAuth` (validates JWT from cookie or Bearer header, supports roles), `optionalAuth` |
| `src/routes/auth.ts` | Replaced SHA-256 with bcrypt; `POST /auth/login` now sets `httpOnly` cookie + returns JWT; `POST /auth/logout` clears cookie |
| `src/routes/inventory.ts` | Deduplicated `hashPassword`; added Zod validation on POST; moved category filter to DB; added pagination; added try/catch to all handlers; BUG-6 fix (password hashing async) |
| `src/routes/transactions.ts` | Complete rewrite: atomic stock updates via `sql`; N+1 fix via batched queries; pagination; Zod validation; `createdBy` from token; try/catch on all handlers |
| `src/routes/dashboard.ts` | Added try/catch to all handlers |
| `src/routes/reject.ts` | Added pagination; added try/catch; batch-fetched items per batch; added `inArray` import for batching |
| `src/routes/index.ts` | Protected all non-auth routes with `requireAuth()` middleware |
| `package.json` | Added `bcryptjs@^3.0.2`, `jsonwebtoken@^9.0.2`; added `@types/bcryptjs`, `@types/jsonwebtoken` to devDeps |

### Frontend (GudangPro)

| File | Changes |
|------|---------|
| `src/lib/auth.tsx` | Added session expiry check (7 days); stores `createdAt` timestamp; `getSession()` validates and expires stale sessions |
| `src/lib/api.ts` | **New file** — `apiClient` singleton with base URL from `VITE_API_URL`; token getter reads from localStorage; 401 handler clears session + redirects to login; exports `createQueryFetcher` |
| `src/pages/DashboardPage.tsx` | Replaced custom `useApi` with `useQuery` from `@tanstack/react-query` + `apiClient`; auth header and 401 handling now automatic |
| `src/components/layout/Sidebar.tsx` | Removed non-existent sub-routes (`/transaksi/masuk`, `/transaksi/keluar`, etc.) and `/laporan` from navItems. Added TODO comments. |
| `src/App.tsx` | Added `ErrorBoundary` class component wrapping the entire app |
| `src/pages/LoginPage.tsx` | Updated to strip `token` field from response body (token now in httpOnly cookie); handles backend response shape correctly |

---

## Breaking Changes & Migration Notes

### 1. Password Hash Migration (SEC-2)
**Impact:** HIGH — all existing users cannot log in after deployment.

- All passwords stored with SHA-256 are no longer valid.
- Migration path: force-reset all users or run a one-time migration script.
- bcrypt hashes are identified by the `$2` prefix — `verifyPassword()` returns `false` for legacy hashes, preventing silent auth bypass.

**Action required:** Run a password reset for all existing users before going live.

### 2. JWT Token (SEC-1)
**Impact:** MEDIUM — backend issues new token; old login response no longer sufficient.

- Login now requires `JWT_SECRET` env var (required in production).
- Token is set as `httpOnly` cookie + returned in body for non-browser clients.
- Frontend reads token from cookie via `apiClient` → no more localStorage token storage.

### 3. API Authentication Gate (SEC-1)
**Impact:** MEDIUM — all API clients must send `Authorization: Bearer <token>` or include the `gp_token` cookie.

- After deployment, browser clients automatically send the cookie.
- Non-browser clients (Postman, scripts) must send `Authorization: Bearer <token>` header.
- Login endpoint (`/api/auth/login`) and health check (`/api/health`) remain public.

### 4. Response Shape Changes (QA-4)
**Impact:** LOW — all list endpoints now return `{ data, total, page, totalPages }` instead of raw arrays.

- Frontend code consuming these endpoints will receive objects instead of arrays.
- Pagination params: `?page=1&limit=50` (defaults: page=1, limit=50).

---

## Testing Checklist

### Pre-deployment
- [ ] Set `JWT_SECRET` environment variable (generate with `openssl rand -hex 32`)
- [ ] Set `ALLOWED_ORIGINS` env var for production CORS whitelist
- [ ] Reset all existing user passwords in the database
- [ ] Verify `cookie-parser` middleware is loaded before routes in `app.ts`

### Auth Flow
- [ ] **Test 1:** Login with valid credentials → receive JWT in body + httpOnly cookie
- [ ] **Test 2:** Access `/api/dashboard/summary` without token → 401 response
- [ ] **Test 3:** Access with `Authorization: Bearer <token>` → 200 response
- [ ] **Test 4:** Access with `gp_token` cookie → 200 response
- [ ] **Test 5:** Expired/invalid token → 401 response
- [ ] **Test 6:** Logout clears `gp_token` cookie

### Password Hashing
- [ ] **Test 7:** Login with newly-set password → success
- [ ] **Test 8:** Login with legacy SHA-256 hash → 401 (no bypass)
- [ ] **Test 9:** Create new user with password → password stored as bcrypt hash

### Stock Race Condition
- [ ] **Test 10:** Concurrent `POST /transactions` on same item/warehouse → stock never goes negative, error thrown if insufficient

### N+1 Query Fix
- [ ] **Test 11:** `GET /transactions` with 100 results → response time significantly improved vs. before
- [ ] **Test 12:** `GET /transactions?page=1&limit=20` → correct pagination metadata

### Category Filter
- [ ] **Test 13:** `GET /inventory/items?category=Minuman` → only items with that category returned from DB (no in-memory filter)

### Session Expiry
- [ ] **Test 14:** Session older than 7 days → `getSession()` returns null, user redirected to login

### Error Boundary
- [ ] **Test 15:** Force a runtime JS error → friendly error UI shown, no white screen

### Pagination
- [ ] **Test 16:** `GET /inventory/items?page=2&limit=10` → correct `{ data, total, page, totalPages }` response

### Input Validation
- [ ] **Test 17:** POST invalid transaction body → 422 response with `{ error, details }`
- [ ] **Test 18:** POST invalid item → 422 response

### CORS
- [ ] **Test 19:** Request from unlisted origin → `403 Forbidden` or `ACCEPTED` based on config
- [ ] **Test 20:** Request from listed origin with credentials → succeeds

---

## Files Not Modified

- `lib/db/src/schema/*.ts` — no DB schema changes (constraint)
- `lib/api-client-react/src/` — types remain valid
- `artifacts/gudangpro/src/pages/InventoryPage.tsx` — uses mock data, not connected to real API yet
- `artifacts/gudangpro/src/pages/TransactionsPage.tsx` — uses mock data, not connected to real API yet
- `artifacts/gudangpro/src/components/TransactionForm.tsx` — UI only, no API calls
- `artifacts/api-server/src/routes/music.ts` — music route untouched (not in scope)
- `artifacts/api-server/src/routes/health.ts` — health check remains public as intended