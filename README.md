# Voistra

![Voistra logo](./Диплом/apps/desktop/public/voistra-mark.svg)

Voistra is a desktop voice workspace for teams, communities, and diploma demonstrations.  
The project combines servers, text channels, voice rooms, screen sharing, private conversations, moderation, and packaged Windows delivery in one Electron application.

## What Voistra already includes

- Desktop client on Electron + React + TypeScript
- Backend API on NestJS + TypeORM + WebSocket gateway
- Authentication with access and refresh tokens
- Servers, text channels, voice channels, and private channels with passwords
- Direct messages, friends, friend requests, and notification center
- Voice presence, screen share signaling, moderation, and profile settings
- Windows packaging with `electron-builder`

## Download and installation

### Recommended

Use the ready Windows build generated from the `main` branch:

1. Open the repository `Actions` tab.
2. Run or open the latest `Voistra Windows Build` workflow.
3. Download the `voistra-windows` artifact.
4. Unpack the artifact archive.
5. Run `Voistra Setup 0.1.0.exe`.

### Release flow

The repository is configured so that:

- every push to `main` builds a fresh Windows installer artifact
- every tag like `v0.1.0` publishes installer files into a GitHub Release

That gives you a stable download path for demonstration, review, and diploma submission.

## Local launch

If you want to run the project from source:

```powershell
cd "Диплом"
npm install
npm run dev --workspace @diplom/server
npm run dev:renderer --workspace @diplom/desktop
npm run dev:electron --workspace @diplom/desktop
```

More local details are in [LOCAL_RUN.md](./Диплом/LOCAL_RUN.md).

## Build the installer locally

```powershell
cd "Диплом"
npm install
npm run dist:desktop
```

Build artifacts are written to:

- `Диплом/release/voistra/win-unpacked`
- `Диплом/release/voistra/Voistra Setup 0.1.0.exe`

## Repository structure

```text
.
├─ Диплом/
│  ├─ apps/
│  │  ├─ desktop/
│  │  └─ server/
│  ├─ scripts/
│  ├─ docker-compose.yml
│  └─ package.json
└─ .github/
   └─ workflows/
```

## Tech stack

- Electron
- React 19
- Tailwind CSS
- NestJS
- TypeORM
- SQLite for local data
- Redis and coturn for infrastructure scenarios
- RNNoise-based browser noise suppression integration

## Current product focus

Voistra is already suitable for:

- diploma presentation
- local demonstration on Windows
- functional showcase of voice workspace scenarios

The project is still evolving, but the repository is already prepared as a distributable desktop product rather than only a development prototype.

## Author

Project owner: `Dens73`
