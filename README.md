# Eurovision Jury 2026

Mobile-first web app for a private Eurovision prediction game without accounts. Personal data is versioned in browser `localStorage` and can optionally be synced into a shared room through a serverless API.

## Start

```bash
npm install
npm run dev
```

The app runs on the local URL printed by Vite. The default demo master password is:

```text
eurovision2026
```

You can override it with a local `.env` file:

```bash
VITE_MASTER_PASSWORD=dein-passwort
```

## Build And Tests

```bash
npm run test
npm run build
```

## Serverless Sync

The app uses `/api/room` to sync user scorecards. During local development, Vite serves the same path with an in-memory store so `npm run dev` works immediately.

For deployment, the API is implemented as a Vercel Serverless Function in `api/room.js`. Persistent storage uses Upstash Redis via REST. Set these environment variables in your deployment:

```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
VITE_ROOM_ID=eurovision-2026-private
VITE_MASTER_PASSWORD=your-password
```

`VITE_ROOM_ID` is the shared private room. It can also be changed in the Export/Sync section inside the app. All devices using the same room ID see the same group scores after syncing.

## Data

- Storage-Key: `eurovision-jury-2026:v1`
- Schema-Version: `2`
- Users, categories, notes, category scores, and jury points stay local in the browser and are merged per room when sync is active.
- `Export` can generate a WhatsApp-ready text summary or JSON.
- JSON can be imported again to move a scorecard to another device.

## Features

- Master password protection with local unlock state
- Local users without registration
- Eurovision 2026 participant seed data
- Create, rename, and delete categories
- Notes and scores per country
- Classic jury points `1, 2, 3, 4, 5, 6, 7, 8, 10, 12`
- Mobile dropdown assignment with duplicate protection
- Serverless sync for multiple users
- Group scores with winner, jury total ranking, category favorites, and favorites per person
- Progress, search, filters, final Top 10, and compact scoreboard view
- PWA manifest and simple service worker
