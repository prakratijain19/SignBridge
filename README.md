# SignBridge

**AI-powered multilingual accessibility platform for Indian Sign Language (ISL) communication.**

SignBridge bridges communication between Deaf / Hard-of-Hearing and hearing
people across four media — sign, speech, text, and a 3D avatar — with
multilingual support (English, Hindi, Gujarati for the MVP).

This repository is built up in phases. **You are looking at the Phase 1
foundation**: an installable, runnable monorepo with a web app, API, ML service
skeleton, database, and CI. Features are added in later phases.

---

## Tech stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo                           |
| Frontend         | Next.js 14 (App Router), React 18, TypeScript, Tailwind |
| Backend          | Node.js, Express, TypeScript                           |
| Database / ORM   | PostgreSQL 16, Prisma                                  |
| ML service       | Python 3.11, FastAPI (training & model export)        |
| Tooling          | Docker Compose, GitHub Actions, ESLint, Prettier      |

> Architecture note: live ISL recognition runs **in the browser**
> (MediaPipe + TensorFlow.js). The Python ML service handles offline training
> and exports models to TF.js. See Phase 0 for the rationale.

## Repository layout

```
signbridge/
├── apps/
│   ├── api/            Express + Prisma API
│   └── web/            Next.js web app
├── packages/
│   ├── shared-types/   Types shared across apps
│   └── tsconfig/       Shared TypeScript configs
├── services/
│   └── ml/             Python/FastAPI ML service
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- **Node.js 20+** and **pnpm 9+** (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- **Docker** (for PostgreSQL) — or a local PostgreSQL 16 instance
- **Python 3.11+** (only if working on the ML service)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
pnpm docker:up                 # starts only the `db` service

# 3. Create local env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Apply the database schema
pnpm db:migrate                # creates the initial migration + tables

# 5. Run everything in dev mode
pnpm dev
```

- Web app → http://localhost:3000
- API health → http://localhost:4000/api/health
- ML service (optional) → http://localhost:8000/health

The home page shows a live System Status panel; when the API and database are
up, all four indicators turn on.

## Running the full stack in Docker

```bash
cp .env.example .env
docker compose --profile full up --build
```

## Common scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Run web + API in watch mode                   |
| `pnpm build`        | Build all packages and apps                   |
| `pnpm lint`         | Lint every workspace                          |
| `pnpm typecheck`    | Type-check every workspace                    |
| `pnpm test`         | Run all tests                                 |
| `pnpm db:migrate`   | Create/apply a Prisma migration               |
| `pnpm db:studio`    | Open Prisma Studio                            |
| `pnpm docker:up`    | Start PostgreSQL                              |
| `pnpm docker:down`  | Stop containers                               |

## Verifying Phase 1

```bash
pnpm install
pnpm docker:up
pnpm db:migrate
pnpm build        # all workspaces compile
pnpm test         # API + ML health tests pass
pnpm dev          # open http://localhost:3000 — status panel all green
```

## Roadmap

Phase 2 adds authentication & user management. See the project workflow document
for the full 12-phase plan.
