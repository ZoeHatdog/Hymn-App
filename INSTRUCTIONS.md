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
```

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

Hymns live in `data/hymns/` as `.txt` files. Each file uses this format:

```
title: Amazing Grace
author: John Newton

First line of lyrics
Second line of lyrics
...
```

Re-run seeding anytime:

```bash
npm run db:seed
```

### Sheet music images (optional)

Hymns can have **one or multiple** sheet music pages.

**Multi-page (recommended):** add an `image_folder:` line to the hymn `.txt` file. All images in that folder (sorted by filename) become pages:

```
title: Praise, My Soul, The King of Heaven
author: Henry Francis Lyte (lyrics), John Goss (music)
image_folder: TBC - Hymns/Medium File

Praise, my soul, the King of heaven;
...
```

The folder path is relative to `data/hymns/images/`. To test a different size tier, change the folder name and re-seed.

**Single page:** omit `image_folder` and place a flat file matching the text basename:

| Text file | Image file |
|-----------|------------|
| `data/hymns/amazing-grace.txt` | `data/hymns/images/amazing-grace.jpg` |

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
| GET | `/api/assets/hymns/:filename` | Serve sheet music image files |

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
- Hymns authored as plain text files in `data/hymns/`
- Optional sheet music images in `data/hymns/images/` (paired by basename)
- Seed script parses text files, links images, and upserts into the database
- Shared types keep API and mobile in sync

### Included Sample Hymns
1. **Amazing Grace** — John Newton
2. **How Great Thou Art** — Stuart K. Hine

---

## Adding a New Hymn

1. Create a new `.txt` file in `data/hymns/`:

```
title: Be Thou My Vision
author: Traditional Irish

Be Thou my Vision, O Lord of my heart
...
```

2. Run the seed script:

```bash
npm run db:seed
```

3. (Optional) Add sheet music via `image_folder:` in the `.txt` file or a flat image in `data/hymns/images/`, then re-run `npm run db:seed`.

4. Restart or refresh the mobile app to see the new hymn.

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
