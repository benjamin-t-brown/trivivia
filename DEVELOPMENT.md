# Development setup

## Requirements

- **Node.js 20+**
- **Yarn 4.17.0** — bundled in `.yarn/releases/`; `./install.sh` uses it automatically (no separate Yarn install needed)

## First-time setup

From the repo root:

```bash
./install.sh
```

This installs all workspaces and builds native dependencies (`sqlite3`, `esbuild`).

### Database

The server expects SQLite at `db/prod.sqlite`. Without it the app boots but the database is empty.

```bash
cd server && yarn setup-db
```

This copies `database.example.json` to `database.json` (if missing) and runs migrations.

### Run the app

```bash
yarn start
# or
./start.sh
```

- Client (Vite): http://localhost:3005
- Server (Express): http://localhost:3006

Create an account at http://localhost:3005/signup before using quiz features.

## Tests

**Unit tests** (server + client; used by `build.sh` and Docker):

```bash
./test.sh
```

**Integration tests** (Playwright; optional):

```bash
yarn install-playwright
./test-integration.sh
```

**Both:**

```bash
./test-all.sh
```

Integration tests start the app with `INTEGRATION_TEST=true` and seed data automatically.

## Production build

```bash
./build.sh
```

Runs unit tests, then builds the client.
