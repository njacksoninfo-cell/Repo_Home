# Driver Intercom

A location-based proximity voice chat app for drivers. Talk to nearby cars like a CB radio — press and hold to transmit, release to listen. Meet your commute regulars. Wave at interesting encounters.

## The Moat

Features get copied. Networks don't. The social graph built around **vehicle identity** (Red '19 Honda Civic) is the differentiator Waze can't steal without changing what they are.

- **Intercom** — PTT voice to drivers within your selected range
- **Vehicle Identity** — anonymous but recognizable: color + make + model
- **Regulars** — automatic detection of drivers you repeatedly encounter
- **Convoy History** — post-drive summary with wave capability
- **Road Connections** — mutual waves → connection; convoy code for out-of-app linking
- **CarPlay** — first-class PTT from your car display, zero phone interaction

---

## Structure

```
driver-intercom/
├── shared/      TypeScript types shared between mobile and backend
├── backend/     Node.js + Fastify + WebSocket + Redis + PostgreSQL + LiveKit
└── mobile/      React Native (Expo bare) + CarPlay
```

---

## Quick Start (Backend)

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

```bash
cd backend
cp .env.example .env
docker-compose up
```

This starts:
- **Redis 7** on port 6379
- **PostgreSQL 16** on port 5432 (schema auto-applied)
- **LiveKit** (self-hosted SFU) on port 7880
- **Backend API** on port 3001

Verify:
```bash
curl http://localhost:3001/api/health
# → {"status":"ok","checks":{"redis":"ok","postgres":"ok"}}
```

---

## API Reference

### Session
```
POST /api/session          → { sessionId, expiresAt }
```

### Token
```
POST /api/token            → { token, livekitUrl, expiresAt }
Body: { sessionId, roomId }
```

### Profile / Vehicle
```
GET  /api/profile?sessionId=...     → { vehicle }
PUT  /api/profile                   → { ok: true }
Body: { sessionId, vehicle: { color, make, model, year?, nickname? } }

GET  /api/profile/code?sessionId=...  → { convoCode }
POST /api/profile/link                → { ok, linkedTo }
Body: { sessionId, convoCode }
```

### Social
```
GET  /api/convoy/recent?sessionId=...  → { encounters }
GET  /api/regulars?sessionId=...       → { regulars }
POST /api/wave                         → 204
Body: { sessionId, targetSessionId }
GET  /api/connections?sessionId=...    → { connections }
POST /api/report                       → 204
GET  /api/stats                        → { activeDriverCount }
```

### WebSocket
```
wss://host/ws?sessionId={sessionId}
```

**Client → Server events:**
- `location_update` `{ lat, lng, accuracy, heading, speed }`
- `ptt_start` / `ptt_stop`
- `set_range` `{ rangeKm }`
- `set_enabled` `{ enabled }`
- `report_driver` `{ targetSessionId, reason }`
- `ping`

**Server → Client events:**
- `room_assign` / `room_reassign` `{ roomId, livekitToken, livekitUrl }`
- `nearby_count` `{ count }`
- `speaker_start` `{ sessionId, vehicle, distanceMi, bearingDeg, isRegular }`
- `speaker_stop` `{ sessionId }`
- `driver_joined` `{ count, vehicle, isRegular }`
- `driver_left` `{ count }`
- `wave_received` `{ fromSessionId, vehicle }`
- `pong`

---

## Mobile Setup

```bash
cd mobile
npm install
```

Set your backend URL:
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://your-server:3001
EXPO_PUBLIC_WS_URL=ws://your-server:3001/ws
```

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### CarPlay
CarPlay requires:
1. `com.apple.developer.carplay-communication` entitlement (Apple Developer Portal)
2. A physical iOS device or Xcode CarPlay Simulator
3. Xcode signing with the entitlement configured

Test using: Xcode → I/O → External Displays → CarPlay

---

## Privacy Design

- No account. No email. No phone number. UUID session tokens only.
- GPS positions are ephemeral (Redis, 30-min TTL). No history stored.
- Raw coordinates never leave the server — clients receive distance + compass direction only.
- Vehicle profile is the identity. Two identical make/color/model vehicles are indistinguishable.
- Social layer is fully opt-in. Drive forever without waving at anyone.
- Connections are mutual: both drivers must wave independently.

---

## v2 Roadmap

- Route Communities (auto-grouped by recurring route)
- Car Meets (drop a pin, RSVP with vehicle profile)
- Spotted posts (vehicle-tagged sightings, 24h visibility)
- Optional identity reveal (share contact after building trust)
- Android Auto
