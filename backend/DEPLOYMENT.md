# Backend deployment

The API remains on port `5000` locally. In production it reads the platform
provided `PORT`.

## Required environment variables

- `DATABASE_URL`: PostgreSQL connection string. Prefer a pooled URL on Vercel.
- `CLIENT_URLS`: exact frontend origin(s), without a trailing slash. Separate
  multiple origins with commas.
- `JWT_ACCESS_SECRET`: long random secret.
- `JWT_REFRESH_SECRET`: a different long random secret.
- `NODE_ENV=production`

Optional:

- `ACCESS_TOKEN_EXPIRES_IN` (default `15m`)
- `REFRESH_TOKEN_EXPIRES_IN` (default `7d`)

Production startup fails immediately if a required variable is missing or both
JWT secrets are identical.

## Render

The repository-root `render.yaml` defines:

- A Node web service rooted at `backend`
- PostgreSQL
- Prisma generation and TypeScript build
- `prisma migrate deploy` in the start command so free services can run it on
  Render's internal network (pre-deploy commands require a paid service)
- `/api/health` as the health check
- Automatic secure JWT secret generation

Create a Render Blueprint from the repository. Before the first deployment,
set `CLIENT_URLS` to the deployed frontend origin, for example:

```text
https://your-salon-frontend.vercel.app
```

Render supplies `PORT` and `DATABASE_URL`.

Keep backend env files simple:

- `.env` for local development and deployment values you copy into the host.
- `.env.test` for automated tests only.

Do not create extra backend env files such as `.env.local`, `.env.production`,
or `.env.example`; they make deployment harder to audit.

## Vercel

Create a Vercel project and set its Root Directory to `backend`. Vercel detects
`src/index.ts` as the Express entry point; it exports the app without opening a
port inside Vercel Functions.

Set all required environment variables in Project Settings. Use separate
production and preview databases if preview deployments run migrations.

Generate and apply migrations from a controlled CI or local environment:

```bash
npm ci
npm run deploy:migrate
```

Then deploy. `npm run vercel-build` regenerates Prisma Client and type-checks
the backend. Database migrations are intentionally not run automatically in
every Vercel preview build.

For serverless deployments, use a pooled PostgreSQL connection string. The API
reuses its PostgreSQL pool and registers it with Vercel Functions so idle
connections can be released when a function is suspended.

## Frontend

Set the frontend build environment variable to the deployed API base URL:

```text
VITE_API_URL=https://your-api.example.com
```

Do not append `/api`.
