<<<<<<< HEAD
# Cloudreve Lite

Production-ready self-hosted cloud file manager.

**React + Vite + Tailwind** → **Nginx** → **Node.js/Express** → **PostgreSQL**
→ **MinIO** (object storage) → **Redis** (cache / token denylist)

## Quick start

```bash
docker compose up --build -d
```

Open **http://localhost**

Default admin:

- Email: `admin@cloudreve.local`
- Password: `Admin123!`

API docs: **http://localhost/api/docs**

Stop:

```bash
docker compose down
```

## Architecture

```
Browser
  │
  ▼
Nginx :80          (reverse proxy)
  ├─ /            → frontend (static SPA)
  └─ /api         → backend :4000
                      ├─ PostgreSQL   metadata
                      ├─ MinIO        file objects
                      └─ Redis        cache / logout denylist
```

Services are separate containers. Backend is stateless (tokens in DB, files in MinIO).

## Features

- JWT access tokens + httpOnly refresh cookies
- bcrypt password hashing
- Upload / download / rename / move / copy / trash / restore
- Folders, search, sort, filter, pagination
- Image / PDF / text preview via MinIO signed URLs
- Share links with expiry and optional password
- Per-user storage quota
- Admin dashboard, user roles, audit logs
- Rate limiting, Helmet, CORS, input validation
- Kubernetes manifests in `k8s/`

## Local development (without Docker for app)

Start infra only, then run app locally:

```bash
docker compose up -d postgres redis minio
```

Backend:

```bash
cd backend
cp ../.env.example .env   # point DATABASE_URL / REDIS / MINIO at localhost
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend Vite proxies `/api` → `http://localhost:4000`.

## Tests

```bash
cd backend
node --test tests/**/*.test.js
```

## Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

Build and load images into your cluster first (`cloudreve-lite-backend:latest`, `cloudreve-lite-frontend:latest`). Change secrets in `k8s/secret.yaml` before any real deployment.

## Environment

See `.env.example`. Never put MinIO keys in the frontend. Downloads use backend streams or short-lived signed URLs.

## Project layout

```
backend/src/     Express API (controllers, services, routes, middleware)
backend/prisma/  Schema + SQL migrations + seed
frontend/src/    React app
nginx/           Edge reverse proxy
k8s/             Kubernetes manifests
```
=======
# cloudrev
>>>>>>> efa7d9aa4a818e21cbaca8c0c8072f0274beb7e0
