# 집 (Jip) — Trust-First Korean Real Estate Platform

A full-stack real estate web app built for the Korean rental market. The core premise: Korean tenants have no reliable way to know whether a listing is real, fairly priced, or worth visiting. Jip addresses this by computing a **trust score** from five verifiable signals and surfacing **structured resident reviews** — information brokers neither have nor want to share.

**Live demo**: https://jip-eta.vercel.app

![Listings — desktop three-panel view](docs/screenshots/listings-desktop.png)

---

## Technologies

| Layer | Stack |
|---|---|
| Framework | **Next.js 15** (App Router, React 19) |
| Language | **TypeScript 5** — `strict: true`, no `any` in application code |
| API | **GraphQL** via Apollo Server v5 + `@as-integrations/next` |
| GraphQL client | **Apollo Client v4** — `useQuery`, `useLazyQuery`, typed operations |
| SSR | Next.js Server Components + direct Prisma calls (no internal HTTP) |
| Database | **PostgreSQL** (Neon serverless) via **Prisma 7** |
| State | **Zustand** — filter state, map hover/select, mobile view toggle |
| Map | **Mapbox GL JS** via `react-map-gl` |
| AI | **OpenAI GPT-4o** — NL search query parsing, review summarization |
| Real data | **MOLIT (국토교통부) Open API** — ~5,000 real transaction records |
| Styling | **Tailwind CSS v4** + shadcn/ui |
| Testing | **Jest** + ts-jest — 9 unit tests on trust score engine |
| Deployment | **Vercel** (Functions + Cron Jobs) |

---

## Key Features

### 1. Trust Score Engine
Every listing carries a computed score (0–100) from five signals:

| Signal | Points | Logic |
|---|---|---|
| Recently updated | 25 | ≤3 days = 25, ≤7 days = 15, older = 0 |
| No duplicate | 25 | Same address + price within ±10% → deduct 25 |
| Resident reviews | 25 | At least one review = 25 |
| Photo recency | 15 | Any photo uploaded within 30 days = 15 |
| Price market-fit | 10 | Within ±25% of MOLIT transaction median for dong + type |

Tiers: **높음** (80–100) · **보통** (50–79) · **낮음** (0–49). The breakdown is shown per-signal so users know exactly *why* a listing is low-trust, not just that it is.

![Listing detail — trust signals breakdown](docs/screenshots/listing-detail-trust.png)

### 2. Natural Language Search (AI)
Users type in plain Korean — "마포구 조용한 원룸 60만원 이하" — and the search bar calls a GraphQL query that feeds the input to GPT-4o. The model returns a structured `ParsedFilter` object (dong, propertyType, maxPrice, keywords) that updates the filter state immediately, with debouncing at 600ms.

![NL search — parsed intent confirmation](docs/screenshots/nl-search.png)

### 3. SSR + SEO
Listing index and detail pages use `export const dynamic = 'force-dynamic'` with direct Prisma queries in Server Components. No internal HTTP calls — avoids Vercel deployment protection issues. Trust badges and review counts appear in raw HTML before any JavaScript runs. `generateMetadata` produces per-listing OpenGraph tags.

Verify with:
```bash
curl https://jip-eta.vercel.app/listings | grep '<h3'
```

### 4. Synchronized Map + List
Two-panel layout: a scrollable listing grid on the left, a Mapbox map on the right. Hovering a card highlights the map pin; clicking a map pin scrolls the grid to that card. Trust score tiers determine pin color (green / amber / red). Infinite scroll via `IntersectionObserver`.

### 5. Responsive Design
- **Desktop (≥768px)**: Three-panel layout — filter sidebar | listing grid | map
- **Mobile (<768px)**: Single-panel with a 목록/지도 toggle button and a filter dialog. The filter panel becomes a modal sheet; the map goes full-screen when selected.

![Mobile list view](docs/screenshots/mobile-list.png) ![Mobile map view](docs/screenshots/mobile-map.png)

### 6. Structured Resident Reviews
Six-dimension rating system: noise, pests, winter cold, summer heat, landlord response, overall satisfaction. GPT-4o generates a cached summary paragraph from all reviews for a listing (LRU cache, TTL per listing ID). Users submit reviews via a GraphQL mutation with tenancy date range validation.

![Review submission form](docs/screenshots/review-form.png)

### 7. Real Data Ingestion Pipeline (MOLIT)
A background pipeline fetches official Korean government real estate transaction data:

```
data.go.kr MOLIT API → lib/ingestion/ → MarketTransaction table → trust score price benchmark
```

- CLI: `npx tsx scripts/syncListings.ts` (bulk load, ~5,000 records in ~3 minutes)
- Cron: `GET /api/cron/sync-listings` runs daily at 02:00 UTC (Vercel Cron)
- Upserts by deterministic `externalId` — fully idempotent

---

## Architecture Decisions

### Why GraphQL over REST?
The trust score is a computed field composed of multiple signals. GraphQL resolvers make this composable — the client requests `trustScore` and `trustSignals` without knowing how they are computed. The map view fetches only `{ id address { lat lng } trustScore }` while the detail view fetches the full type including nested reviews. No over-fetching.

### Why SSR for listing pages?
A user searching "합정동 원룸 후기" on Naver should land on a page where the trust badge and review count are already in the HTML. Client-side rendering returns an empty shell to crawlers. Server Components calling Prisma directly also avoid the round-trip latency of an internal HTTP call.

### Why a computed trust score rather than a stored field?
Storing the score would require re-computing it on every review addition, photo upload, or freshness decay event (the freshness component changes daily without any data change). A computed resolver is always accurate at read time with zero sync complexity.

### Why MOLIT data for price benchmarking?
Naver Land has no public API — their internal XHR endpoints require rotating session tokens and explicitly prohibit automated access. MOLIT (국토교통부) provides a free, government-issued API with actual transaction data. This powers the price market-fit trust signal with real numbers instead of listing-peer medians.

---

## Running Locally

### Prerequisites
- Node.js 20+
- Docker Desktop (for local PostgreSQL)
- OpenAI API key
- Mapbox public token

### 1. Environment

```bash
cp .env.local.example .env.local
# Fill in:
#   OPENAI_API_KEY=...
#   NEXT_PUBLIC_MAPBOX_TOKEN=...
#   DATABASE_URL=postgresql://jip:jip@localhost:5432/jip   (local Docker)
```

### 2. Database

```bash
docker compose up -d
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Dev server

```bash
npm run dev
```

Open `http://localhost:3000/listings`.

### 4. Tests

```bash
npm test
```

Nine unit tests covering the trust score engine: perfect score, stale listing, no reviews, duplicate detected, no photos, low-trust tier, moderate tier, and both duplicate detection edge cases.

---

## Project Structure

```
app/
  listings/
    page.tsx              ← SSR listings index (force-dynamic)
    [id]/page.tsx         ← SSR listing detail with metadata
    [id]/review/new/      ← Review submission form
  api/
    graphql/route.ts      ← Apollo Server endpoint
    cron/sync-listings/   ← Vercel Cron handler

graphql/
  schema.ts               ← SDL type definitions
  resolvers/              ← listing, review, AI resolvers

lib/
  trust/scoreEngine.ts    ← Pure trust score computation + tests
  ingestion/              ← MOLIT data pipeline (sources → normalize → persist)
  queries/serverListings.ts ← SSR data access (Prisma direct)
  ai/                     ← NL search parser + review summarizer

components/
  listings/               ← ListingGrid, ListingMap, ListingCard, filters
  reviews/                ← ReviewForm, ReviewList, ReviewSummary
  trust/                  ← TrustBadge, TrustSignalList

stores/
  uiStore.ts              ← Zustand: filter state, hover/select, mobile view

prisma/
  schema.prisma           ← Listing, Review, Photo, Broker, MarketTransaction
  seed.ts                 ← 62 listings, 37 reviews, 166 photos (Seoul)

scripts/
  syncListings.ts         ← MOLIT bulk sync CLI
```

---

## Known Limitations

- **No auth** — reviews use localStorage tokens. Production would require phone/OAuth verification.
- **No image upload** — photos are seeded Unsplash URLs. Production would use object storage.
- **LRU cache is in-process** — review summary cache resets on cold start. Production should use Redis.
- **MOLIT data is transactions, not listings** — active listing data requires a licensed provider or user/broker submission.
