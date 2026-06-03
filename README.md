# Real Health Juice Parlour — POS

Point of sale for Real Health Juice Parlour: employee ordering, owner records, expenses, and net profit.

## Quick start (local)

```bash
npm run install:all
docker compose up -d
# Copy .env.example → server/.env and set DATABASE_URL + staff credentials
npm run dev
```

- App: http://localhost:5173  
- API: http://localhost:5000  

## Deploy from GitHub

Push to **https://github.com/muthonimain/RealHealthJuiceParlour** and follow **[DEPLOY.md](./DEPLOY.md)** (Render or DigitalOcean + PostgreSQL).

## Stack

- React (Vite) + Express + PostgreSQL
- Auth: owners & employees via `.env` credentials
