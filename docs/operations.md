# <img src="assets/icons/operations.svg" width="40" height="40" align="absmiddle" alt=""> Operations

| | |
|---|---|
| **Product** | Collab Board |
| **Purpose** | How to run, test, deploy and reset Collab Board, and the limits it runs within |
| **Audience** | Engineering, operations |
| **Version** | 1.0, 2 November 2026 |
| **Owner** | Abdulla Alasmawi |
| **Related** | [Executive summary](executive-summary.md) · [Docs index](README.md) |

<img src="assets/divider.svg" width="100%" height="18" alt="">

How to run, test, deploy and reset Collab Board.

## 1. Running locally

Needs Node 22 or newer. No Cloudflare account is needed: without one, AI falls back to plain forms
and plain facts.

```bash
npm install
```

```bash
npm run dev
```

This applies migrations to a local D1 database and serves the app and API on http://localhost:5173.

| Command | Does |
|---|---|
| `npm run dev` | Local D1 and the app |
| `npm run dev:phone` | The same, reachable from a phone on your Wi-Fi |
| `npm run dev:ai` | Uses the real Workers AI model. Needs `npx wrangler login` |
| `npm run db:migrate` | Applies migrations to the local database |

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 2. Verification

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart LR
  TC["npm run typecheck<br/>web and worker"] --> L["npm run lint"]
  L --> T["npm run test<br/>265 tests in the real Workers runtime"]
  T --> OK(["npm run check passes"])
  DEV["npm run dev running"] --> UI["npm run test:ui<br/>300 screen checks"]
  classDef biz fill:#f2b632,stroke:#2a1b05,color:#2a1b05
  classDef cre fill:#e2efe2,stroke:#2f6b3f,color:#1f3317
  classDef plat fill:#fbe3e4,stroke:#c8102e,color:#241a16
  classDef data fill:#241a16,stroke:#241a16,color:#faf5ea
  classDef ext fill:#e3ecf4,stroke:#2f5f8a,color:#14324d
  classDef ok fill:#2f6b3f,stroke:#2f6b3f,color:#ffffff
  class TC,L,T,DEV,UI plat
  class OK ok
```

| Command | Proves |
|---|---|
| `npm run check` | Types, lint and 265 tests against real D1, including the spot race with the guard deliberately broken |
| `npm run test:ui` | Every screen at 320, 360, 390, 768 and 1280px in every preview state, with no sideways scroll |
| `npm run test:webkit` | iPhone SE, 15 and 15 Pro Max in WebKit, Safari's engine, with touch: no sideways scroll, no input zoom, big enough tap targets, bottom bars in view. Reads the live site by default; `BASE_URL=http://localhost:5173 MUTATE=1` also taps through an application |

`test:ui` drives your installed Chrome and resets the demo first, so it needs the reset secret in
`.dev.vars`. Don't point it at a site where real people have signed up. `test:webkit` needs WebKit once:
`npx playwright-core install webkit`.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 3. Deployment

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart LR
  B["vite build"] --> M["wrangler d1 migrations apply DB --remote"]
  M --> D["wrangler deploy"]
  D --> H{"GET /api/v1/health"}
  H -- "schema matches" --> OK(["Live"])
  H -- "503" --> FIX["A migration was skipped"]
  classDef biz fill:#f2b632,stroke:#2a1b05,color:#2a1b05
  classDef cre fill:#e2efe2,stroke:#2f6b3f,color:#1f3317
  classDef plat fill:#fbe3e4,stroke:#c8102e,color:#241a16
  classDef data fill:#241a16,stroke:#241a16,color:#faf5ea
  classDef ext fill:#e3ecf4,stroke:#2f5f8a,color:#14324d
  classDef ok fill:#2f6b3f,stroke:#2f6b3f,color:#ffffff
  class B,M,D plat
  class H ext
  class OK ok
  class FIX biz
```

One-time setup, from a machine logged in with `npx wrangler login`:

1. Register a `workers.dev` subdomain in the Cloudflare dashboard.
2. Run `npx wrangler d1 create collab-board` and put its name and id in `wrangler.jsonc`.
3. Set the reset secret with `npx wrangler secret put DEMO_RESET_TOKEN`.

Then each time:

```bash
npm run deploy
```

> [!NOTE]
> `npm run deploy` builds, applies any new migrations to the live database, then deploys. Migrations
> run before the new code, so the new code never meets an old schema.

 `/api/v1/health` reports the schema it found.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 4. Continuous integration

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart TD
  P["Push or pull request"] --> C["check job<br/>npm ci · npm run check · npm run build"]
  C --> Q{"Push to main, and<br/>CLOUDFLARE_ACCOUNT_ID set?"}
  Q -- yes --> D["deploy job<br/>npm run deploy"]
  Q -- no --> S(["Stop after checks"])
  classDef biz fill:#f2b632,stroke:#2a1b05,color:#2a1b05
  classDef cre fill:#e2efe2,stroke:#2f6b3f,color:#1f3317
  classDef plat fill:#fbe3e4,stroke:#c8102e,color:#241a16
  classDef data fill:#241a16,stroke:#241a16,color:#faf5ea
  classDef ext fill:#e3ecf4,stroke:#2f5f8a,color:#14324d
  classDef ok fill:#2f6b3f,stroke:#2f6b3f,color:#ffffff
  class P ext
  class C,D plat
  class Q ext
  class S ok
```

To deploy from GitHub Actions, add the secret `CLOUDFLARE_API_TOKEN` and the repository variable
`CLOUDFLARE_ACCOUNT_ID`. The reset secret lives on Cloudflare, so deploys keep it.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 5. Demo reset

> [!WARNING]
> Resetting restores the sample data and removes everyone who signed up, so it isn't on any screen.
> Check for real sign-ups before resetting a live site.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
sequenceDiagram
  participant You
  participant W as Worker
  participant D as D1
  You->>W: POST /api/v1/demo/reset with X-Reset-Token
  alt token matches DEMO_RESET_TOKEN
    W->>D: Delete sign-ups and their sessions, all collabs and requests
    W->>D: Write demo data with dates relative to today
    W-->>You: 200
  else missing or wrong
    W-->>You: 404
  end
```

Locally, put the secret in `.dev.vars` (it's git-ignored):

```
DEMO_RESET_TOKEN=any-long-random-value
```

Then reset:

```bash
curl -X POST -H "X-Reset-Token: $DEMO_RESET_TOKEN" http://localhost:5173/api/v1/demo/reset
```

For the live site, use the same command against https://collab-board.alasmawi.workers.dev with the
secret set on Cloudflare.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 6. Database migrations

| File | Changed |
|---|---|
| `0001_init.sql` | Businesses, users, collabs, requests, sessions and demo_meta |
| `0002_socials_and_post_details.sql` | Creator socials; optional details, who they're looking for and location on collabs |
| `0003_one_account_per_business_no_offers.sql` | One account per business; offers removed |
| `0004_no_business_type_or_area.sql` | Business type and area removed |
| `0005_pick_reasons.sql` | Saved AI reasons for Picked for you |

Add a new migration as the next numbered file, then update `SCHEMA_VERSION` in
`src/worker/routes/public.ts` and the matching test in `test/demo.test.ts`.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 7. Platform limits

| Limit | How the app stays inside it |
|---|---|
| 10 ms CPU per request | Rings and logos are drawn in the browser. Password hashing is light |
| 100k requests, 5M rows read and 100k written a day | Search waits for a pause in typing and returns 30 results at most |
| 10k AI neurons a day | About 33 neurons a summary, and one call per creator a day for pick reasons. Each is saved, and plain facts need no AI |

When the AI allowance runs out the app keeps working: summaries stay as plain facts, and posts are
filled in by hand.
