# LL7LL New-API Deployment Architecture

## Overview

This project is a fork-based secondary development setup for `new-api`.

- Official upstream repository: `https://github.com/QuantumNous/new-api.git`
- Fork repository: `https://github.com/nethao/new-api-newxai.git`
- Local source directory: `H:\github\服务器运维\new-api二开\ll7ll`
- Production server SSH alias: `MYNEW`
- Production host name observed: `bangbang-oyoq-01.evoxt.com`

> **Current routing (updated 2026-07-27):** `x.ll7ll.top` and
> `x.newxai.cc` run directly on `MYNEW`. The former `VPS-TOKYO`
> containers must remain stopped; never deploy or synchronize the X New API
> stack from Tokyo to MYNEW.

The current workflow should be:

1. Merge official updates into the fork locally.
2. Develop custom changes in the fork.
3. Push changes to `origin/main`.
4. Build and deploy the custom image on the server.

## Git Layout

Local remotes:

```text
origin   https://github.com/nethao/new-api-newxai.git
upstream https://github.com/QuantumNous/new-api.git
```

`upstream` push is disabled locally to avoid accidentally pushing to the official repository.

Initial sync status at the time this document was first created:

```text
main == origin/main == upstream/main
latest commit: 2281c9e3 fix(web): refine mobile user cards
```

Important production baseline note:

The currently running production image is not based on the local `main` branch above. It is based on the server-side source worktree:

```text
server path: /opt/services/new-api-custom
server branch: upgrade-v1.0.0-rc.15
local imported branch: online-baseline
latest production source commit: 1c93f1c1 Apply local upgrade adjustments
previous custom commit: b104c50f Apply custom changes
production version file: v1.0.0-rc.15-custom-20260702
```

At import time, the relationship was:

```text
online-baseline has 2 custom commits not in local main
local main has 38 newer official commits not in online-baseline
```

For future secondary development, treat `online-baseline` as the source of truth unless you intentionally merge newer official upstream changes.

Recommended official update flow:

```bash
git fetch upstream
git merge --ff-only upstream/main
git push origin main
```

If custom commits exist and fast-forward is not possible, use a normal merge and resolve conflicts carefully.

Recommended production-baseline development flow:

```bash
git checkout online-baseline
git checkout -b ll7ll-feature-name
# make custom changes
git add .
git commit -m "feat(ll7ll): describe custom change"
```

To upgrade from the official repository while preserving production custom changes:

```bash
git checkout online-baseline
git fetch upstream
git merge upstream/main
# resolve conflicts, test, build image, then deploy
```

## Production Domains

The following domains are served by the same production `new-api` instance:

```text
x.ll7ll.top
x.newxai.cc
```

Caddy reverse proxy route:

```text
x.ll7ll.top, x.newxai.cc -> 127.0.0.1:3002
```

Special Caddy routes in the same site block:

```text
/console/log redirects to /wallet
/sub-admin serves static tool page from /var/www/tools
/markup-tool/* proxies to 127.0.0.1:8788
```

## Production Runtime

Production deployment directory:

```text
/opt/apps/x-new-api
```

Important files and directories:

```text
/opt/apps/x-new-api/compose.yaml
/opt/apps/x-new-api/.env
/opt/apps/x-new-api/app.env
/opt/apps/x-new-api/source.env
/opt/apps/x-new-api/data
/opt/apps/x-new-api/logs
/opt/apps/x-new-api/pg_data
/opt/apps/x-new-api/redis_data
```

Current application container:

```text
x-new-api-app-1
```

Current image (deployed 2026-08-23):

```text
new-api-custom:v1.0.0-rc.25-custom-20260823
```

Current exposed mapping:

```text
127.0.0.1:3002 -> container 3000
```

Health check:

```text
http://localhost:3000/api/status
```

## Docker Compose Services

Production compose project:

```text
project: x-new-api
compose file: /opt/apps/x-new-api/compose.yaml
```

Services:

```text
app       new-api-custom:v1.0.0-rc.15-custom-20260702
postgres  postgres:16-alpine
redis     redis:7-alpine
```

The `app` service:

- Depends on `postgres` and `redis`
- Loads environment variables from `./app.env`
- Mounts `./data` to `/data`
- Mounts `./logs` to `/app/logs`
- Uses JSON log rotation, max size `10m`, max files `3`
- Uses DNS servers `223.5.5.5`, `119.29.29.29`, `1.1.1.1`

The `postgres` service:

- Uses database name `xnewapi`
- Uses user `xnewapi`
- Stores data in `./pg_data`
- Password is loaded from `.env`

The `redis` service:

- Stores data in `./redis_data`

External Docker network:

```text
ll7ll_shared
```

## Important Safety Notes

Do not overwrite these production directories during deployment:

```text
/opt/apps/x-new-api/data
/opt/apps/x-new-api/logs
/opt/apps/x-new-api/pg_data
/opt/apps/x-new-api/redis_data
```

Do not commit these files to Git:

```text
.env
app.env
source.env
```

They may contain production secrets such as database passwords, session secrets, and connection strings.

Before any production upgrade:

1. Confirm the current running image tag.
2. Back up `compose.yaml` and environment files.
3. Back up PostgreSQL data or take a database dump.
4. Build a new image with a unique tag.
5. Update only the image tag in `compose.yaml`.
6. Restart the compose project.
7. Verify `/api/status` and both domains.

## Recommended Deployment Direction

Because production currently uses a prebuilt local image instead of building from source inside `compose.yaml`, the safer long-term deployment model is:

1. Keep source code in the fork repository.
2. Build a custom Docker image from the fork.
3. Tag each production release clearly, for example:

```text
new-api-custom:v1.0.0-ll7ll-YYYYMMDD-HHMM
```

4. Update `/opt/apps/x-new-api/compose.yaml` to use the new image tag.
5. Restart only the `x-new-api` compose stack.

This keeps code, image version, and server deployment easy to trace and rollback.

## Quick Server Inspection Commands

Use these for read-only checks:

```bash
ssh MYNEW "docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'"
ssh MYNEW "cd /opt/apps/x-new-api && docker compose ps"
ssh MYNEW "grep -n -A 40 -B 5 'x.ll7ll.top\|x.newxai.cc' /etc/caddy/Caddyfile"
ssh MYNEW "curl -s http://127.0.0.1:3002/api/status"
```
