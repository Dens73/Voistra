# Voistra Source Workspace

Source workspace for the Voistra desktop voice platform.

## Applications

- `apps/desktop` — Electron desktop client
- `apps/server` — NestJS backend API and realtime gateway

## Main capabilities

- authentication and profile management
- servers and channels
- private channels with password access
- direct messages and friends
- voice presence and screen share signaling
- moderation actions for server owners
- packaged Windows installer build

## Development quick start

```powershell
npm install
npm run dev --workspace @diplom/server
npm run dev:renderer --workspace @diplom/desktop
npm run dev:electron --workspace @diplom/desktop
```

## Production build

```powershell
npm run build
```

## Windows installer

```powershell
npm run dist:desktop
```

Artifacts:

- `release/voistra/win-unpacked`
- `release/voistra/Voistra Setup 0.1.0.exe`

## Extra documentation

- [LOCAL_RUN.md](./LOCAL_RUN.md)
- [TODO.md](./TODO.md)
