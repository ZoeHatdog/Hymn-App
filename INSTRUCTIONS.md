# Hymn App — Instructions & Features

## Overview

Hymn App is a minimum viable product for browsing and reading hymn lyrics and sheet music. Hymns start as plain text files with optional sheet music images, are imported into PostgreSQL, served by a Fastify API, and displayed in an Expo mobile app.

---

## Prerequisites

- **Node.js** 20.19+ and npm (required for Expo SDK 54)
- **PostgreSQL** installed locally (Docker is optional and not required for this MVP)
- **Expo Go** app on your phone with **SDK 54** support (optional, for device testing)

---

## Manual PostgreSQL Setup

Docker is not required. Connect to Postgres manually:

### 1. Install PostgreSQL

Download and install PostgreSQL for your OS:
- Windows: https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql@16`
- Linux: use your distro's package manager

### 2. Create the database

Open `psql` or pgAdmin and run:

```sql
CREATE DATABASE hymn_app;
```

### 3. Configure environment variables

Copy the example env file:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Edit `.env` with your connection string:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hymn_app?schema=public"
API_PORT=3000
API_HOST=0.0.0.0
EXPO_PUBLIC_API_URL=http://localhost:3000
ASSET_BASE_URL=https://your-bucket.s3.ap-southeast-2.amazonaws.com
```

`ASSET_BASE_URL` is optional. When set, sheet `imageUrls` are `{ASSET_BASE_URL}/TBC/...` (or `Rejoice/...`) instead of `/api/assets/hymns/...`. Omit it to keep serving local files.

> **Physical device testing:** Replace `localhost` in `EXPO_PUBLIC_API_URL` with your computer's local IP (e.g. `http://192.168.1.10:3000`).

---

## Project Setup

From the project root:

```bash
# Install all workspace dependencies
npm install

# Generate Prisma client, push schema, and seed hymns
npm run db:setup
```

### Seed hymns from text files

Hymns live under `data/hymns/<library>/`. Each library is a folder (`Rejoice`, `TBC`, …). A hymn is either a `.txt` file in that library folder, or a folder containing lyrics plus optional sheet images:

```
data/hymns/
  Rejoice/
    amazing-grace.txt
    how-great-thou-art.txt
  TBC/
    His Mercy Is More - TBC 16/
      His Mercy Is More - TBC 16.txt
      His Mercy Is More - TBC 16.webp
```

Each `.txt` file uses this format:

```
title: Amazing Grace
author: John Newton
library: Rejoice
page: 1
tags: Grace, Salvation
link: https://example.com

First line of lyrics
Second line of lyrics
...
```

`library` and `page` are optional. If omitted, seed infers the library from the parent folder (`Rejoice`, `TBC`) and the page from a trailing number in the hymn folder name (`… - TBC 16` → `16`).

Re-run seeding anytime:

```bash
npm run db:seed
```

### Sheet music images (optional)

Sheet music lives **next to** the hymn text. You do not need `image_file:` or `image_folder:` pointers.

**Per-hymn folder (TBC and any hymn with sheets):** put `.webp`, `.jpg`, `.jpeg`, or `.png` files in the same folder as the `.txt`. All images in that folder are used as pages, sorted by filename. An optional `sheets/` subfolder is also scanned.

```
data/hymns/TBC/His Mercy Is More - TBC 16/
  His Mercy Is More - TBC 16.txt
  His Mercy Is More - TBC 16.webp
```

**Lyrics-only in a library folder (Rejoice):** leave the `.txt` in `data/hymns/Rejoice/`. To add a single image later, either place a matching-stem file beside it (`amazing-grace.webp`) or move the hymn into its own folder and drop images there.

After adding or updating images:

```bash
npm run db:seed
```

Hymns without images will show an empty state on the Notes screen.

---

## Running the App

### Start the API (Terminal 1)

```bash
npm run api
```

API runs at `http://localhost:3000`

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/hymns` | List all hymns |
| GET | `/api/hymns/:id` | Get hymn with full lyrics and `imageUrls[]` |
| GET | `/api/hymns/search?q=grace` | Search by title, author, or lyrics |
| GET | `/api/assets/hymns/*` | Serve sheet music image files (path relative to `data/hymns/`) |

### Start the Mobile App (Terminal 2)

```bash
npm run mobile
```

- Press `w` for web
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan the QR code with Expo Go on your phone

---

## Features (MVP)

### Mobile App
- Browse all hymns in a scrollable list
- Tap a hymn to choose **Lyrics** (text) or **Notes** (sheet music)
- Search hymns by title, author, or lyrics text
- Back navigation from detail to list
- Empty state when sheet music is not available
- Error handling with retry

### API
- REST endpoints for listing, detail, search, and static image serving
- CORS enabled for mobile/web clients
- PostgreSQL persistence via Prisma ORM

### Data Pipeline
- Hymns authored under `data/hymns/<library>/`, as a `.txt` file or a per-hymn folder
- Optional sheet music images sit beside the `.txt` (or in a `sheets/` subfolder)
- Seed script walks those folders, infers library/page when needed, and upserts into the database
- Shared types keep API and mobile in sync

### Included Sample Hymns
1. **Amazing Grace** — John Newton
2. **How Great Thou Art** — Stuart K. Hine

---

## Adding a New Hymn

**Lyrics only** — add a `.txt` file in the library folder:

```
data/hymns/Rejoice/be-thou-my-vision.txt
```

**Lyrics + sheet music** — add a folder named after the hymn:

```
data/hymns/TBC/Be Thou My Vision - TBC 40/
  Be Thou My Vision - TBC 40.txt
  Be Thou My Vision - TBC 40.webp
```

Example `.txt`:

```
title: Be Thou My Vision
author: Traditional Irish
library: TBC
page: 40

Be Thou my Vision, O Lord of my heart
...
```

Then run:

```bash
npm run db:seed
```

Restart or refresh the mobile app to see the new hymn.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Can't reach database server` | Ensure PostgreSQL is running and `DATABASE_URL` is correct |
| Mobile app shows connection error | Check API is running; use your machine's IP instead of `localhost` on a physical device |
| `prisma generate` fails | Run `npm install` from the project root first |
| Empty hymn list | Run `npm run db:seed` to import text files |

---

## Future (Not in MVP)

- Docker Compose for Postgres (see commented `docker-compose.yml`)
- User favorites and playlists
- Offline caching on mobile
- Audio playback
- Admin UI for hymn management
