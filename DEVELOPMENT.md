# Development setup

## Requirements

- **Node.js 20+**
- **Yarn 4.17.0** — bundled in `.yarn/releases/`; `./scripts/install.sh` uses it automatically (no separate Yarn install needed)

## First-time setup

From the repo root:

```bash
./scripts/install.sh
```

This installs all workspaces and builds native dependencies (`sqlite3`, `esbuild`).

### Database

The server expects SQLite at `db/prod.sqlite`. Without it the app boots but the database is empty.

```bash
cd server && yarn setup-db
```

This copies `database.example.json` to `database.json` (if missing) and runs migrations.

### Database backup and restore

```bash
# download prod db from server to db/backups/prod-<timestamp>.sqlite
./scripts/backup-db.sh

# download to a specific path
./scripts/backup-db.sh ./my-backup.sqlite

# use a backup for local dev (saves current local db to db/backups first)
./scripts/use-backup-db.sh ./my-backup.sqlite

# use the newest backup locally
./scripts/use-backup-db.sh "$(ls -t db/backups/prod-*.sqlite | head -1)"
```

Backup pulls from `admin@54.235.23.2:/home/admin/trivivia/db/prod.sqlite` by default. Override with `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `REMOTE_DB_PATH`, or `BACKUP_DIR` if needed. `use-backup-db.sh` only updates local `DB_PATH` (default `db/prod.sqlite`); it does not change the remote server.

### Run the app

```bash
yarn start
# or
./scripts/start.sh
```

- Client (Vite): http://localhost:3005
- Server (Express): http://localhost:3006

Create an account at http://localhost:3005/signup before using quiz features.

## Tests

**Unit tests** (server + client; used by `scripts/build.sh` and Docker):

```bash
./scripts/test.sh
```

**Integration tests** (Playwright; optional):

```bash
yarn install-playwright
./scripts/test-integration.sh
```

By default, Playwright starts the local dev server (Vite on port 3005 with `INTEGRATION_TEST=true`).

To run against a **Docker container** (production-style server on port 3006):

```bash
yarn install-playwright
./scripts/test-integration-docker.sh
```

This builds the image, starts a container with `INTEGRATION_TEST=true`, and runs the same Playwright suite against `http://127.0.0.1:3006`.

For a container you start yourself:

```bash
docker run --rm -p 3006:3006 \
  -e INTEGRATION_TEST=true \
  -e NODE_ENV=production \
  revirtualis/trivivia:latest

# in another terminal:
export INTEGRATION_SKIP_WEBSERVER=true
export INTEGRATION_BASE_URL=http://127.0.0.1:3006
cd integration && yarn test:prod
```

Environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `INTEGRATION_DOCKER` | unset | Set to `true` to use Docker instead of `yarn start` |
| `INTEGRATION_IMAGE` | `revirtualis/trivivia:latest` | Docker image to run |
| `INTEGRATION_PORT` | `3006` (docker) / `3005` (local) | Host port for tests |
| `INTEGRATION_BASE_URL` | `http://127.0.0.1:<port>` | Override target URL |
| `INTEGRATION_DOCKER_COMMAND` | auto | Full `docker run ...` command override |
| `INTEGRATION_SKIP_WEBSERVER` | unset | Set to `true` to target an already-running server |

**Both:**

```bash
./scripts/test-all.sh
```

Integration tests start the app with `INTEGRATION_TEST=true` and seed data automatically.

## Production build

```bash
./scripts/build.sh
```

Runs unit tests, then builds the client.

To build, push the Docker image to ECR, and deploy:

```bash
./scripts/build-deploy.sh
```
