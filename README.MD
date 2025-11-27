# BudLife – Project Guide

## Overview
BudLife ist ein browserbasiertes Cannabis-Grow-Idle-Game auf Next.js 16 (App Router) mit TypeScript und React. Die Spiel-UI läuft unter `/game`, eine Landing Page mit Login/Registration unter `/`. Server-Persistence erfolgt tenant-sicher über Prisma/Postgres; lokal wird auf localStorage zurückgegriffen, falls keine Session besteht.

## Tech Stack
- Framework: Next.js 16 (App Router), TypeScript
- State: React state + Immer (mutations via `produce`)
- Styling: Global CSS (Dark/Light Themes), Flaticon Icons
- Persistence: Prisma + Postgres (tenant-scoped GameState JSON) mit localStorage-Fallback

## Core Files & Directories
```text
app/
  components/       # UI components
    tabs/           # Game screens (Farm, Shop, Inventory, etc.)
    ui/             # Generic UI (SpriteIcon, Toasts, etc.)
    HeaderHUD.tsx   # Top bar (Resources, XP, Time)
    SidebarNav.tsx  # Navigation
  game/page.tsx     # Hauptspiel (Tabs, HUD, RightPanel)
  page.tsx          # Landing Page (Login/Register CTAs)
lib/
  game/             # Game logic, data, types
    engine.ts       # Business logic (Immer reducers, tick loop helpers)
    useGameState.tsx# Hook: init, tick loop, server/local save
    data.ts         # Static game data (strains, items, upgrades, etc.)
    types.ts        # Game interfaces
  prisma.ts         # Prisma client singleton
  auth.ts           # Session/JWT helpers (jose + bcrypt)
prisma/schema.prisma# Prisma models (Tenant, User, GameState), binaryTargets ["native","linux-musl"]
public/assets/      # Images & sprites
```

## Routes & UX
- `/` Landing Page mit CTA, Login/Registrierung (Modal + Inline Cards).
- `/game` Spieloberfläche (Tabs, HUD, Right Panel), lädt Spielstand via `/api/game/load`.
- API Auth: `POST /api/auth/register`, `POST /api/auth/login`.
- Game Persistence: `GET /api/game/load`, `POST /api/game/save` (immer `where: { tenantId }`).

## State Management
- `useGameState.tsx` bootstrapt initialen State, versucht Server-Save per Cookie-Session zu laden; fallback auf localStorage. Periodische Saves (15s) an `/api/game/save` bei aktiver Session.
- Alle Mutationen laufen über Immer (`produce`) in `engine.ts`. Beispiel: `return produce(state, draft => { draft.cash += 100; });`

## Backend / Auth (Prisma + Postgres)
- Schema: Tenant (UUID), User (username unique, passwordHash, tenantId), GameState (tenantId unique, JSON data, updatedAt).
- Auth-Cookies: HttpOnly JWT (jose), konfigurierbar über `.env` (`AUTH_SECRET`, `SESSION_COOKIE_NAME`, `COOKIE_SECURE=false` für lokale HTTP-Setups).
- Prisma generator nutzt `binaryTargets = ["native","linux-musl"]` für Alpine/Docker.
- Commands:
  - `npx prisma format && npx prisma generate`
  - `npx prisma migrate dev --name init --schema prisma/schema.prisma`

## Setup
1) `cp .env.example .env` und Variablen anpassen (`DATABASE_URL`, `AUTH_SECRET`, `COOKIE_SECURE`).
2) Prisma: `npx prisma generate` und `npx prisma migrate dev --name init --schema prisma/schema.prisma`.
3) Dev-Server: `npm run dev` (Achtung: in `.env` `POSTGRES_HOST=localhost` für lokalen Start; im Container `db`).

## Docker
- `docker-compose.yml` startet Postgres 16 + Next.js (standalone build).
- Ports: App 3000, Postgres 5432 (override via ENV).
- Build/Run: `docker compose up --build`.

## AI Implementation Notes
- Immer nutzen für Mutationen in `engine.ts`; State nie direkt mutieren.
- Neue Game-Daten ins zentrale `lib/game/data.ts` packen.
- Texte bleiben auf Deutsch.
- Bei Server-Saves immer `where: { tenantId }` verwenden; Session aus Cookie ziehen (`getSession` in `lib/auth.ts`).
- Lokal ohne TLS `COOKIE_SECURE=false` setzen, sonst droppen Browser das Auth-Cookie.
