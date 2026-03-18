# VedaAI

VedaAI is a monorepo for an AI Assessment Creator built from the supplied Figma flows. It provides a responsive teacher dashboard for creating assignments, generating structured question papers, tracking generation status in real time, and reviewing the final paper with an answer key.

## Stack

- Frontend: Next.js 16, TypeScript, Zustand
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Queue and cache: Redis + BullMQ
- Real-time updates: WebSocket
- AI generation: OpenAI with structured JSON parsing and a deterministic fallback

## Features

- Demo teacher sign-in with route protection
- Responsive assignments dashboard matching the provided UI direction
- Assignment creation form with:
  - optional material upload
  - due date
  - subject, class, school, duration
  - dynamic question-type rows
  - derived totals and validation
- Backend assignment persistence in MongoDB
- BullMQ background generation jobs
- WebSocket job status updates: `queued`, `processing`, `completed`, `failed`
- Structured output page with:
  - exam metadata
  - student info lines
  - sectioned questions
  - difficulty badges
  - answer key
- Regenerate action for existing assignments

## Monorepo Layout

```text
apps/
  frontend/   Next.js application
  backend/    Express API server + worker
packages/
  shared/     Shared Zod schemas and TypeScript contracts
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the root env example and fill in values:

```bash
cp .env.example .env
```

Required variables:

- `MONGODB_URI`
- `REDIS_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY`
- `BACKEND_PORT`
- `FRONTEND_URL`

Optional defaults are already provided in `.env.example`.

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts:

- MongoDB on `27017`
- Redis on `6379`

### 4. Run the apps

Start the frontend:

```bash
npm run dev:frontend
```

Start the backend API:

```bash
npm run dev:backend
```

Start the worker:

```bash
npm run dev:worker
```

## Build Commands

```bash
npm run build
```

Or per workspace:

```bash
npm run build --workspace @vedaai/shared
npm run build --workspace backend
npm run build --workspace frontend
```

## Demo Auth

The app currently uses a guarded demo teacher flow.

Default demo credentials:

- Email: `teacher@vedaai.dev`
- Password: `Teacher123!`

You can change both values through the root `.env`.

## Backend Flow

1. Teacher signs in and receives a demo session cookie.
2. Teacher submits an assignment form.
3. API validates the payload and stores the assignment in MongoDB.
4. API creates a BullMQ generation job and marks it `queued`.
5. Worker processes the assignment, generates a structured paper, and stores the result.
6. Redis-backed real-time events notify the frontend over WebSocket.
7. The output page renders the normalized paper and answer key.

## Approach

- Shared contracts are defined in `packages/shared` using Zod to keep the frontend and backend aligned.
- The backend never returns raw LLM text to the UI. It validates and normalizes the generated response first.
- The frontend uses one responsive route set for desktop and mobile instead of separate applications.
- The current implementation includes a deterministic fallback generator when `OPENAI_API_KEY` is missing or the provider call fails, so the full product flow remains testable locally.

## Current Notes

- PDF export is still a follow-up feature. The UI action is present, but a proper PDF pipeline is not yet implemented.
- Search is currently filtered on the frontend after loading assignments.
- The app assumes local Docker services for MongoDB and Redis during development.
