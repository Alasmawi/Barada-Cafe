# <img src="assets/icons/architecture.svg" width="40" height="40" align="absmiddle" alt=""> Architecture

| | |
|---|---|
| **Product** | Collab Board |
| **Purpose** | How Collab Board is built: components, stack, request protection, data, AI, delivery and known limits |
| **Audience** | Engineering, Security, technical reviewers |
| **Version** | 1.0, 2 November 2026 |
| **Owner** | Abdulla Alasmawi |
| **Related** | [Executive summary](executive-summary.md) · [Docs index](README.md) |

How Collab Board is built, how each request is protected, where data goes, and how it ships. Each
section answers the questions a technical reviewer is likely to ask.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 1. System overview

<p align="center"><img src="assets/diagrams/architecture.svg" width="100%" alt="Browsers reach Cloudflare's edge; API paths go to a Worker built on Hono and Zod; data lives in D1 and AI runs on Workers AI; GitHub Actions checks and deploys with wrangler"></p>

One Cloudflare Worker serves both the app and the API from one URL. `wrangler.jsonc` sends `/api/*` to
the Worker first; every other path is the built React app, which falls back to `index.html`.

| Component | Technology | Responsibility |
|---|---|---|
| Router | `wrangler.jsonc` `run_worker_first: ["/api/*"]` | API paths reach the Worker; everything else is the app, falling back to `index.html` |
| SPA | React 19, React Router 7, TanStack Query 5 | Screens, caching, loading and error states, preview states |
| Hono app | Hono 4 | Routing under `/api/v1`, security headers, one error shape |
| actingUser | `src/worker/http/actingUser.ts` | Turns the session cookie into a user, or refuses with `NOT_SIGNED_IN` |
| Routes | `src/worker/routes` | Validate input with Zod, call one service, return JSON |
| Services | `src/worker/services` | Permissions by role and ownership, allowed status changes |
| Repositories | `src/worker/repositories` | All SQL, including the single-statement spot guards |
| AI module | `src/worker/ai` | Model calls with a timeout; only fields that pass their schema survive |
| D1 | Cloudflare D1 (SQLite) | Accounts, sessions, collabs, requests, demo metadata |
| Workers AI | `llama-3.3-70b-instruct-fp8-fast` | Post drafts and creator summaries |
| Secret | `DEMO_RESET_TOKEN` | Required to reset the demo |
| Delivery | GitHub Actions, wrangler | Checks, then migrations before the new version |

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 2. Technology stack

| | Layer | Technology | Why this choice |
|---|---|---|---|
| <img src="assets/logos/cloudflare.svg" width="24" alt=""> | Hosting | Cloudflare Workers with static assets | One deploy and one URL for the app and the API, on the free plan |
| <img src="assets/logos/sqlite.svg" width="24" alt=""> | Database | Cloudflare D1 (SQLite) | One SQL statement is atomic, which the spot guarantee relies on |
| <img src="assets/logos/meta.svg" width="24" alt=""> | AI | Workers AI, `llama-3.3-70b-instruct-fp8-fast` | JSON mode for drafts; runs inside Cloudflare, no extra vendor |
| <img src="assets/logos/hono.svg" width="24" alt=""> | API | Hono 4 | Small, typed routing built for Workers |
| <img src="assets/logos/zod.svg" width="24" alt=""> | Validation | Zod 4 | One schema validates the request on the server and the form in the browser |
| <img src="assets/logos/react.svg" width="24" alt=""> | Screens | React 19 | Component model the team knows |
| <img src="assets/logos/reactrouter.svg" width="24" alt=""> | Navigation | React Router 7 | One file per screen, deep links work |
| <img src="assets/logos/reactquery.svg" width="24" alt=""> | Data in the app | TanStack Query 5 | Caching, refetching, loading and error states |
| <img src="assets/logos/vite.svg" width="24" alt=""> | Build | Vite 8 with `@cloudflare/vite-plugin` | Runs the real Worker and D1 locally |
| <img src="assets/logos/typescript.svg" width="24" alt=""> | Language | TypeScript 5.9 | Types shared between the app and the API |
| <img src="assets/logos/vitest.svg" width="24" alt=""> | Tests | Vitest 5 with `@cloudflare/vitest-plugin` | Tests run in the real Workers runtime against real D1 |
| <img src="assets/logos/eslint.svg" width="24" alt=""> | Lint | ESLint 10 with typescript-eslint | |
| <img src="assets/logos/githubactions.svg" width="24" alt=""> | CI | GitHub Actions | Checks every push; deploys `main` |

Runtime dependencies: 9. `npm audit --omit=dev` reported 0 known vulnerabilities on 3 November 2026.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 3. Request protection

<p align="center"><img src="assets/diagrams/security.svg" width="100%" alt="Six server-side steps protect each request"></p>

| Step | Control | Where | Stops |
|---|---|---|---|
| 1. Edge | HTTPS on `workers.dev` | Cloudflare | Eavesdropping |
| 2. Headers | CSP limited to the site's origin, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policies | `public/_headers`, `secureHeaders()` | Clickjacking, injected scripts |
| 3. Session | Random token in an `HttpOnly`, `SameSite=Lax` cookie, `Secure` over https; SHA-256 hash stored | `src/worker/auth/sessions.ts` | Script access to the cookie, cross-site form posts |
| 4. Validation | A Zod schema per route; 422 with per-field messages | `src/shared/schemas.ts` | Malformed or oversized input |
| 5. Permission | Role and ownership checked in the services | `src/worker/services/permissions.ts` | Acting on another business's collabs |
| 6. Data | Bound parameters only; guarded single-statement writes | `src/worker/repositories` | SQL injection, overbooking |

> [!CAUTION]
> Demo strength by design: 10,000 PBKDF2 rounds to fit the CPU limit, sessions that expire only with
> the 30-day cookie, and no login rate limit. See [Known limits](#12-known-limits).

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 4. Code layers


| Layer | Folder | Does | Never does |
|---|---|---|---|
| Routes | `src/worker/routes` | Reads the request, validates it with Zod, calls one service, returns JSON | Rules or SQL |
| Services | `src/worker/services` | Who may do what, which status changes are allowed, what errors mean | SQL or HTTP |
| Repositories | `src/worker/repositories` | SQL, including the single-statement guards | Decide permissions |
| AI | `src/worker/ai` | Calls the model with a timeout and keeps only fields that pass their schema | Publish without a person's review |
| Shared | `src/shared` | Types, schemas, statuses, dates and labels used by both sides | Import from the Worker or the app |
| App | `src/web` | Screens, features, components and design tokens | Trust its own checks |

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 5. Request lifecycle


```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
sequenceDiagram
  participant App as React app
  participant H as Hono
  participant M as actingUser
  participant R as Route
  participant S as Service
  participant Repo as Repository
  participant D as D1
  App->>H: POST /api/v1/requests/:id/accept with cookie
  H->>M: Look up the session
  M->>D: SELECT user by token hash
  D-->>M: User
  M->>R: Request with actor
  R->>S: requestService.accept(actor, id)
  S->>S: Is this the owning business? Is the status pending?
  S->>Repo: acceptIfSpotAvailable(id)
  Repo->>D: One guarded UPDATE
  D-->>Repo: Rows changed
  Repo-->>S: Accepted, or no spot
  S-->>R: Request, or a DomainError
  R-->>App: 200 JSON, or 409 with an error code
```

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 6. Data model

<p align="center"><img src="assets/diagrams/data-flow.svg" width="100%" alt="What the app stores, and the only data sent to Workers AI"></p>


```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
erDiagram
  businesses ||--o| users : "has one account"
  businesses ||--o{ collabs : posts
  users ||--o{ collabs : "created by"
  users ||--o{ sessions : "signed in with"
  collabs ||--o{ requests : receives
  users ||--o{ requests : "applies or is invited"
  users ||--o{ pick_reasons : "is picked for"
  collabs ||--o{ pick_reasons : "picked as"

  businesses {
    text id PK
    text name
    text house "colour"
  }
  users {
    text id PK
    text username UK
    text password_hash
    text role "business or creator"
    text business_id FK "unique, null for creators"
    text handle
    text tags
    text signature
    text socials "JSON"
    text summary "saved AI summary"
  }
  collabs {
    text id PK
    text business_id FK
    text title
    text offer
    text deliverable
    text details
    text requirements
    text location
    int spots "1 to 50"
    text ends_on "YYYY-MM-DD, Bahrain"
    text created_by FK
  }
  requests {
    text id PK
    text collab_id FK
    text creator_id FK
    text pitch "140 max"
    text status
    text pass_code "CB-XXXX"
    text post_url
    text decided_by FK
    text invited_by FK
  }
  sessions {
    text token_hash PK
    text user_id FK
  }
  pick_reasons {
    text creator_id FK
    text collab_id FK
    text day "YYYY-MM-DD"
    text reason "null when AI failed"
  }
```

| Table | Holds |
|---|---|
| `businesses` | Name and colour ("house") |
| `users` | One row per account. A unique index allows one per business |
| `sessions` | Hashes of session tokens. The cookie holds the token, the database only its hash |
| `collabs` | A business's post |
| `requests` | An application or an invite, with status, line, code and post link. One per creator per collab |
| `pick_reasons` | AI reasons for Picked for you, per creator, collab and day. A null reason marks an AI failure, so it isn't retried |
| `demo_meta` | When the demo was last reset |

Spots taken, spots left, and whether a collab is open, full or ended are worked out when read, never
stored. A check constraint makes every status from Accepted onward carry a code.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 7. Spot guarantee


A collab never accepts more creators than it has spots, even with a double tap or two phones at once.

<p align="center"><img src="assets/spot-race.svg" width="100%" alt="Two phones accept at once; one gets the spot, the other is told it was just taken"></p>

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
sequenceDiagram
  participant A as Phone A
  participant B as Phone B
  participant W as Worker
  participant D as D1
  A->>W: POST /requests/r1/accept
  B->>W: POST /requests/r2/accept
  W->>D: UPDATE r1 … WHERE spots taken < spots
  D-->>W: 1 row changed
  W-->>A: 200 Accepted, code CB-7K3Q
  W->>D: UPDATE r2 … WHERE spots taken < spots
  D-->>W: 0 rows changed
  W-->>B: 409 That last spot was just taken
```

The count and the update are one SQL statement in `requestsRepo.acceptIfSpotAvailable`, and D1 runs
one write at a time, so nothing can slip between them. Accepting an invite, applying and lowering the
spots on a post use the same pattern. The tests were checked by swapping the guard for "SELECT, then
UPDATE" and confirming that they fail.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 8. Authentication and sessions


```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
sequenceDiagram
  participant App
  participant W as Worker
  participant D as D1
  App->>W: POST /auth/login username, password
  W->>D: SELECT password_hash
  W->>W: PBKDF2 compare
  W->>D: INSERT hash of a new random token
  W-->>App: Set-Cookie cb_session, HttpOnly
  App->>W: Later requests carry the cookie
  W->>D: SELECT user WHERE token_hash = hash(cookie)
```

Password hashing uses 10,000 rounds of PBKDF2 to fit the free plan's CPU limit: fine for a demo, too
light for real accounts. The server doesn't expire sessions on its own; they end at logout or when the
30-day cookie expires.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 9. AI

| | Post draft | Creator summary | Picked for you |
|---|---|---|---|
| Who | Business | Business | Creator |
| Input to the model | The sentence the business typed (300 characters at most) | Name, tags, one line and completed count | The creator's tags and line, and the title, offer and deliverable of up to 3 collabs code already picked |
| Controls | JSON mode, 300 output tokens, 8-second timeout, each field parsed on its own, `<` or `>` dropped | Facts passed as data, not instructions; answers with markup or links discarded | Code ranks and chooses; the model only rewords. Reasons of 20 to 90 characters, no markup or links, unknown ids ignored |
| If it fails | The form is filled by hand; Skip is always visible | The plain fact line stays | The plain reason stays, and the failure is saved so it isn't retried that day |
| Cost | Free daily allowance of 10,000 neurons | About 33 neurons each, saved so repeat views cost nothing | One call per creator per day, saved; at most 9 reasons a creator a day |

Nothing the model returns is published without a person reviewing it.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 10. Delivery

<p align="center"><img src="assets/diagrams/delivery.svg" width="100%" alt="Push, check, build, migrate and deploy, then health check"></p>

| Stage | What runs | Fails when |
|---|---|---|
| Check | `npm run typecheck`, `npm run lint`, `npm test` (265 tests) | Any type error, lint error or failing test |
| Build | `vite build` | The app doesn't compile |
| Release | `wrangler d1 migrations apply DB --remote`, then `wrangler deploy` | A migration fails, so the new code never ships |
| Verify | `GET /api/v1/health` | The schema doesn't match the code (503) |

Rollback: `npx wrangler rollback` restores the previous Worker version. Migrations only move forward, so
a schema change is undone with a new migration. [Operations](operations.md) has the commands.

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 11. Front-end structure


```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'fontFamily': 'Archivo, Helvetica, Arial, sans-serif', 'primaryColor': '#fffdf8', 'primaryTextColor': '#241a16', 'primaryBorderColor': '#c8102e', 'secondaryColor': '#fbe3e4', 'tertiaryColor': '#faf5ea', 'lineColor': '#8a7b70', 'clusterBkg': '#faf5ea', 'clusterBorder': '#e6dccb', 'edgeLabelBackground': '#faf5ea', 'titleColor': '#241a16', 'actorBkg': '#fffdf8', 'actorBorder': '#c8102e', 'actorTextColor': '#241a16', 'signalColor': '#8a7b70', 'signalTextColor': '#8a7b70', 'labelBoxBkgColor': '#fbe9bf', 'noteBkgColor': '#fbe9bf', 'noteBorderColor': '#f2b632', 'pie1': '#2f6b3f', 'pie2': '#f2b632', 'pie3': '#c8102e', 'pieStrokeColor': '#fffdf8', 'pieOuterStrokeColor': '#e6dccb'}}}%%
flowchart TD
  Root["/welcome"] --> SU["/signup/creator · /signup/business"]
  Root --> CT["Creator tabs"]
  Root --> BT["Business tabs"]
  CT --> F["/ Browse"]
  CT --> MW["/me Applications"]
  CT --> PR["/profile Profile and wall"]
  F --> CD["/collabs/:id Collab"]
  MW --> VP["/me/passes/:id Application and code"]
  BT --> BH["/business Overview"]
  BT --> BC["/business/collabs My posts"]
  BT --> BCR["/business/creators Creators"]
  BC --> CI["/business/collabs/:id Applicants"]
  BC --> CE["/business/collabs/new · /:id/edit Post form"]
```

| Folder | Holds |
|---|---|
| `src/web/routes` | One file per screen |
| `src/web/features` | Pieces used by a few screens: cards, sheets, rings, the AI draft |
| `src/web/components` | Shared pieces: layout, stamps, brand marks, states, sheets |
| `src/web/api` | The API client, TanStack Query hooks and preview states |
| `src/web/design` | Tokens, styles and touch feedback |

<img src="assets/divider.svg" width="100%" height="18" alt="">

## 12. Known limits

| Limit | Impact | Fix before real use |
|---|---|---|
| PBKDF2 at 10,000 rounds | Weak against offline cracking if the database leaks | Raise rounds or move hashing off the request path |
| No server-side session expiry | A stolen cookie works until logout | Expire sessions by age and rotate on sign-in |
| No login rate limit | Passwords can be guessed repeatedly | Rate limit by account and IP |
| No account deletion | Can't honour deletion requests | Add deletion that removes the user's rows |
| Visit code checked by eye | A shared screenshot could be reused | Let the business confirm the code in the app |
| Free-plan limits | Heavy use could hit daily limits | Move to a paid plan if usage grows |
