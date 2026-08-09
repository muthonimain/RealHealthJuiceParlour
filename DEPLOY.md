# Deploy from GitHub

Repository: **https://github.com/muthonimain/RealHealthJuiceParlour**

This app is a single Node server (API + built React UI) with **disk JSON storage**.  
On Render you **must** attach a **persistent disk** so sales/expenses survive redeploys.

## Option 1: Render (recommended)

1. Push this project to `main` on GitHub.
2. Sign in at [render.com](https://render.com) → **New** → **Blueprint** (or Web Service).
3. Connect **muthonimain/RealHealthJuiceParlour** and apply `render.yaml`.
4. Confirm a **Persistent Disk** is attached:
   - Mount path: `/var/data`
   - Env var: `DATA_DIR=/var/data`
   - **Requires a paid instance** (Starter ~$7/mo or higher). Free web services **cannot** use persistent disks — without one, all sales/expenses are wiped on every restart.
5. In **Environment**, add owner/employee variables from `.env.example`.
6. Remove any old `DATABASE_URL` / Postgres database if still linked — they are no longer used.
7. Open the Render URL after deploy.

### If the service already exists (manual disk)

1. Render Dashboard → your web service → **Disks** → **Add disk**
2. Mount path: `/var/data` (size 1 GB is enough to start)
3. Environment → add `DATA_DIR` = `/var/data`
4. Delete Postgres / clear `DATABASE_URL` if present
5. Redeploy

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `DATA_DIR` | Persistent data folder (Render: `/var/data`) |
| `JWT_SECRET` | Long random secret for auth tokens |
| `OWNER_1_*`, `OWNER_2_*` | Owner names, usernames, passwords |
| `EMPLOYEE_1_*`, `EMPLOYEE_2_*` | Employee names, usernames, passwords |
| `PORT` | `5000` (often set by platform) |
| `NODE_ENV` | `production` |

Do **not** commit `server/.env` — it is gitignored.

## Local development

```bash
npm run install:all
npm run dev
```

Data is stored under `server/persisted/` by default (no Postgres required).

Frontend: http://localhost:5173 — API: http://localhost:5000

## Data files (on disk)

| File | Contents |
|------|----------|
| `menu.json` | Categories & items |
| `orders.json` | Sales / receipts |
| `expenses.json` | Expenses |
| `clearances.json` | Daily staff clearances |
| `employees.json` | Staff accounts |
| `employee-carts.json` | Shared carts |
| `employee-sessions.json` | Active device sessions |
| `order-number-seq.json` | Order number counters |
| `app-settings.json` | Menu seed revision, etc. |
