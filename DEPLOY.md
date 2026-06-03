# Deploy from GitHub

Repository: **https://github.com/muthonimain/RealHealthJuiceParlour**

This app is a single Node server (API + built React UI) with **PostgreSQL**. `DATABASE_URL` is required in production.

## Option 1: Render (recommended)

1. Create a GitHub repo and push this project to `main`.
2. Sign in at [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect **muthonimain/RealHealthJuiceParlour** and apply `render.yaml`.
4. In the service **Environment**, add owner/employee variables from `.env.example` (names, usernames, passwords).
5. After deploy, open the Render URL (e.g. `https://real-health-juice-parlour.onrender.com`).

## Option 2: DigitalOcean App Platform

1. Create app from GitHub: **muthonimain/RealHealthJuiceParlour**, branch `main`.
2. Attach a **PostgreSQL** database (injects `DATABASE_URL`).
3. Use build: `npm run install:all && npm run build`  
   Run: `npm run start`  
   HTTP port: `5000`
4. Set `NODE_ENV=production`, `DATABASE_SSL=true`, `JWT_SECRET`, and all `OWNER_*` / `EMPLOYEE_*` vars from `.env.example`.

See `.do/app.yaml` for a sample App Platform spec (update secrets in the DO dashboard).

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (from host) |
| `DATABASE_SSL` | `true` on Render / DO managed Postgres |
| `JWT_SECRET` | Long random secret for auth tokens |
| `OWNER_1_*`, `OWNER_2_*` | Owner names, usernames, passwords |
| `EMPLOYEE_1_*`, `EMPLOYEE_2_*` | Employee names, usernames, passwords |
| `PORT` | `5000` (often set by platform) |
| `NODE_ENV` | `production` |

Do **not** commit `server/.env` — it is gitignored.

## Local development

```bash
docker compose up -d
# Add DATABASE_URL to server/.env (see .env.example)
npm run dev
```

Frontend: http://localhost:5173 — API: http://localhost:5000
