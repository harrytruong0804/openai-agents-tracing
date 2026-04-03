# Release Checklist

Checklist for releasing a new version of OpenAI Agents Tracing (OAT).

## Pre-Release

- [ ] All changes merged to `main`
- [ ] `git pull origin main` — working tree is clean
- [ ] Review `git log v<prev>..HEAD --oneline` for changelog items

### Build & Lint

- [ ] `pnpm install` — no lockfile warnings
- [ ] `pnpm build` — both api and client build successfully
- [ ] `pnpm lint` — no lint errors

### Test Locally with Docker

- [ ] `docker compose build` — both images build without errors
- [ ] `docker compose up -d` — all 3 services start (mongodb, api, client)
- [ ] Verify client loads at `http://localhost:3800`
- [ ] Verify API responds at `http://localhost:3801`
- [ ] Smoke test: create an API key via Setup page
- [ ] Smoke test: ingest a trace (send from akila-agent or use `pnpm --filter @openai-agents-tracing/api seed`)
- [ ] Smoke test: verify trace appears in Traces page with correct spans
- [ ] Smoke test: verify Costs & Usage page shows token counts
- [ ] `docker compose down` — clean shutdown, no orphan containers

## Version Bump

- [ ] Update `version` in `apps/api/package.json`
- [ ] Update `version` in `apps/client/package.json`
- [ ] Update `version` in root `package.json` (if tracking)
- [ ] Commit: `git commit -m "chore: bump version to vX.Y.Z"`
- [ ] Tag: `git tag vX.Y.Z`

## Build & Push Docker Images

```bash
# Set version
export OAT_VERSION=X.Y.Z

# Build
docker compose build

# Tag
docker tag noitq/oat-api:latest noitq/oat-api:$OAT_VERSION
docker tag noitq/oat-client:latest noitq/oat-client:$OAT_VERSION

# Push (requires `docker login`)
docker push noitq/oat-api:$OAT_VERSION
docker push noitq/oat-api:latest
docker push noitq/oat-client:$OAT_VERSION
docker push noitq/oat-client:latest
```

- [ ] `docker push` succeeded for all 4 tags (api:version, api:latest, client:version, client:latest)

## Post-Release

- [ ] `git push origin main --tags`
- [ ] Create GitHub release from tag with changelog
- [ ] Update `docker-compose.oat.yml` template in `agent-dev-utils` plugin if needed
- [ ] Update `OAT_VERSION` default in any downstream `docker-compose.oat.yml` files
- [ ] Notify consumers (akila-agent users) of new version

## Notes

- **VITE_API_URL is baked at build time**: The client Dockerfile uses `ARG VITE_API_URL` — changing the API URL requires rebuilding the client image. Default: `http://localhost:3801`.
- **MongoDB data persists** in the `mongodb_data` Docker volume across upgrades. No migration needed for minor versions unless schema changes are noted.
- **Port mapping**: client=3800, api=3801, mongodb=38017 (non-standard to avoid conflicts).
