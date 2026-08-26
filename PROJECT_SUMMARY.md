# Cloudreve Lite — Full Project Summary

Self-hosted cloud file manager built as a production-style cloud computing course project.

---

## 1. What this project is

Cloudreve Lite is a personal cloud drive: users register, log in, upload files, organize folders, share links, recover trash, and (as admin) manage users and audit logs.

File **metadata** lives in PostgreSQL. File **bytes** live in MinIO (S3-compatible). The API never stores objects in the database.

Default admin after `docker compose up`:

| Field | Value |
|-------|--------|
| URL | http://localhost |
| Email | `admin@cloudreve.local` |
| Password | `Admin123!` |
| API docs | http://localhost/api/docs |

---

## 2. Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router, Lucide icons |
| API | Node.js, Express, Prisma |
| Auth | JWT access token + httpOnly refresh cookie, bcrypt |
| Database | PostgreSQL 16 |
| Object storage | MinIO (AWS S3 SDK, path-style) |
| Cache | Redis 7 |
| Edge proxy | Nginx |
| Docs | Swagger UI (`/api/docs`) |
| Containers | Docker Compose |
| Orchestration | Kubernetes manifests in `k8s/` |

---

## 3. Architecture

```
Browser
   │
   ▼
Nginx :80
   ├─ /            → frontend container (static SPA)
   ├─ /api         → backend :4000
   └─ /health      → backend liveness/readiness
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
     PostgreSQL     MinIO       Redis
     (metadata)   (objects)   (cache / logout)
```

Services are separate containers. The backend is stateless: tokens are in PostgreSQL, objects in MinIO. That makes it Kubernetes-ready (backend/frontend replicas).

Request flow examples:

1. **Upload** — browser `multipart` → Nginx → Express/multer (memory) → MinIO `PutObject` → Prisma `File` row + increment `User.storageUsed`.
2. **Download** — JWT → load `File.objectKey` → stream `GetObject` from MinIO (or short-lived signed URL for preview).
3. **Share** — public token → optional password (bcrypt) + expiry → stream object without owner JWT.

---

## 4. Project layout

```
cloudreve-lite/
├── docker-compose.yml          # nginx, frontend, backend, postgres, redis, minio
├── .env.example
├── nginx/nginx.conf            # edge reverse proxy
├── k8s/                        # namespace, config, secret, workloads, ingress
│
├── backend/
│   ├── src/
│   │   ├── index.js            # boot: Redis, MinIO bucket, admin seed, listen
│   │   ├── app.js              # Express app, security, routes, health
│   │   ├── config/             # env, prisma, redis, minio, swagger
│   │   ├── middleware/         # JWT, admin, validate, rate limit, errors
│   │   ├── controllers/
│   │   ├── services/           # business logic + MinIO
│   │   ├── routes/
│   │   └── utils/
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/
│   ├── prisma/seed.js
│   ├── tests/
│   ├── Dockerfile
│   └── docker-entrypoint.sh    # prisma migrate deploy then start
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # routes + auth gates
    │   ├── api.js              # fetch + refresh interceptor + XHR upload
    │   ├── context/AuthContext.jsx
    │   ├── components/Layout.jsx
    │   └── pages/              # login, files, trash, share, admin, …
    ├── Dockerfile              # Vite build → nginx:alpine
    └── nginx.conf              # SPA fallback
```

The live application is `backend/src/**`. Older `backend/server.js` / `backend/controllers/` files are leftovers from the first in-memory prototype and are not used by Docker.

---

## 5. Features

### Users
- Register / login / logout
- Session restore on refresh (`GET /api/auth/me` + localStorage access token)
- Refresh token rotation (cookie + `RefreshToken` table)
- Profile name + password change
- Per-user storage quota (default 5 GB)

### File manager
- Upload with progress (XHR)
- Download, rename, move, copy
- Folder create / rename / move / nested tree
- Search, sort, type filter, pagination
- List and grid views
- Preview: images, PDF, text (MinIO signed URL)

### Trash
- Soft delete files and folders
- Restore
- Permanent delete (MinIO object + DB + quota decrement)
- Empty trash

### Sharing
- Tokenized public links
- Optional password and expiry (`1d` / `7d` / `30d` / never)
- Download count
- Public share page at `/share/:token`

### Admin
- System stats (users, files, shares, total storage)
- List users, change role
- Audit logs: register, login, logout, upload, download, delete, share, empty trash

### Permissions
- `Permission` model: per-user read/write/share on a file or folder
- Admin can grant via `POST /api/admin/permissions`

---

## 6. Database (PostgreSQL + Prisma)

| Table | Purpose |
|-------|---------|
| `User` | Email, bcrypt hash, role (`USER`/`ADMIN`), quota, used bytes |
| `Folder` | Nested folders (`parentId`), trash flags |
| `File` | Name, mime, size, MinIO `objectKey`, folder, trash flags |
| `Share` | Public token, optional password hash, expiry, download count |
| `Permission` | Shared access for another user |
| `AuditLog` | Action, user, IP, user-agent, JSON metadata |
| `RefreshToken` | Rotating refresh tokens |

Indexes exist on email, names, mime, trash flags, share token, audit action/time.

Objects are **never** stored in Postgres. `File.objectKey` is `{userId}/{uuid}-{sanitizedName}`.

---

## 7. REST API

Auth required unless noted.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | JWT + refresh cookie |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Clear cookie, denylist access token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/files/dashboard` | Stats + recent files |
| GET | `/api/files` | List files/folders (`folderId`, `search`, `sort`, `type`, `page`) |
| POST | `/api/files/upload` | Multipart upload |
| PATCH | `/api/files/:id` | Rename |
| POST | `/api/files/:id/move` | Move |
| POST | `/api/files/:id/copy` | Copy object + row |
| DELETE | `/api/files/:id` | Trash |
| POST | `/api/files/:id/restore` | Restore |
| DELETE | `/api/files/:id/permanent` | Hard delete |
| GET | `/api/files/:id/download` | Stream from MinIO |
| GET | `/api/files/:id/preview` | Signed preview URL |
| POST | `/api/folders` | Create folder |
| GET | `/api/folders/tree` | All folders |
| PATCH/DELETE | `/api/folders/:id` | Rename / trash |
| GET/POST | `/api/shares` | List / create |
| GET | `/api/shares/public/:token` | Public access (no JWT) |
| GET | `/api/trash` | Trash listing |
| DELETE | `/api/trash` | Empty trash |
| GET | `/api/admin/stats` | Admin stats |
| GET | `/api/admin/users` | Users |
| GET | `/api/admin/audit-logs` | Audit trail |
| GET | `/health` | Liveness |
| GET | `/health/ready` | Postgres + Redis + MinIO |

---

## 8. Frontend

React Router routes:

| Path | Page |
|------|------|
| `/login`, `/register` | Auth |
| `/app` | Dashboard |
| `/app/files`, `/app/files/:folderId` | File manager |
| `/app/trash` | Recycle bin |
| `/app/shared` | Share links |
| `/app/settings` | Profile / password |
| `/app/admin` | Admin (role gate) |
| `/share/:token` | Public share |

`AuthContext` restores the session on reload. `api.js` retries once after 401 via `/auth/refresh`. Upload uses XHR for progress.

UI: dark theme (Sora + DM Mono), sidebar with quota bar, context menu, share dialog, preview modal.

---

## 9. Security

- Passwords hashed with bcrypt (12 rounds)
- Short-lived access JWT (15m) + rotating refresh (7d, httpOnly, SameSite=lax)
- Logout can denylist the access token in Redis
- Helmet, CORS allowlist, `express-validator`
- Rate limits: auth 30/15min, API 300/15min, upload 60/15min
- Filename sanitization; path traversal rejected (`..`, `/`, `\`)
- Dangerous MIME types blocked
- Max file size 2 GB; quota checked before upload
- MinIO credentials stay on the server only
- Preview/download via backend stream or time-limited signed URL

---

## 10. DevOps

### Docker Compose

```bash
docker compose up --build -d
docker compose down
```

| Service | Image / build | Notes |
|---------|---------------|--------|
| nginx | nginx:alpine | Host port 80 |
| frontend | `./frontend` | Multi-stage Vite → nginx |
| backend | `./backend` | `prisma migrate deploy` then `node src/index.js` |
| postgres | postgres:16-alpine | Volume `postgres_data` |
| redis | redis:7-alpine | AOF persistence |
| minio | minio/minio | Console :9001 |

Healthchecks: Postgres `pg_isready`, Redis `PING`, backend `GET /health`. Nginx waits until backend is healthy.

### Kubernetes (`k8s/`)

- Namespace `cloudreve`
- ConfigMap + Secret
- StatefulSet: Postgres, MinIO
- Deployment: Redis, backend (2 replicas), frontend (2 replicas)
- Ingress: `/api` and `/health` → backend, `/` → frontend

```bash
kubectl apply -k k8s/
```

Load images `cloudreve-lite-backend:latest` and `cloudreve-lite-frontend:latest` first. Change secrets before any real deploy.

### Tests

```bash
docker exec cloudreve-backend node --test tests/sanitize.test.js tests/pagination.test.js
```

Covers filename sanitization, path safety, MIME blocklist, pagination clamps.

---

## 11. How data is separated (cloud design)

This is the main course point:

- **Compute** — stateless Express + SPA
- **Structured data** — PostgreSQL (users, folders, file rows, shares, audit)
- **Unstructured data** — MinIO object store
- **Ephemeral/cache** — Redis
- **Ingress** — Nginx (Compose) or Ingress (K8s)

Scaling: add backend/frontend replicas. Do not put uploaded files on the API container disk.

---

## 12. Local verification (already run)

- `GET /health` → `{ ok: true }`
- `GET /health/ready` → postgres, redis, minio all `true`
- Admin login returns JWT + user `role: ADMIN`
- Frontend `GET /` → 200
- Upload `cloudreve-test.txt` → MinIO + DB row
- Create folder `Docs`
- Swagger `/api/docs` → 200
- Unit tests: 5 passed

---

## 13. Course talking points

1. Why objects are not stored in Postgres (size, streaming, cost).
2. Why the API is stateless (horizontal scale, K8s).
3. JWT vs refresh cookies vs Redis denylist.
4. Signed URLs so the browser never sees MinIO keys.
5. Soft delete vs hard delete and quota accounting.
6. Audit logs for security/compliance.
7. Compose for local demo vs K8s for production-shaped deploy.
