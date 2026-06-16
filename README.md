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
│   └── hymns/                  # Source hymn text files
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

- **Amazing Grace** — `data/hymns/amazing-grace.txt`
- **How Great Thou Art** — `data/hymns/how-great-thou-art.txt`

Hymns are stored as plain text files first, then seeded into PostgreSQL via `npm run db:seed`.
