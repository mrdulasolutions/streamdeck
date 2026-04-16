# Deployment

This guide covers deploying StreamDeck to Railway, Fly.io, or any Docker-capable host.

The app is a single Bun/Express server that:

- Listens on `PORT` (default `3000`)
- Uses environment variables for configuration
- Keeps per-user state in memory only

---

## Common prerequisites

Regardless of platform, you will need:

- A GitHub repository containing this code
- A MentraOS developer account
- The following environment variables:

```env
PACKAGE_NAME=com.yourcompany.streamdeck
MENTRAOS_API_KEY=your-mentra-api-key
PORT=3000
```

> Never commit `.env` or real API keys to git. Use your platform’s secret management.

---

## Deploying to Railway

Railway has first-class Bun support and is the easiest path for most users.

### 1. Import the repo

1. Push your local repo to GitHub
2. Go to `https://railway.app`
3. Click “New Project” → “Deploy from GitHub repo”
4. Select your StreamDeck repository

### 2. Configure environment variables

In your Railway project settings:

- Add `PACKAGE_NAME`
- Add `MENTRAOS_API_KEY`
- Optionally override `PORT` (defaults to 3000)

Railway will automatically:

- Detect Bun via `bun.lock` and `bun` scripts
- Install dependencies with `bun install`
- Run `bun run start` by default

### 3. Connect to Mentra Cloud

In your Mentra developer console:

1. Set the miniapp backend URL to the Railway **public URL** (e.g. `https://streamdeck-production.up.railway.app`)
2. Make sure CORS/HTTPS requirements in MentraOS docs are satisfied

Your glasses and companion app will now talk to the Railway-hosted backend.

---

## Deploying to Fly.io

Fly.io is a good choice if you want more control over regions or plan to co-locate with other services.

### 1. Create a `Dockerfile`

At the repo root:

```dockerfile
FROM oven/bun:latest AS base

WORKDIR /app

COPY bun.lock package.json tsconfig.json ./
COPY src ./src
COPY src/views ./src/views

RUN bun install --ci
RUN bun run typecheck

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "src/index.ts"]
```

Adjust paths as needed if you add more assets (e.g. `public/`).

### 2. Initialize Fly.io app

```bash
flyctl launch
```

- Choose a region near your primary streaming audience
- When asked about a Dockerfile, select “yes” (or point it at the `Dockerfile` above)

### 3. Set secrets

```bash
flyctl secrets set \
  PACKAGE_NAME=com.yourcompany.streamdeck \
  MENTRAOS_API_KEY=your-mentra-api-key \
  PORT=3000
```

Then deploy:

```bash
flyctl deploy
```

Configure Mentra Cloud with the Fly app URL (e.g. `https://streamdeck.fly.dev`).

---

## Deploying with plain Docker

If you already have Kubernetes, Docker Swarm, or another orchestrator, you can reuse the Dockerfile above.

### 1. Build and run locally

```bash
docker build -t streamdeck .

docker run --rm -p 3000:3000 \
  -e PACKAGE_NAME=com.yourcompany.streamdeck \
  -e MENTRAOS_API_KEY=your-mentra-api-key \
  -e PORT=3000 \
  streamdeck
```

Visit `http://localhost:3000/webview` to confirm the app loads.

### 2. Push to a registry

```bash
docker tag streamdeck ghcr.io/youruser/streamdeck:latest
docker push ghcr.io/youruser/streamdeck:latest
```

Then reference that image from your orchestrator’s deployment manifests.

---

## Health checks

The app does not currently expose an explicit health endpoint, but you can add one easily:

- Add a lightweight `GET /healthz` route that returns `200 OK`
- Point your platform’s health check to that endpoint

This is especially useful on Fly.io or Kubernetes to avoid sending traffic to cold or unhealthy instances.

---

## Updating deployments

When you push a new commit to `main`:

- Railway will automatically rebuild and redeploy (if configured)
- Fly.io will rebuild and roll out a new image on `flyctl deploy`

If you change required environment variables, remember to update them in your platform’s UI or CLI before deploying.

