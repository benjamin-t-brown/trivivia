# Trivivia – Online Trivia

This document helps AI agents understand and work with the Trivivia codebase.

## Overview

**Trivivia** is a Node.js + React web app for creating and hosting live, real-time trivia quizzes (similar to Geeks Who Drink). It primarily supports:

- **7–8 rounds** of **8–9 questions** per round
- **~20 teams** per quiz
- **Real-time updates** via Socket.IO (no refresh needed)
- **Question types**: single answer, multi answer, multiple choice, image-based
- **Optional joker rounds** (double points)
- **Static quiz export** for offline/print use

These aren't hard requirements, but the primary use case.

Deployed at [https://trivivia.net](https://trivivia.net).

---

## Repository Structure

```
trivivia/
├── client/          # React + Vite frontend
├── server/          # Express + Sequelize backend
├── shared/           # Shared types (responses, requests)
├── res/              # Static assets (SVG icons, etc.)
├── quizzes/          # Sample quiz markdown files
├── test-browser/     # Playwright E2E tests
├── db/               # SQLite database (prod.sqlite)
└── scratch/          # Scratch/temp files
```

### Workspaces (Yarn)

- `client` – React SPA
- `server` – Express API
- `shared` – Types used by both
- `test-browser` – Playwright tests

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6, styled-components, Vite |
| Backend | Express, cookie-session, JWT |
| Database | SQLite via Sequelize + sequelize-typescript |
| Real-time | Socket.IO |
| Auth | JWT in cookie-session |
| Tests | Vitest (unit), Playwright (E2E) |

---

## Key Concepts

### Quiz Hierarchy

1. **Account** – User account; owns quiz templates and live quizzes
2. **QuizTemplate** – Reusable quiz structure (rounds, questions)
3. **RoundTemplate** – Round within a quiz (title, description, question order)
4. **QuestionTemplate** – Question with text, answer type, correct answers
5. **LiveQuiz** – Running instance of a quiz (from a template)
6. **LiveQuizTeam** – Team in a live quiz
7. **LiveQuizRoundAnswers** – Team’s submitted answers per round

### Answer Types (`shared/responses.ts`)

- `AnswerBoxType` – `input1`, `input2`, `radio2`, `radio4`, `checkbox_N_N`, etc.
- `AnswerState` – `answer1`, `answer2`, … `radio1`, `radio2`, …
- `AnswerStateGraded` – Per-answer grading: `'true'` | `'false'` | `'unknown'`

### Live Quiz States

- **LiveQuizState**: `not_started`, `started_waiting`, `started_in_round`, `completed`, `showing_answers_hidden`, `showing_answers_visible`, `halted`
- **LiveRoundState**: `not_started`, `started_accepting_answers`, `started_not_accepting_answers`, `completed`, `halted`

---

## API Structure

### Auth

- Protected routes require JWT in `req.session.token`
- Non-protected routes are defined in `server/src/middlewares/authSession.ts`

### Controllers & Routes

| Controller | Prefix | Purpose |
|------------|--------|---------|
| `accountController` | `/api/account` | Login, signup, account info |
| `templateController` | `/api/template` | Quiz/round/question CRUD, export |
| `liveQuizAdminController` | `/api/live-quiz-admin` | Create/manage live quizzes, grading |
| `liveQuizController` | `/api/live/:id` | Public: join, submit answers, get state |
| `staticQuizController` | `/api/static` | Static quiz data, HTML export |

### Notable Endpoints

- `GET /api/live/:userFriendlyId` – Public quiz state (teams, round, questions)
- `PUT /api/live/:userFriendlyId/submit` – Submit team answers
- `PUT /api/live-quiz-admin/quiz/:liveQuizId/update` – Admin: round/question/state
- `PUT /api/live-quiz-admin/quiz/:liveQuizId/grade` – Admin: submit grades

---

## Real-Time Updates (Socket.IO)

1. **Client** connects via `window.io` (injected by server)
2. **Client** emits `join` with `{ gameId, teamId, spectateTeamId }`
3. **Server** stores sessions in `ioSessions` (`middlewares/ioSessionMemory.ts`)
4. **Admin** actions (update round, grades, etc.) call `emitStateUpdate()`
5. **emitStateUpdate** sends `state` to all sockets for that `userFriendlyId`
6. **Client** `useSocketIoRefreshState` listens for `state`, invalidates cache, refetches `/live/:id`

Ping/keepalive: client sends `ping-alive` every 5s; server echoes back.

---

## Client Architecture

### Routing (`client/src/routes.tsx`)

React Router with routes for:

- Auth: `Login`, `Signup`, `Logout`, `AccountCreated`
- Templates: `ListQuizTemplates`, `EditQuizTemplate`, `EditRoundTemplate`, `EditQuestionTemplate`
- Live: `LiveQuizStart`, `ListLiveQuizzes`, `EditLiveQuiz`, `LiveQuizAdmin`, `LiveQuizAdminGrading`
- Player: `Join`, `LiveQuiz`, `QRCode`
- Static: `StaticQuiz`

### Data Flow

- **fetchAsync** (`actions.ts`) – Wraps `fetch`, handles cache, dedupes in-flight requests
- **cache** (`cache.ts`) – In-memory cache keyed by `method:url`
- **useSocketIoRefreshState** – Invalidates live quiz cache on `state` event, triggers refetch

### Important Files

- `fetches.ts` – Import quiz/round templates
- `quizUtils.ts` – Quiz state helpers (round visibility, waiting states)
- `gradeHelpers.ts` – Grading UI logic
- `validation.ts` – Form validation
- `utils.tsx` – `getLiveQuizTeamId()`, `getLiveQuizSpectateId()` (localStorage)

---

## Server Architecture

### Models (`server/src/models/`)

- `Account.ts` – User accounts
- `QuizTemplate.ts`, `RoundTemplate.ts`, `QuestionTemplate.ts` – Template hierarchy
- `LiveQuiz.ts`, `LiveQuizTeam.ts`, `LiveQuizRoundAnswers.ts` – Live quiz data

### Services

- `LiveQuizService.ts` – Live quiz CRUD, state, grading, re-import
- `TemplateService.ts` – Quiz/round/question CRUD
- `AccountService.ts` – Auth, account management
- `AutoGradingService.ts` – Fuzzy matching for auto-grading
- `StaticQuizService.ts` – Static quiz rendering

### Routing Helper (`routing.ts`)

- `registerGet`, `registerPost`, `registerPut`, `registerDelete`
- Route handlers receive `(params, body, context)` where `context` has `userId`, `session`, `ioSessions`, etc.
- `InvalidInputError` → 400 response

### Middlewares

- `authSession` – JWT verification, sets `req.userId`, `req.liveTeamId`, `req.liveSpectateId`
- `ioSession` – Attaches `req.ioSessions`
- `withLogging` – Request logging

---

## Shared Package

- `shared/responses.ts` – Response types, `AnswerBoxType`, `AnswerState`, enums
- `shared/requests.ts` – Request types (`QuizTemplateRequest`, `GradeInputState`, etc.)
- `shared/index.ts` – Re-exports

Imported as `shared` or `@shared/*` depending on tsconfig.

---

## Database

- **SQLite** at `db/prod.sqlite`
- **Sequelize** migrations in `server/src/migrations/`
- Setup: `cd server && yarn setup-db` (copies `database.example.json` → `database.json`, runs migrations)

---

## Development

```bash
# Install
./install.sh

# Database
cd server && yarn setup-db

# Run (client on 3005, server on 3006)
./start.dev.sh
# or
yarn start
```

- Client: http://localhost:3005 (Vite dev server, proxies `/api/*` and `/socket.io/*` to 3006)
- Server: http://localhost:3006

### Environment

- `server/src/env.ts`: `COOKIE_SECRET`, `DB_USER`, `DB_PASSWORD`, `logLevel`

---

## Testing

- **Unit**: `yarn test` in `client/` or `server/`
- **E2E**: `test-browser/` with Playwright; `yarn install-playwright` first

---

## Conventions & Patterns

1. **Route handlers** return JSON; `registerRoute` stringifies and sends 200
2. **Cache invalidation** – Controllers don’t touch cache; client uses `removeFromCache`, `updateCache*` after mutations
3. **Live quiz IDs** – Public API uses `userFriendlyId` (short string); internal uses UUID `id`
4. **Team identification** – `live-team-id` and `live-spectate-id` headers or localStorage
5. **Form actions** – React Router `createAction` with `formData` → `Object.fromEntries(formData)`

---

## Common Tasks

| Task | Where to look |
|------|---------------|
| Add API route | `server/src/controllers/*.ts`, `routing.ts` |
| Add client route | `client/src/routes.tsx`, new file in `client/src/routes/` |
| Change quiz/round/question schema | `shared/responses.ts`, models, migrations |
| Add Socket.IO event | `ioSessionMemory.ts`, `liveQuizAdminController` (emitStateUpdate) |
| Add question type | `AnswerBoxType`, `getNumAnswers`, `getNumCorrectAnswers`, `QuestionAnswerInputs*.tsx` |
| Change auth | `authSession.ts`, `accountController`, `AccountService` |

