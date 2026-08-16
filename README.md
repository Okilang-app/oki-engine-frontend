# Oki Creator Localization Engine — Frontend

Next.js frontend for the Oki Creator Localization Engine.

## Stack

- **Next.js** 16.3 (App Router, Turbopack)
- **React** 19
- **TypeScript** 5
- **Tailwind CSS** v4
- **shadcn/ui** components
- **openid-client** v6 — custom Keycloak OIDC flow

## Quick Start

### 1. Prerequisites

- Node.js 20+ (via [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows))
| Backend running on `http://127.0.0.1:8000` (or `8001` if occupied)
- Keycloak running and configured

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
KEYCLOAK_ISSUER=http://127.0.0.1:58080/realms/oki
KEYCLOAK_ID=oki-web
KEYCLOAK_SECRET=your-client-secret-here
```

> The `KEYCLOAK_SECRET` is the **client secret** from the Keycloak `oki-web` client.

### 4. Run dev server

```bash
npm run dev
```

Open http://localhost:3000

### 5. Build for production

```bash
npm run build
```

## Development

### Lint

```bash
npm run lint
```

### Keycloak client setup (one-time)

1. Open Keycloak Admin Console: http://127.0.0.1:58080/admin
2. Log in with the bootstrap admin credentials from `compose.yaml`
3. Select the `oki` realm (or create it)
4. Go to **Clients** → **Create client**
   - Client ID: `oki-web`
   - Client authentication: **ON**
   - Authentication flow: **Standard flow** ✅
   - Root URL: `http://localhost:3000`
   - Valid redirect URIs: `http://localhost:3000/api/auth/callback`
   - Web origins: `http://localhost:3000`
5. Go to the **Credentials** tab, copy the **Client secret** into `.env.local` as `KEYCLOAK_SECRET`

### Test user

A demo user is pre-seeded in the Keycloak `oki` realm:
- **Username**: `engineer`
- **Password**: `OkiTest123!@`

## Project Structure

```
.
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx             # Dashboard
│   │   ├── creators/            # Creator management
│   │   ├── assets/              # Asset upload & library
│   │   ├── projects/            # Localization projects
│   │   ├── translation/         # Translation workspace
│   │   ├── review/              # Review & approval
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── settings/            # Settings / preferences
│   │   └── api/auth/            # Custom OIDC routes
│   │       ├── signin/route.ts  # Initiates PKCE flow
│   │       ├── callback/route.ts # Token exchange
│   │       └── signout/route.ts # Cookie cleanup
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/
│   │       └── app-shell.tsx    # Sidebar + header layout
│   ├── lib/
│   │   ├── auth-config.ts       # openid-client Configuration
│   │   ├── auth-context.tsx     # React auth state provider
│   │   └── api.ts               # Typed API client (fetch wrapper)
│   └── app/
│       ├── globals.css
│       ├── layout.tsx           # Root layout (suppressHydrationWarning)
│       └── page.tsx
├── components.json              # shadcn/ui config
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Auth Flow

The frontend uses a **custom OIDC PKCE** flow via `openid-client` v6 (not Next-Auth):

1. User clicks **Sign in** in the app shell → fetches `/api/auth/signin`
2. Backend API route generates PKCE code challenge + state, redirects to Keycloak
3. User authenticates on Keycloak, is redirected back to `/api/auth/callback?code=...&state=...`
4. Callback route exchanges the code for tokens, stores them in **httpOnly cookies**
5. `api.ts` reads the `access_token` cookie and injects `Authorization: Bearer <token>` on every API request
6. **Sign out** clears all auth cookies

### Cookie names

| Cookie | Purpose | Lifetime |
|---|---|---|
| `access_token` | JWT bearer token for API calls | 1 hour |
| `id_token` | OpenID Connect identity token | 1 hour |
| `oidc_code_verifier` | PKCE verifier (signin only) | 10 min |
| `oidc_state` | CSRF state (signin only) | 10 min |

## API Client

`src/lib/api.ts` is a lightweight typed fetch wrapper:

```ts
import { api } from "@/lib/api";

// Automatic Bearer token injection from cookies
const creators = await api.getCreators();
const creator = await api.getCreator("018f...");
const created = await api.createCreator({ display_name: "...", platform: "youtube", ... });
```

All methods are strongly typed. No `any` types are used.

## Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/creators` | Creator list |
| `/creators/[id]` | Creator detail |
| `/assets` | Asset upload & library |
| `/projects` | Localization projects |
| `/projects/[id]` | Project detail with timeline tabs |
| `/translation` | Translation workspace |
| `/review` | Review & approval |
| `/analytics` | Analytics dashboard |
| `/settings` | Settings / preferences |

## Notes

- **`suppressHydrationWarning`** is set on `<body>` in `layout.tsx` to prevent React hydration mismatch warnings caused by browser extensions (Bitwarden, password managers, etc.) injecting attributes into the DOM.
- The `next-auth` dependency is still in `package.json` but unused. It was abandoned due to beta instability with openid-client v6. Remove it if desired.
