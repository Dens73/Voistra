# Local Run

## Quick start

Open the project root:

```powershell
cd "C:\Users\Денис\Desktop\Диплом (2)\Диплом"
```

Start Docker Desktop first.

Then start Redis and coturn:

```powershell
docker compose up -d redis coturn
```

Start the backend in a separate terminal:

```powershell
npm run dev --workspace @diplom/server
```

Start the desktop client in another terminal:

```powershell
npm run dev --workspace @diplom/desktop
```

## What should open

- API health: `http://127.0.0.1:3000/api/health`
- Renderer: `http://127.0.0.1:5173`
- Electron app: opens as a separate window
- First screen: login / registration form

Use `127.0.0.1` if your VPN interferes with `localhost`.

## Notes

- The backend uses `sqljs` and stores data in `apps/server/diploma-voip.sqlite`.
- Redis should be running. Health should return `redis: PONG`.
- coturn should be running. Health should return `turn.url: turn:127.0.0.1:3478`.
- The desktop app now uses `127.0.0.1` defaults for API, WebSocket and Electron dev URL to avoid VPN-related localhost issues.

## Quick smoke test

1. Register the first user.
2. Create a server.
3. Create one text channel and one voice channel.
4. Copy the shown `Server ID`.
5. Register a second user in another client window and join the server by `Server ID`.
6. Open the same voice channel in both clients and press `Join voice`.
7. Check the `WebRTC debug` panel. A working local connection should reach `ICE: connected` and show remote audio tracks.
8. Press `Start share` in one client and confirm the other client receives the remote screen preview.
9. Open the text channel as server owner and confirm the server overview shows owner, member count and role.
10. Confirm only `owner` or `admin` can create channels. Regular members should be blocked.

## Stop

Stop Docker services:

```powershell
docker compose down
```

Stop the app processes with `Ctrl+C` in the terminals where they are running.
