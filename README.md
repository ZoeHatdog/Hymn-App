# Hymn App

A monorepo hymn reader MVP with a React Native (Expo SDK 54) mobile app, Fastify API, and PostgreSQL database.

## Architecture

```
hymn-app/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   └── api/                    # Node.js (Fastify)
├── packages/
│   ├── shared-types/           # Shared DTOs and interfaces
│   └── shared-utils/           # Common validation/utilities
├── data/
│   └── hymns/                  # Source hymns grouped by library
│       ├── Rejoice/            # Lyrics .txt files
│       └── TBC/                # One folder per hymn (lyrics + sheets)
├── prisma/
│   └── schema.prisma
├── docker-compose.yml          # Placeholder (manual Postgres for now)
├── INSTRUCTIONS.md             # Setup guide and feature list
└── package.json
```

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set your `DATABASE_URL`
3. Set up the database: `npm run db:setup`
4. Start the API: `npm run api`
5. Start the mobile app: `npm run mobile`

See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for full setup details.

## Sample Hymns

- **Amazing Grace** — `data/hymns/Rejoice/amazing-grace.txt`
- **How Great Thou Art** — `data/hymns/Rejoice/how-great-thou-art.txt`
- **TBC hymns** — `data/hymns/TBC/<Hymn Title - TBC N>/` (lyrics `.txt` plus optional `.webp` sheets)

Hymns are stored as files first (grouped by library), then seeded into PostgreSQL via `npm run db:seed`.
