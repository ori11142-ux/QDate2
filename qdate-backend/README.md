# QDate Backend

Node.js + Express + MongoDB backend for QDate. This iteration ships the **data layer** — schemas, services, seed/verify scripts, and a minimal Express server exposing enough endpoints to prove everything works end-to-end. Full REST surface (the contracts in the mobile app's `src/api.ts`) comes next.

## Stack

- **Runtime**: Node.js 22 LTS
- **Language**: TypeScript (run with `tsx`, build with `tsc`)
- **DB**: MongoDB 7 via Mongoose 8
- **Server**: Express 4

## Setup

### 1. Start MongoDB

Easiest path is Docker. From the project root:

```bash
docker compose up -d
```

Verify it's running:
```bash
docker compose ps
# Should show qdate-mongo with state "running"
```

**Don't have Docker?** Two alternatives:
- **MongoDB Atlas** (free tier): create a cluster, grab the connection string, paste into `.env` as `MONGODB_URI=`
- **Local install**: install MongoDB Community Edition for your OS, then it'll be at the default `mongodb://localhost:27017`

### 2. Install dependencies + configure

```bash
npm install
cp .env.example .env
```

### 3. Seed the database

```bash
npm run seed
```

This wipes everything and creates: 4 users, 2 matches, a 4-message conversation, and 11 calibration swipes. Output should end with a count summary.

### 4. Verify the data layer

```bash
npm run verify
```

Runs a full CRUD round-trip through every service. Should print a series of `─── Section ───` blocks followed by `✓ Data layer verified.`

### 5. Run the dev server

```bash
npm run dev
```

Server listens on `http://localhost:5000`. Try:

```bash
curl http://localhost:5000/api/health
# { "ok": true, "db": "connected", "uptimeSeconds": 4 }
```

## Project layout

```
src/
├── config/
│   └── db.ts                 # Mongoose connection
├── models/                   # Schemas + types
│   ├── User.ts
│   ├── Match.ts
│   ├── Message.ts
│   └── Swipe.ts
├── services/                 # CRUD + queries (called from routes)
│   ├── users.ts
│   ├── matches.ts
│   ├── messages.ts
│   └── swipes.ts
├── routes/
│   └── index.ts              # Express route handlers (thin wrappers over services)
├── scripts/
│   ├── seed.ts               # npm run seed
│   └── verify.ts             # npm run verify
└── index.ts                  # Server entry
```

## Schema design notes

### Why messages are a separate collection, not embedded in matches

ML aggregations like "average reply latency for user X across all conversations" or "message-length distribution by phase" are the whole point of keeping the chat corpus. Those queries are painful with embedded message arrays and easy with a flat `messages` collection that has the right indexes.

### Behavioral fields are stored at write time

Every message is persisted with:
- `text` — the content
- `messageLength` — derived from `text.length` but stored explicitly to skip the derivation in aggregations
- `responseTimeSeconds` — seconds since the other party's last message in this conversation, or `null` if this is an opener
- `sentAt`, `readAt` — for read-latency analysis

`recordMessage()` in `services/messages.ts` computes `responseTimeSeconds` automatically by querying the last message from the other party. The route handler just passes `{ matchId, senderId, text }`.

### Calibration swipes are independent of matches

Per the mobile design, the interests deck and looks deck are deliberately uncorrelated. The `swipes` collection stores them with a `mode` discriminator. No foreign key to a user candidate — calibration cards may not be real users in the system.

### Indexes

| Collection | Index | Purpose |
|---|---|---|
| users | `email` (unique) | Login lookup |
| matches | `userId` | "My matches" listings |
| matches | `userId, status` (compound) | "My active/pending match" — hot path |
| matches | `status` | Cron sweeps for expiry |
| messages | `matchId, sentAt` (compound) | Load a conversation in order |
| messages | `senderId, sentAt -1` (compound) | "User's recent messages" — ML feature extraction |
| swipes | `userId` | User's swipe history |
| swipes | `userId, mode, swipedAt -1` (compound) | Per-mode history with recency |

## API (current surface)

| Method | Path | What it does |
|---|---|---|
| GET  | `/api/health` | Server + DB status |
| POST | `/api/users` | Create user |
| GET  | `/api/users/:id` | Fetch user by id |
| GET  | `/api/users/by-email/:email` | Fetch by email |
| GET  | `/api/matches/current/:userId` | The user's current pending/active match |
| POST | `/api/messages` | Record a chat message (computes latency) |
| GET  | `/api/messages/match/:matchId` | Load full conversation |
| POST | `/api/messages/match/:matchId/mark-read` | Mark unread messages from the other party |
| POST | `/api/swipes` | Record a calibration swipe |
| GET  | `/api/swipes/:userId?mode=interests\|looks` | List a user's swipes |

## What's TODO for the full API

The mobile app's `src/api.ts` expects these endpoints. We need to add them next iteration:

- `POST /api/auth/register` — full onboarding payload, returns user + token
- `POST /api/match/daily_generate` — Phase 1 match creation
- `GET /api/match/weekly_curated/:userId` — Phase 2 fetch
- `POST /api/analytics/message_event` — currently we accept message contents; the mobile sends event metadata. Either merge or keep parallel.
- `POST /api/learning/feedback` — post-skip feedback (need to add `feedback` model)
- `GET /api/insights/:userId` — aggregations the ML pipeline owns
- `GET /api/calibration/interests/:userId` and `/calibration/looks/:userId` — deck delivery

Also missing: authentication middleware. Right now any caller can write any user's data. Once Firebase Auth is wired, every route needs a `verifyToken` middleware that pulls the verified uid from the request.

## A note for the ML lead

Once the seed runs, you can hit Mongo directly with the shell:

```bash
docker compose exec mongodb mongosh qdate

# Examples:
db.messages.find({}, { text: 1, messageLength: 1, responseTimeSeconds: 1 }).limit(5)
db.swipes.aggregate([{ $group: { _id: '$mode', total: { $sum: 1 }, liked: { $sum: { $cond: ['$liked', 1, 0] } } } }])
```

The `getAvgResponseTimeSeconds` and `getLikeRates` service functions are starting points for the features you'll want to extract.
