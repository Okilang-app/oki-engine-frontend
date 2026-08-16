# Oki Creator Localization Engine — Frontend Architecture

## Overview
The frontend is a Next.js 16 application using the App Router, built with React 19 and TypeScript. UI components are sourced from shadcn/ui (base-ui variant) and styled with Tailwind CSS v4.

## Directory Structure
```
src/
  app/
    page.tsx                    # Dashboard (pipeline overview)
    layout.tsx                  # Root layout with providers
    creators/
      page.tsx                  # Creator list
      [id]/page.tsx             # Creator detail + rights agreements
    assets/
      page.tsx                  # Upload + asset list
    projects/
      page.tsx                  # Project list with progress
      [id]/page.tsx             # Project detail (timeline, translation, review, publish)
    translation/
      page.tsx                  # Translation workspace
    review/
      page.tsx                  # QA + creator review
    analytics/
      page.tsx                  # Metrics dashboard (tabs for creators, videos, languages, campaigns, conversions)
    settings/
      page.tsx                  # API config, notifications, security, integrations
  components/
    layout/
      app-shell.tsx             # Permanent sidebar (desktop) + sheet (mobile)
    ui/                         # shadcn components (auto-generated)
      button.tsx
      card.tsx
      input.tsx
      dialog.tsx
      table.tsx
      tabs.tsx
      badge.tsx
      avatar.tsx
      dropdown-menu.tsx
      toast.tsx
      progress.tsx
      skeleton.tsx
      select.tsx
      form.tsx
      label.tsx
      scroll-area.tsx
      separator.tsx
      sheet.tsx
      switch.tsx
  lib/
    api.ts                      # Typed backend API client
    auth-context.tsx            # Auth state (demo admin user)
    utils.ts                    # cn() utility
```

## State Management
- **Auth**: React Context (`AuthContext`) with a demo admin user
- **Server State**: Direct `fetch` calls via `api.ts` client (no caching layer yet)
- **Local State**: React `useState` / `useReducer` per component

## Key Components

### App Shell (`components/layout/app-shell.tsx`)
- Left sidebar with navigation links grouped by domain
- Mobile: hamburger menu opens a sheet overlay
- Collapsible sections for Discovery, Production, Publishing, Quality, Admin

### API Client (`lib/api.ts`)
- Centralized `request<T>` helper wrapping `fetch`
- Organized into namespaces: `creators`, `agreements`, `assets`, `jobs`, `translations`, `reviews`, `analytics`
- Target: `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`)

### Auth Context (`lib/auth-context.tsx`)
- Provides a mock admin user with full permissions
- In production, should integrate with Keycloak OIDC via `next-auth` or `@auth0/nextjs-auth0`

## Routing
| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Dashboard with pipeline overview |
| `/creators` | Static | Creator list with add dialog |
| `/creators/[id]` | Dynamic | Creator profile + agreements tab |
| `/assets` | Static | File upload + asset list |
| `/projects` | Static | Project list with status badges |
| `/projects/[id]` | Dynamic | Project workflow (timeline, translation, review, publish tabs) |
| `/translation` | Static | Translation workspace |
| `/review` | Static | QA and review decisions |
| `/analytics` | Static | Metrics dashboard with tabs |
| `/settings` | Static | Configuration panels |

## Design System
- **Colors**: shadcn default slate/zinc palette
- **Typography**: System sans-serif via Tailwind defaults
- **Spacing**: Tailwind utility classes
- **Icons**: Lucide React
- **Cards**: shadcn Card with subtle borders
- **Tables**: shadcn Table with hover states
- **Forms**: shadcn Form components

## Communication with Backend
- REST API over HTTP (not tRPC, no GraphQL)
- JSON payloads
- Bearer token auth (currently stubbed)
- Presigned S3 URLs for file uploads

## Planned Improvements
1. Real Keycloak OIDC integration (replace demo auth)
2. React Query / SWR for server state caching
3. Real-time updates via SSE/WebSocket for job progress
4. Drag-and-drop asset upload
5. Video preview player in project detail
6. Dark mode toggle
