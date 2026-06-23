# Voistra: deployment on a public Docker server

This guide prepares the public server variant of Voistra. It is intended for a VPS such as `87.76.4.203`, not for ZeroTier or localhost.

## What this deploy starts

- `server`: Voistra REST API and Socket.IO gateway.
- `postgres`: persistent database.
- `redis`: realtime state and auxiliary event storage.
- `coturn`: TURN/STUN service for WebRTC voice and screen sharing across the internet.

## Required open ports

Open these ports in the server firewall and hosting panel:

```text
18081/tcp
3478/tcp
3478/udp
49160-49200/udp
```

If the relay range is changed in `.env.production`, open the same UDP range on the server.

## Prepare files locally

Create a production env file from the template:

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

```text
PUBLIC_HOST=87.76.4.203
PUBLIC_IP=87.76.4.203
POSTGRES_PASSWORD=<strong password>
JWT_ACCESS_SECRET=<long random string>
JWT_REFRESH_SECRET=<long random string>
TURN_PASSWORD=<strong password>
```

Do not commit `.env.production`.

## Build and run on the server

After the project folder is uploaded to the VPS:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Check containers:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

Check backend health:

```bash
curl http://127.0.0.1:18081/api/health
curl http://87.76.4.203:18081/api/health
```

Expected result: JSON with `"status":"ok"` and TURN URL `turn:87.76.4.203:3478`.

## Desktop client config

For public mode the desktop app must use:

```json
{
  "serverOrigin": "http://87.76.4.203:18081"
}
```

The template is stored in `voistra.config.public.example.json`.

## Migrations

For the single-server Docker Compose deploy, `DB_MIGRATIONS_RUN=true` lets the backend apply migrations at startup.

For Kubernetes or multiple backend replicas, set `DB_MIGRATIONS_RUN=false` for the backend and run migrations as a one-time job before starting the deployment. The existing Kubernetes baseline has `k8s/migration-job.yaml`.

## Useful maintenance commands

View logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f server
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f coturn
```

Restart:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production restart
```

Stop without deleting data:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

Stop and delete database/redis volumes:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down -v
```
