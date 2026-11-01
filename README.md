# Finjan · فنجان

A collab board for cafés and creators, built for Barada Café. A café posts a collab, creators
pitch from their phones, and the café accepts, sees the post, and marks it served.

**Live link:** not deployed yet (see [Deploy](#deploy)).

[PLAN.md](PLAN.md) has the full spec. [DECISIONS.md](DECISIONS.md) records what changed along the
way and the questions still open for Barada.

## Two-minute demo

One phone can play both sides: the name chip at the top right switches user.

**As a creator (Noor)**

1. Browse the feed. A taller stack of cups means more spots. Full collabs sit at the bottom.
2. Open *Your first month of our new cold brew*, tap **Ask to join** and send a one-line pitch.
3. In **My collabs**, open the saffron collab under *Your cup's ready*. The pass plays once, then
   drag across it to tilt it. The code on it is what staff check at the counter.
4. Tap **I've posted** and paste any Instagram or TikTok link. The field recognises it.

**As a café (Huda)**

1. Switch to Huda. Open *Saffron latte first pour*.
2. Tap **Accept** on a pitch. A cup moves from the stack to the tray.
3. In **Posted**, tap **Mark served** on Ali's post.
4. Tap **Post a collab**, type one sentence and tap **Fill the form for me**, then edit and publish.

**The rule that matters:** open *Karak tasting flight* as Huda on one phone and Yusuf on another.
It has one spot left and three creators waiting. Tap Accept on different pitches at the same moment:
one gets the spot, the other sees that a teammate took it.

The demo menu also has **Slow**, **Error** and **Empty** previews, which show the other states of
every screen, and **Reset demo**, which puts everything back for everyone.

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
in every status, or Huda to run Barada Café. The chip at the top right opens the demo menu, with Reset demo and previews of the
slow, error and empty states.

To open it on a phone on the same Wi-Fi, run this and use the Network address it prints. It makes the
dev server reachable by anyone on that network, so stop it when you're done.

```bash
npm run dev:phone
```

No Cloudflare account is needed. Without one, the AI sentence box says it can't help and the form
works as normal. To use the real model, register a `workers.dev` subdomain, log in with
`npx wrangler login`, and run:

```bash
npm run dev:ai
```

## Check it

```bash
npm run check
```

That runs the type checker, ESLint and the tests. The tests run inside the real Workers runtime
against real D1 (SQLite), so nothing needs mocking and no Cloudflare account is required.

With `npm run dev` running, this checks every screen at 360 and 390px in every preview state. It
drives your installed Chrome, and it's run by hand, not in CI.

```bash
npm run test:ui
```

## The rule that matters most

A collab never accepts more creators than it has spots, even with a double tap or two staff
accepting at the same moment.

The guard is a single SQL statement, in
[`requestsRepo.acceptIfSpotAvailable`](src/worker/repositories/requestsRepo.ts). It counts the
spots and updates the row in one step, and D1 runs each write statement on its own, so no other
request can get between the count and the update. Editing spots and asking to join use the same
idea. The tests are in [`test/concurrency.test.ts`](test/concurrency.test.ts). They were checked
by swapping each guard for "SELECT, then UPDATE" and confirming that they fail.

## The AI draft

A café types one sentence and Workers AI fills what it can of the form. The café then edits it and
publishes it themselves. If the model is slow, fails or talks nonsense, the form stays usable and
"Skip, I'll type it" is always there.

The model's output is treated as untrusted. It has no tools, sees only the sentence, and every field
is validated on its own in [`draftCollab.ts`](src/worker/ai/draftCollab.ts), so the worst it can do
is put text in the acting café's own unpublished form.

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
| | `POST /ai/draft-collab` | Draft from one sentence. Never saves anything |
| | `GET /collabs/:id/requests` | Inbox |
| | `POST /requests/:id/accept` | Also `/decline` and `/complete` |

Errors always look like `{ "error": { "code", "message", "fields"? } }`.

## Deploy

One-time setup, from a machine logged in with `npx wrangler login`:

1. Register a `workers.dev` subdomain in the Cloudflare dashboard.
2. Run `npx wrangler d1 create finjan` and put the id in `wrangler.jsonc`.
3. Run `npm run deploy`.

To deploy from GitHub Actions instead, add the secret `CLOUDFLARE_API_TOKEN` and the variable
`CLOUDFLARE_ACCOUNT_ID` to the repository. CI then deploys every push to `main`. It skips the
deploy while the variable is missing, and `main` needs to exist first.
