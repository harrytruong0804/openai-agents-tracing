# CLAUDE.md

Self-hosted tracing and analytics dashboard for OpenAI Agent SDK. Monorepo with pnpm + Turborepo.

## Stack

- **API** (`apps/api`): Express + Mongoose + JWT auth, TypeScript (CommonJS)
- **Client** (`apps/client`): React 19 + Vite + Tailwind + shadcn/ui + React Router v7
- **Database**: MongoDB 7
- **Docker images**: `noitq/oat-api`, `noitq/oat-client` on Docker Hub

## Commands

```bash
pnpm install          # install all deps
pnpm dev              # dev both apps (turbo)
pnpm build            # build both apps
pnpm lint             # lint both apps
docker compose up -d  # run full stack (mongodb + api + client)
docker compose build  # build docker images
```

Seed test data: `pnpm --filter @openai-agents-tracing/api seed`

## Project Structure

```
apps/
├── api/src/
│   ├── index.ts              # Express entry point
│   ├── models.ts             # Mongoose schemas
│   ├── traces/routes.ts      # Trace ingestion & query
│   ├── analytics/routes.ts   # Cost & usage aggregation
│   ├── api-keys/routes.ts    # API key management
│   ├── auth/routes.ts        # JWT auth
│   └── *.middleware.ts       # Auth & API key middleware
├── client/src/
│   ├── App.tsx               # Router setup
│   ├── api.ts                # Axios API client
│   ├── components/           # Pages + shadcn/ui
│   └── hooks/useAuth.ts      # Auth hook
```

## Ports

| Service  | Port  |
|----------|-------|
| Client   | 3800  |
| API      | 3801  |
| MongoDB  | 38017 |

## Key Notes

- `VITE_API_URL` is baked at Docker build time (ARG, not ENV). Changing API URL requires rebuilding client image.
- MongoDB data persists in `mongodb_data` Docker volume.
- Non-standard ports (38xx) to avoid conflicts with other services.

## Release

See [RELEASE.md](RELEASE.md) for the full release checklist (version bump, Docker build/push, smoke tests).
