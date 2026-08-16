# Oki Creator Localization Engine — Frontend MVP Summary

## Status: MVP Complete (2026-08-15)

### Tech Stack
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (base-ui based)
- **Icons**: Lucide React
- **State**: React Context (auth)

### Pages / Routes
| Route | Description |
|-------|-------------|
| `/` | Dashboard with pipeline metrics and status |
| `/creators` | Creator list with create dialog |
| `/creators/[id]` | Creator detail + rights agreements |
| `/assets` | Asset upload and management |
| `/projects` | Project list with workflow progress |
| `/projects/[id]` | Project detail with timeline, translation, review, publish tabs |
| `/translation` | Translation workspace with segment editing |
| `/review` | Internal QA and creator review interface |
| `/analytics` | Metrics dashboard (creators, videos, languages, campaigns, conversions) |
| `/settings` | API config, notifications, security, integrations |

### API Client (`src/lib/api.ts`)
Typed API client using native `fetch` with these modules:
- `api.creators` — list, get, create
- `api.agreements` — list, approve, revoke
- `api.assets` — list, uploadUrl, completeUpload, validateRights
- `api.jobs` — list, get, analyze, translate, dub, render, cancel, timeline
- `api.translations` — get, reviseSegment
- `api.reviews` — get, approve, reject
- `api.analytics` — creators, videos, languages, campaigns, okiConversions

### Component Architecture
```
src/
  app/                — Next.js App Router pages
  components/
    layout/
      app-shell.tsx   — Sidebar + mobile sheet navigation
    ui/               — shadcn components (auto-generated)
  lib/
    api.ts            — Backend API client
    auth-context.tsx  — Demo auth provider
    utils.ts          — cn() helper
```

### Running Locally
```bash
cd C:\Users\User\oki-engine-frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Environment Variables
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Build Status
```bash
npm run build
# ✓ Compiled successfully
# ✓ TypeScript check passed
# ✓ Static pages generated (9 static + 2 dynamic)
```

### Integration Notes
- Frontend expects backend on `http://127.0.0.1:8000`
- Auth is stubbed with a demo admin user
- API calls use JSON content-type and standard fetch
- File upload uses multipart with presigned S3 URLs via backend
