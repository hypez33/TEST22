\# BudLife - Project Context for AI



\## Project Overview

BudLife is a lightweight, browser-based \*\*Cannabis Grow Idle Game\*\* built with \*\*Next.js 16 (App Router)\*\*, \*\*React\*\*, and \*\*TypeScript\*\*.

The game features plant growth simulation, resource management, a dynamic market, inventory systems, and "gacha" style loot boxes (Cases).



\## Tech Stack \& Key Libraries

\- \*\*Framework:\*\* Next.js 16 (App Router)

\- \*\*Language:\*\* TypeScript

\- \*\*State Management:\*\* React `useState` + `Immer` (critical for immutable state updates).

\- \*\*Persistence:\*\* `localStorage` (via `useGameState.tsx`).

\- \*\*Styling:\*\* CSS Modules / Global CSS with extensive CSS variables (Themes: Dark/Light).

\- \*\*Icons:\*\* Flaticon (uicons).



\## Core Architecture



\### 1. State Management (`lib/game/`)

The game relies on a monolithic state object `GameState`.

\- \*\*`types.ts`\*\*: Defines the shape of `GameState`, `Plant`, `Strain`, `Item`, etc.

\- \*\*`useGameState.tsx`\*\*: The React hook that initializes state, handles the game loop (`requestAnimationFrame`), and saves to localStorage. It exposes `actions` to the UI.

\- \*\*`engine.ts`\*\*: Contains the \*\*business logic\*\*. All state transitions happen here using `immer`.

&nbsp;   - \*\*Pattern:\*\* `const action = (state, payload) => produce(state, draft => { ... })`.

&nbsp;   - \*\*The Tick:\*\* `tickState(state, dt)` runs every frame to calculate growth, resource drain, and events.



\### 2. Data Structure (`lib/game/data.ts`)

Static game data is central here. Do not hardcode values in components; add them here.

\- \*\*`STRAINS`\*\*: Cannabis varieties (yield, grow time, rarity).

\- \*\*`ITEMS`\*\*: Tools, upgrades, equipment.

\- \*\*`GROW\_ROOMS`\*\*: Real estate tiers.

\- \*\*`GLOBAL\_UPGRADES`\*\*: Permanent boosts.

\- \*\*`RESEARCH\_TREE`\*\*: Skill tree data.



\### 3. Game Loop Mechanics

\- \*\*Growth Logic:\*\* Located in `advancePlant` inside `engine.ts`.

&nbsp;   - Depends on `water`, `nutrients`, `health`, `light`, and `pest` status.

&nbsp;   - Time is calculated in "Game Days" (`state.gameDaysTotal`).

\- \*\*Market:\*\* Prices fluctuate based on `marketMult` and `qualityPool`.

\- \*\*Inventory:\*\* Items are stored in `state.itemsOwned` (key-value) or `state.seeds`.



\## Directory Map



```text

/app

&nbsp; /components      # UI Components

&nbsp;   /tabs          # Main game screens (Farm, Shop, Inventory, etc.)

&nbsp;   /ui            # Generic UI (SpriteIcon, etc.)

&nbsp;   HeaderHUD.tsx  # Top bar (Resources, XP, Time)

&nbsp;   SidebarNav.tsx # Navigation

&nbsp; page.tsx         # Main Entry, manages active tab

/lib

&nbsp; /game

&nbsp;   data.ts        # Static Data Config (Balancing)

&nbsp;   engine.ts      # Game Logic \& Reducers (Immer)

&nbsp;   types.ts       # TypeScript Interfaces

&nbsp;   useGameState.tsx # Hook \& Persistence

&nbsp;   utils.ts       # Formatters \& Helpers

&nbsp; spriteConfig.ts  # Spritesheet mapping

/public/assets     # Images \& Spritesheets

## Backend & Auth Bootstrap (Prisma + Postgres)

- Prisma models live in `prisma/schema.prisma` and follow a tenant-first design (`Tenant` -> `User`, `GameState` scoped to tenants with `data` as JSON and `updatedAt` timestamp).
- Copy `.env.example` to `.env` and adjust `DATABASE_URL`/Postgres credentials before running migrations.
- Auth secrets: set `AUTH_SECRET` (JWT signing) and optionally `SESSION_COOKIE_NAME`.
- Generate Prisma client & format schema: `npx prisma format && npx prisma generate`.
- Run migrations when ready to persist the schema: `npx prisma migrate dev --name init`.
- Auth endpoints: `POST /api/auth/register` (legt Tenant, User, leeren GameState atomar an, setzt Session-Cookie), `POST /api/auth/login` (Credentials prüfen, Session-Cookie setzen).
- Game persistence endpoints (cookie-auth): `GET /api/game/load`, `POST /api/game/save` (immer `where: { tenantId }` Isolation).
- Frontend Flows: Landing Page unter `/` mit CTA-Modals für Login/Registrierung; nach Erfolg Redirect nach `/game`, wo der Spielstand automatisch per API geladen/gespeichert wird.
- Secure-Cookie Hinweis: In lokalen HTTP-Umgebungen (z.B. docker-compose ohne TLS) setze `COOKIE_SECURE=false`, sonst droppen Browser das Session-Cookie.

## Dockerized Stack

- `docker-compose.yml` provisions `postgres:16-alpine` and builds the Next.js app image via `Dockerfile` (standalone output).
- Default ports: app `3000`, Postgres `5432` (override via env vars).
- Start everything: `docker compose up --build`.

Coding Guidelines for AI

State Updates: ALWAYS use produce from immer when modifying state in engine.ts. Never mutate state directly without produce.



Example: return produce(state, draft => { draft.cash += 100; });



New Content: To add a new item/strain, update types.ts (if structure changes) and add the entry to data.ts. The UI usually auto-renders lists based on data.ts.



Localization: The game text is currently in German (de). Keep new text in German.



Sprites: Plant visuals use SpriteIcon.tsx. Coordinates are defined in spriteConfig.ts or calculated dynamically based on plant stage.



Math: Use clamp and fmtNumber from utils.ts for safe calculations and display.



Key Game Concepts

Grams: Main currency produced by harvesting.



Cash: Currency for buying items/upgrades. Sold grams = Cash.



Haze Points: Prestige currency.



Pests: Mites, Mold, Thrips. Require specific consumables to cure.



Genetics/Breeding: Strains have Rarities (Common -> Legendary). Breeding creates Hybrids.



Common Tasks

Adding a new Tab: Create component in app/components/tabs/, add to TABS list in app/page.tsx.



Modifying Growth Speed: Adjust GAME\_DAY\_REAL\_SECONDS in data.ts or grow value in STRAINS.



Creating an Event: Add to spawnRandomEvent in engine.ts.
