# Real Health Juice Parlour — POS

Point of sale for Real Health Juice Parlour: employee ordering, owner records, expenses, and net profit.

## Quick start (local)

```bash
npm run install:all
# Copy .env.example → server/.env and set staff credentials
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:5000  
- Data: `server/persisted/` (JSON files on disk — no PostgreSQL)

## Deploy from GitHub

Push to **https://github.com/muthonimain/RealHealthJuiceParlour** and follow **[DEPLOY.md](./DEPLOY.md)** (Render + **persistent disk**).

## Stack

- React (Vite) + Express + disk JSON storage
- Auth: owners & employees via `.env` credentials
