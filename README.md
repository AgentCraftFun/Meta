# MetaMap

> The world's attention, mapped in real time. A live geopolitical
> attention dashboard for on-chain traders — three surfaces (Terminal,
> Map, Watchlist) sharing one filter state and one narrative ↔ token
> link layer.

## Quickstart

```bash
git clone <repo> metamap
cd metamap
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

Defaults to **mock** for both data sources so the app works out of the
box. To swap in real data, set the env vars below and restart.

## Surfaces

| Route       | What it is |
|-------------|-----------|
| `/`         | Server-side redirect to `/terminal` |
| `/terminal` | DexScreener-grade token table + narrative rail + live feed |
| `/map`      | Earth scene — country pins, narratives ranked, sentiment + impact |
| `/moon`     | Moon scene — token craters, activity-scaled, cinematic transition from Earth |
| `/token/[chain]/[address]` | Token detail — chart embed, narrative context, AI "Why is this moving?" |
| `/siteview` | Marketing landing page |
| `/design`   | Dev-only design-token smoke test |

## Environment variables

| Var | Default | Meaning |
|-----|---------|---------|
| `NARRATIVE_SOURCE` | `mock` | `mock` \| `x` — X requires `X_BEARER_TOKEN` |
| `X_BEARER_TOKEN` | — | X (Twitter) v2 paid-tier bearer token |
| `TOKEN_SOURCE` | `mock` | `mock` \| `dexscreener` \| `birdeye` (birdeye = stub) |
| `UPSTASH_REDIS_REST_URL` | — | Shared cache; falls back to in-process Map if unset |
| `UPSTASH_REDIS_REST_TOKEN` | — | Required alongside the URL |
| `CRON_SECRET` | — | When set, `/api/cron/refresh` requires `Authorization: Bearer <secret>` |
| `ANTHROPIC_API_KEY` | — | Powers the token detail "Why is this moving?" panel (Claude Haiku 4.5). When unset, the panel shows the empty state. |

DexScreener requires no auth. Birdeye is reserved for the Solana-deep
pass; the stub returns `[]`.

## npm scripts

```bash
npm run dev          # next dev — local with hot reload
npm run build        # next build — production bundle
npm run start        # next start — serve the build
npm run lint         # next lint (no config shipped; opt in if you want it)
npm run typecheck    # tsc --noEmit
npm test             # vitest run — pure-function unit tests
```

## Architecture in 30 seconds

```
app/                Next 14 App Router. Three product routes + landing.
  api/              Provider-backed REST. Both narratives + tokens are
                    "linked" — the response carries the narrative ↔ token
                    cross-reference so the UI never has to join.
components/
  chrome/           Persistent top bar + global search + toast host
  primitives/       Sprint-0 design system (Pill, Delta, Sparkline)
  terminal/         Density-first product table
  earth/            Earth scene + HUDs
  moon/             Moon scene + HUDs
  celestial/        Shared canvas chrome (Stage, atmospheres, transitions,
                    filter chips, legend)
  token/            Token detail surface
lib/
  providers/        Narrative + token providers (Mock, X, DexScreener)
  narrativeTagger/  Rules-based tag matcher; LLM stage stubbed
  search/           Search engine (client cache + /api/search fallback)
  design/tokens.ts  Single source of truth for colors / space / motion
  store.ts          Shared filter state (chain, narrativeIds, selected,
                    hovered, time window) — read by every surface
```

The narrative → token link layer is the product differentiator. See
`lib/narrativeTagger/rules.ts` for the matcher and the `/api/tokens`
+ `/api/narratives` routes for the linking pipeline.

## Caching

| Key | TTL | Notes |
|-----|-----|-------|
| `linked:tokens:<src>:<narrSrc>:<window>` | 5–60 min (window-dependent) | Tagged token universe; the API slices by filter/chain/limit on serve |
| `linked:narratives:<src>:<tokenSrc>:<window>` | 5 min – 6 h | Inverse-linked narratives |
| `explanation:<src>:<...>:<sigHash>` | 5 min | Per-token AI explanation; hash invalidates on real change |
| `narratives:x:snapshot:<window>` | 24 h | Long-lived X-provider fallback when upstream is rate-limited |

Cron `/api/cron/refresh` (Vercel cron, `*/5 * * * *`) warms the linked
caches for all three windows.

## Tests

`npm test` runs pure-function unit tests via vitest:

- `lib/narrativeTagger/__tests__/rules.test.ts` — matcher correctness
- `lib/providers/tokens/__tests__/dexscreener.test.ts` — response mapper + rate limiter
- `lib/__tests__/format.test.ts` — money / percent / age formatters
- `lib/__tests__/craterPlacement.test.ts` — moon crater math
- `lib/providers/xapi/__tests__/sentiment.test.ts` — VADER-lite scorer
- `lib/__tests__/store.test.ts` — zustand store actions

CI runs `npm install && npm run typecheck && npm test` on PR.
