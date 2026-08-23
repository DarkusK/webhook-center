# Webhook Center

Webhook Center is a learning-focused full-stack project for inspecting and replaying HTTP webhooks.

## Product goal

A developer can create a unique public webhook URL, send requests to it, inspect the method, headers, query parameters and raw body, and replay a stored event to another HTTP endpoint.

The first version is intentionally local-first and educational. It is designed to practise production-oriented web development without hiding important concepts behind generated application code.

## Planned stack

- Node.js 24 LTS and TypeScript 6
- React 19 with Vite and CSS Modules
- NestJS 11
- PostgreSQL 18 in Docker
- Prisma ORM 7
- Cookie-based sessions
- Server-Sent Events
- Jest, Vitest, React Testing Library, Supertest and Playwright
- GitHub Actions

## Development

Run all commands from the repository root. Corepack uses the pnpm version pinned in `package.json`.

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm build
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

The workspace contains `apps/web` and `apps/api`. Add shared development tools to the workspace root and application dependencies to the relevant package.

### Quality checks

GitHub Actions runs the same quality checks for every pull request and for pushes to `main`. Run the commands from the repository root to reproduce CI locally.

Install the exact dependencies from the lockfile:

```bash
corepack pnpm install --frozen-lockfile
```

Run each CI check:

```bash
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

To fix formatting and automatically fixable lint problems during development, run:

```bash
corepack pnpm format
corepack pnpm lint:fix
```

CI uses only the non-mutating check commands and never runs the fix commands.

### API

Copy `apps/api/.env.example` to `apps/api/.env`. `PORT` configures the API, and `DATABASE_URL` must match the local Docker database settings.

Run API commands from the repository root:

```bash
corepack pnpm --filter @webhook-center/api dev
corepack pnpm --filter @webhook-center/api build
corepack pnpm --filter @webhook-center/api typecheck
corepack pnpm --filter @webhook-center/api lint
```

Check the running API:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### Database

Copy the root `.env.example` to `.env` and replace the example values with local development values. The root `.env` configures PostgreSQL in Docker and is ignored by Git.

Start PostgreSQL and check its status:

```bash
docker compose up -d
docker compose ps
```

Follow the database logs:

```bash
docker compose logs -f postgres
```

Stop the database without deleting its data:

```bash
docker compose down
```

The local connection URL has this format:

```text
postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:<POSTGRES_PORT>/<POSTGRES_DB>
```

Run Prisma commands from the repository root:

```bash
corepack pnpm --filter @webhook-center/api prisma:generate
corepack pnpm --filter @webhook-center/api prisma:migrate -- --name <migration-name>
corepack pnpm --filter @webhook-center/api prisma:studio
```

To reset the development database completely, remove the containers and the project database volume:

```bash
docker compose down -v
```

This reset permanently deletes the data stored in the `webhook_postgres_data` volume. It does not remove unrelated Docker volumes.

## Learning workflow

Work is tracked in the **Webhook Center Learning Roadmap** GitHub Project.

1. Take only an issue in **Ready**.
2. Move it to **In progress**.
3. Research the listed concepts before coding.
4. Create a branch named `issue-<number>-<short-name>`.
5. Open a pull request linked to the issue.
6. Verify every acceptance criterion.
7. Move the issue to **Review**.
8. Merge only after reviewing the implementation and lessons learned.
9. Move the completed issue to **Done**, then take the next **Ready** issue.

Keep at most one learning task in progress at a time. Issues provide goals, research prompts and acceptance criteria, but intentionally do not contain finished solutions.

## Status

The monorepo includes a React application shell and a NestJS API with a health endpoint.
