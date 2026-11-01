# Collab Board

A mobile-first board where businesses post collabs and offers, and creators apply.

**Live link:** https://collab-board.alasmawi.workers.dev

- **Businesses** (cafés, shops, gyms and so on) post collabs and offers, review applicants, accept
  them, and can search for creators and invite them.
- **Creators** browse collabs and offers, apply, and post once they're accepted.

Businesses are always square logos, and creators are always round rings.

[DECISIONS.md](DECISIONS.md) records what changed along the way and the open questions.
[PLAN.md](PLAN.md) is the original plan, under the earlier name Finjan.

## Two-minute demo

Every demo account uses the password `demo-password`, and the welcome screen lists them.

**As a creator (`noor`)**

1. Browse collabs and offers, and filter between them.
2. Open one you haven't applied to, tap **Apply** and send a line about why you fit.
3. In **Applications**, open Layali's invite and tap **Accept invite**.
4. Open an accepted application to see its code, then add your post link.
5. Open **Profile** to see your ring and edit your socials. The ring has one circle per tag, and
   dots mark your formats.

**As a business (`huda`)**

1. **Overview** shows new applicants and what needs a decision.
2. In **Creators**, search for *food*. Tap the sparkle icon for an AI summary, or **Invite** to offer
   them a post.
3. In **My posts**, open one and tap **Accept** on an applicant.
4. Tap the plus button, then the sparkle icon, type a sentence and tap **Fill the form**. Edit it,
   then publish.

**The rule that matters:** open *Karak tasting flight* as `huda` on one phone and `yusuf` on another.
It has one spot left and three creators waiting. Tap Accept on different applicants at the same
moment: one gets the spot, the other sees that a teammate took it. Invites follow the same rule.

## Run it

Needs Node 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

This applies migrations to a local D1 database and serves everything on http://localhost:5173. No
Cloudflare account is needed. Without one, the AI features fall back to plain forms and plain facts.

To open it on a phone on the same Wi-Fi, run this and use the Network address it prints. Anyone on
that network can reach it while it runs.

```bash
npm run dev:phone
```

## Check it

```bash
npm run check
```

That runs the type checker, ESLint and the tests. The tests run in the real Workers runtime against
real D1 (SQLite), so nothing is mocked and no Cloudflare account is needed.

With `npm run dev` running, this checks every screen at 360 and 390px in every preview state. It
drives your installed Chrome, and it's run by hand, not in CI.

```bash
npm run test:ui
```

## The rule that matters most

A post never accepts more creators than it has spots, even with a double tap or two staff accepting
at once. The guard is one SQL statement in
[`requestsRepo.acceptIfSpotAvailable`](src/worker/repositories/requestsRepo.ts). It counts spots and
updates the row in one step, so no other request can get between them. Accepting invites, applying
and editing spots use the same idea. The tests in
[`test/concurrency.test.ts`](test/concurrency.test.ts) and [`test/invites.test.ts`](test/invites.test.ts)
were checked by swapping the guard for "SELECT, then UPDATE" and confirming that they fail.

## Layout

```
src/shared     types, schemas and rules used by both sides
src/worker     routes (HTTP) → services (rules) → repositories (SQL)
src/web        the React app
migrations     schema only; demo data lives in src/worker/demo/seed.ts
test           runs over HTTP against the real Worker
public         app icons and the install manifest
```

In the code, a `collab` has a `kind` of `collab` or `offer`, and a `request` is an application or an
invite.

## The free tier

Everything fits Cloudflare's free plan, checked on 1 Nov 2026:

| Limit | How the app stays inside it |
|---|---|
| 10 ms CPU per request | Rings and logos are drawn in the browser. Password hashing is light (see below) |
| 100k requests, 5M rows read and 100k written a day | Search waits for a pause in typing and returns 30 results at most |
| 10k AI neurons a day | About 33 neurons a summary. Each is saved, and a plain fact line needs no AI |

When the AI allowance runs out the app keeps working: summaries stay as plain facts, and posts are
filled in by hand.

**Accounts are for a demo.** Passwords use 10,000 rounds of PBKDF2 to fit the CPU limit, far below
what real accounts need. There's no email, recovery or login rate limit, and Reset demo wipes anyone
who signed up. Change these first before real use.

## Deploy

One-time setup, from a machine logged in with `npx wrangler login`:

1. Register a `workers.dev` subdomain in the Cloudflare dashboard.
2. Run `npx wrangler d1 create finjan` and put the id in `wrangler.jsonc`.
3. Run `npm run deploy`.

To deploy from GitHub Actions instead, add the secret `CLOUDFLARE_API_TOKEN` and the variable
`CLOUDFLARE_ACCOUNT_ID`. CI then deploys every push to `main`, once that branch exists.
