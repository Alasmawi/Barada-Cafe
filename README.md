# Finjan · فنجان

A collab board for cafés and creators, built for Barada Café. A café posts a collab, creators
pitch from their phones, and the café accepts, sees the post, and marks it served.

**Status:** the API and the creator journey are done. The café screens are next (Phase 4).
[PLAN.md](PLAN.md) has the full spec and phase list. [DECISIONS.md](DECISIONS.md) records what
changed along the way.

## Run it

Needs Node 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

This applies migrations to a local D1 database and serves everything on http://localhost:5173.
The demo data seeds itself the first time the welcome screen loads. Choose Noor to see a request
in every status. The chip at the top right opens the demo menu, with Reset demo and previews of the
slow, error and empty states.

## Check it

```bash
npm run check
```

That runs the type checker, ESLint and the tests. The tests run inside the real Workers runtime
against real D1 (SQLite), so nothing needs mocking and no Cloudflare account is required.

## The rule that matters most

A collab never accepts more creators than it has spots, even with a double tap or two staff
accepting at the same moment.

The guard is a single SQL statement, in
[`requestsRepo.acceptIfSpotAvailable`](src/worker/repositories/requestsRepo.ts). It counts the
spots and updates the row in one step, and D1 runs each write statement on its own, so no other
request can get between the count and the update. Editing spots and asking to join use the same
idea. The tests are in [`test/concurrency.test.ts`](test/concurrency.test.ts). They were checked
by swapping each guard for "SELECT, then UPDATE" and confirming that they fail.

## Layout

```
src/shared     types, schemas and rules used by both sides
src/worker     routes (HTTP) → services (rules) → repositories (SQL)
src/web        the React app
migrations     schema only; demo data lives in src/worker/demo/seed.ts
test           runs over HTTP against the real Worker
brand          Finjan brand assets, used as they are
```

## API

All under `/api/v1`. Send the acting user in `X-User-Id`. Only the first group works without it.

| Who | Method and path | |
|---|---|---|
| Anyone | `GET /health` | Checks the database schema is current |
| | `GET /users` | Users for the switch-user screen |
| | `POST /demo/reset` | Puts the demo data back |
| Signed in | `GET /me` | The acting user |
| | `GET /collabs` | Feed: open, then full. `?state=open` or `?state=full` narrows it |
| | `GET /collabs/:id` | A collab, plus your request if you're a creator |
| Creator | `POST /collabs/:id/requests` | Ask to join |
| | `GET /me/requests` | My collabs |
| | `POST /requests/:id/submission` | Add or correct the post link |
| Creator or café | `GET /requests/:id` | The visit pass |
| Café staff | `GET /cafe/collabs` | My café's collabs |
| | `POST /collabs`, `PUT /collabs/:id` | Create, edit |
| | `GET /collabs/:id/requests` | Inbox |
| | `POST /requests/:id/accept` | Also `/decline` and `/complete` |

Errors always look like `{ "error": { "code", "message", "fields"? } }`.

## Deploy

One-time setup, from a machine logged in with `npx wrangler login`:

1. Run `npx wrangler d1 create finjan` and put the id in `wrangler.jsonc`.
2. Run `npm run deploy`.

To deploy from GitHub Actions instead, add the secret `CLOUDFLARE_API_TOKEN` and the variable
`CLOUDFLARE_ACCOUNT_ID` to the repository. CI then deploys every push to `main`. It skips the
deploy while the variable is missing, and `main` needs to exist first.
