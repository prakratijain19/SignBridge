# SignBridge

**AI-powered multilingual accessibility platform for Indian Sign Language (ISL) communication.**

SignBridge bridges communication between Deaf / Hard-of-Hearing and hearing
people across four media — **sign, speech, text, and a 3D avatar** — with
multilingual support for **English, Hindi, and Gujarati**. The entire interface
is localized: changing the interface language in Settings translates the app
live.

---

## Features

| Module                | What it does                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Live conversation** | Bridge a speaking and a signing participant on one device, in real time.                          |
| **Video call**        | Peer-to-peer WebRTC calls with live captions and sign recognition, signalled over Socket.IO.      |
| **Speech**            | Speech-to-text and text-to-speech in the browser (Web Speech API).                                |
| **Sign recognition**  | Recognizes ISL signs from the webcam — runs entirely in the browser (MediaPipe + TensorFlow.js).  |
| **Sign avatar**       | A 3D hand fingerspells typed text, letter by letter (Three.js / react-three-fiber).               |
| **Translate**         | Text translation across English / Hindi / Gujarati (Google-free, Bhashini, or identity provider). |
| **Learn ISL**         | Guided lessons, camera-based practice, and quizzes with progress and per-sign mastery tracking.   |
| **Emergency**         | Quick phrases, emergency contacts, one-tap location sharing, and an event log for fast comms.     |
| **History**           | Saved conversations, browsable and replayable.                                                    |
| **Accounts**          | Email/password auth with roles (Deaf / Hearing / Learner / Admin) and per-user settings.          |

Accessibility settings (interface language, text size, high contrast, reduced
motion, captions) are stored per user and applied app-wide.

> **Architecture note:** live ISL recognition runs **in the browser**
> (MediaPipe + TF.js) so the camera feed never leaves the device. The Python ML
> service is offline-only — it trains the classifier and exports it to TF.js for
> the web app to load.

---

## Tech stack

| Layer          | Technology                                                                    |
| -------------- | ----------------------------------------------------------------------------- |
| Monorepo       | pnpm workspaces + Turborepo                                                   |
| Frontend       | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS                   |
| In-browser ML  | MediaPipe Tasks Vision (hand landmarks), TensorFlow.js (inference)            |
| 3D avatar      | Three.js, @react-three/fiber, @react-three/drei                               |
| Backend        | Node.js, Express, TypeScript, Zod validation                                  |
| Realtime       | Socket.IO (WebRTC signalling for video calls)                                 |
| Auth           | JWT access + refresh tokens, bcrypt password hashing                          |
| Database / ORM | PostgreSQL 16, Prisma                                                         |
| ML service     | Python 3.11, FastAPI, MediaPipe, TensorFlow (offline training & TF.js export) |
| Tooling        | Docker Compose, GitHub Actions, ESLint, Prettier, Vitest, pytest              |

---

## Repository layout

```
signbridge/
├── apps/
│   ├── api/            Express + Prisma API (auth, conversations, translate,
│   │                   calls, emergency, learning, sign-samples) + Socket.IO
│   └── web/            Next.js web app (all user-facing modules + i18n)
├── packages/
│   ├── shared-types/   TypeScript types shared across web & API
│   └── tsconfig/       Shared TypeScript configs
├── services/
│   └── ml/             Python/FastAPI ML service — training & model export
├── docker-compose.yml
└── turbo.json
```

### API surface

All routes are mounted under `/api`:

| Route                | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `/api/health`        | Liveness + database connectivity check        |
| `/api/auth`          | Register, login, refresh, logout              |
| `/api/users`         | Profile and per-user settings                 |
| `/api/conversations` | Conversation + message history                |
| `/api/sign-samples`  | Collected landmark samples + dataset export   |
| `/api/translate`     | Text translation                              |
| `/api/calls`         | Video-call rooms + ICE/TURN config            |
| `/api/emergency`     | Contacts, quick phrases, and emergency events |
| `/api/learning`      | Lesson progress and sign mastery              |

---

## Prerequisites

- **Node.js 20+** and **pnpm 9+** (`corepack enable` then `corepack prepare pnpm@9.7.0 --activate`)
- **Docker** (for PostgreSQL) — or a local PostgreSQL 16 instance
- **Python 3.11+** (only if working on the ML service / training)
- A **Chromium-based or modern browser** with camera + microphone access for the
  sign, speech, and call features

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
pnpm db:migrate                # runs all Prisma migrations + generates the client

# 5. Run everything in dev mode
pnpm dev                       # builds shared-types, then runs web + API
```

- Web app → http://localhost:3000
- API health → http://localhost:4000/api/health
- ML service (optional) → http://localhost:8000/health

Open the web app, **register an account**, and you land on the dashboard with all
modules. The translation provider defaults to `google-free`, which is free and
needs no API keys.

## Running the full stack in Docker

```bash
cp .env.example .env
docker compose --profile full up --build
```

This brings up PostgreSQL, the API, the web app, and the ML service together.

---

## Configuration

Environment variables (see the `.env.example` files for the full list):

**API (`apps/api/.env`)**

| Variable                                         | Notes                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `DATABASE_URL`                                   | PostgreSQL connection string used by Prisma.                        |
| `CORS_ORIGIN`                                    | Allowed origin(s) for the web app.                                  |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`       | Required in production; dev fallbacks used if unset.                |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL_DAYS`    | Token lifetimes.                                                    |
| `TRANSLATION_PROVIDER`                           | `google-free` (default, keyless), `bhashini`, or `identity`.        |
| `BHASHINI_*`                                     | Optional AI4Bharat credentials; falls back to passthrough if unset. |
| `TURN_URL` / `TURN_USERNAME` / `TURN_CREDENTIAL` | Optional TURN server for cross-network calls (STUN is always used). |

**Web (`apps/web/.env`)**

| Variable              | Notes                                        |
| --------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, exposed to the browser. |

---

## Common scripts

| Command            | What it does                    |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Run web + API in watch mode     |
| `pnpm build`       | Build all packages and apps     |
| `pnpm lint`        | Lint every workspace            |
| `pnpm typecheck`   | Type-check every workspace      |
| `pnpm test`        | Run all tests (Vitest)          |
| `pnpm format`      | Format the repo with Prettier   |
| `pnpm db:migrate`  | Create/apply a Prisma migration |
| `pnpm db:studio`   | Open Prisma Studio              |
| `pnpm docker:up`   | Start PostgreSQL                |
| `pnpm docker:down` | Stop containers                 |

---

## ISL recognition & model training

Live recognition runs in the browser, but the classifier is **trained offline**
by the Python ML service and exported to TensorFlow.js. Two paths are supported:

1. **Self-collected data** — capture samples in the web app at `/sign/collect`,
   then train against the API or an exported dataset file.
2. **Public image dataset** — train from a folder of labeled static ISL images
   (alphabet / digits), CPU-only.

Both flows extract the same canonical **86-dimensional** landmark feature vector,
implemented identically in the Python processor and the browser extractor
(`apps/web/src/lib/sign/landmark-features.ts`) so they never diverge. The trained
model lands in `apps/web/public/models/isl/`; refresh `/sign` to use it. Until a
model exists, `/sign` shows a friendly "model not trained yet" state.

See **[`services/ml/README.md`](services/ml/README.md)** for the full,
step-by-step training instructions.

---

## Testing

```bash
pnpm test                      # all JS/TS workspaces (Vitest)
cd services/ml && pytest       # ML service (pytest)
```

CI runs lint, type-check, and tests on every push via GitHub Actions
(`.github/workflows/ci.yml`).

---

## Internationalization

UI strings live in `apps/web/src/lib/i18n/` — a base dictionary plus per-feature
section files, looked up through the `useT()` hook. The lookup falls back
language → English → raw key, so missing translations never break the UI. The
Hindi and Gujarati strings are best-effort and should be reviewed by a native
speaker before real-world use.
