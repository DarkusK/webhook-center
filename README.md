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

The monorepo workspace is ready. The web and API applications have not been implemented yet.
