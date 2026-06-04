# blinkit-clone-seller

## Role
Seller portal. Store owners manage their products, view orders, track earnings, and update store details.

## Active Branch
`main-seller` — all development here; merge to `main` only after team review.

## Stack
- Vite + React + TypeScript
- TanStack Query v5
- React Router v6
- Custom CSS (no Tailwind/shadcn)
- Sonner (toasts)

## Environment
Create `.env.local` before running:
```
VITE_API_BASE_URL=https://nainistore.com
```

## Dev
```bash
bun install
bun run dev        # http://localhost:5175
bun run build
bun run lint
```

## Architecture

### API Layer (`src/api/sellerApi.ts`)
Authenticated fetch helpers for all seller endpoints.
- Auth: `POST /api/seller/login` and `POST /api/seller/register`
- Response envelope: `{ success, data, message }`

### Auth (`src/context/AuthContext.tsx`)
Context providing login state. `RequireAuth` (`src/components/RequireAuth.tsx`) guards protected pages.

### Routing (`src/App.tsx`)
| Route | Page | Purpose |
|-------|------|---------|
| `/auth/login` | `Login` | Seller sign-in |
| `/auth/register` | `Register` | New seller onboarding |
| `/dashboard` | `Dashboard` | Sales stats, recent orders |
| `/orders` | `Orders` | Order list + status updates |
| `/products` | `Products` | Product CRUD (admin approval required) |
| `/store` | `Store` | Store profile / settings |
| `/wallet` | `Wallet` | Earnings, balance, withdrawal requests |
| `/profile` | `Profile` | Seller account details |
| `/notifications` | `Notifications` | Push notification history |

### Key Components
| Component | Purpose |
|-----------|---------|
| `Layout` | Sidebar nav + main content area |
| `StatCard` | Reusable metric card for dashboard |
| `Modal` | Generic modal wrapper |
| `PageHeader` | Consistent page title + breadcrumb |
| `RequireAuth` | Route guard — redirects to login if no token |

## Product Submission Flow
1. Seller creates product via `/products` page
2. Product is saved with `approved: false` (pending review)
3. Admin reviews and approves/rejects in admin dashboard
4. Only approved products appear in the customer app

## Security Notes
- Seller token in localStorage — never log it or expose in UI
- Sellers can only manage their own store's data — backend enforces scope
- All forms must validate client-side (Zod) before submit

## Code Review Reminders
- `RequireAuth` must wrap every route except auth pages
- Product form: validate image URL, price > 0, unit not empty
- Wallet withdrawal needs confirmation dialog before API call

## Test Plan (before merge)
- [ ] `bun run build` zero errors
- [ ] `bun run lint` zero warnings
- [ ] Register, login, add a product, verify pending in admin
- [ ] Update order status, request withdrawal

## Learnings Log
_Update after each sprint or significant fix._

| Date | Learning |
|------|---------|
| 2026-06-04 | Initial exploration. Products submitted here go through admin approval before appearing in customer app. StatCard used for dashboard metrics. Notifications module shared pattern across admin/seller/delivery. |
