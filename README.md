# 집 (Jip) — 신뢰 기반 부동산 플랫폼

A trust-first real estate platform for the Korean market, tackling fake listings, information asymmetry, and broker-first UX.

---

## Problem

Korean real estate platforms suffer from three compounding dysfunctions:

1. **Fake listings** — brokers post expired or fabricated listings to generate inquiry calls. There is no reliable signal to distinguish real from fake.
2. **Information asymmetry** — tenants cannot know whether a neighborhood is noisy, pest-prone, or difficult in winter without living there. Brokers hold all contextual knowledge.
3. **Broker-first UX** — search surfaces what brokers pay to promote, not what matches a tenant's actual needs.

Jip addresses all three: a computed trust score exposes listing credibility; structured resident reviews surface lived experience; and an AI-powered search bar lets tenants describe what they need in plain language.

---

## Architecture Decisions

### Why GraphQL?

The trust score is a computed field composed of multiple data sources: listing freshness, photo recency, review presence, duplicate detection, and price market-fit. GraphQL resolvers make this composability natural — a client requests `trustScore` and `trustSignals` and gets the result without knowing how it is computed. REST would require either a dedicated `/trust-score` endpoint or bloating the listing response with fields most views don't need.

GraphQL also enables precise field selection: the map view requests only `{ id address { lat lng } trustScore }` while the detail view requests the full type including nested reviews and broker info. No over-fetching, no under-fetching.

### Why SSR on listing pages?

Listing index and detail pages are the primary SEO surface. A user searching "합정동 원룸 후기" on Google should land directly on a relevant listing with the trust badge and review count visible in the raw HTML. Client-side rendering returns an empty shell to crawlers.

SSR with Apollo cache extraction also eliminates the flash of unstyled content on first load: the trust score badge and review count are visible in the initial HTML before any JavaScript runs. Verify with:

```bash
curl http://localhost:3000/listings | grep -o '<h3[^>]*>[^<]*</h3>'
```

### Why a computed trust score rather than a stored field?

Storing the trust score would require re-computing and re-persisting it every time a review is added, a photo is uploaded, a duplicate is detected, or time passes (the freshness component decays daily without any data change). A computed resolver approach means the score is always accurate at read time, with no sync bugs or stale values.

The cost is resolver computation on each request. This is acceptable given the lightweight nature of the calculation (five simple checks, no external calls). It is mitigatable with query-level caching if needed at scale.

### Why the trust signal breakdown over a single number?

A number is meaningless without context. "신뢰도 45점" tells a user nothing actionable. "⚠ 후기 없음 · ⚠ 사진 없음 · ✔ 최근 업데이트" tells them exactly why to be cautious and what to verify before visiting. The breakdown is more important than the score.

---

## Trust Score Model

| Signal | Points | Logic |
|---|---|---|
| Recently updated | 25 | ≤3 days = 25, ≤7 days = 15, older = 0 |
| No duplicate | 25 | Same address + price ±10% → deduct 25 |
| Resident reviews | 25 | ≥1 review = 25, none = 0 |
| Photo recency | 15 | Any photo uploaded ≤30 days = 15 |
| Price market-fit | 10 | Within ±25% of median for dong + type = 10 |

**Tiers:** 80–100 높음 (High) · 50–79 보통 (Moderate) · 0–49 낮음 (Low)

---

## Setup

### Prerequisites

- Docker Desktop (for PostgreSQL)
- Node.js 18+
- OpenAI API key
- Mapbox public token

### 1. Environment

```bash
cp .env.local.example .env.local
# fill in OPENAI_API_KEY and NEXT_PUBLIC_MAPBOX_TOKEN
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

Visit `http://localhost:3000`.

---

## Known Limitations (MVP)

- **No auth** — review submissions use a session token in localStorage. Any user can submit any review. This is a deliberate MVP shortcut; production would require phone-number or OAuth verification.
- **No image upload** — photos use seeded Unsplash URLs. A production version would use an object storage provider.
- **Desktop-only** — no responsive layout. The map + list split panel requires ≥1024px width.
- **LRU cache is in-process** — the review summary cache resets on server restart. A production deployment should use Redis.

---

## Tests

```bash
npm test
```

Nine unit tests covering the trust score engine: perfect score, stale listing, no reviews, duplicate detected, no photos, low-trust tier, moderate tier, and duplicate detection edge cases.
